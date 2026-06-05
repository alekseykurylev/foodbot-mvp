"use server";

import { getPayloadLocal } from "@/lib/cms/payload-local";
import { getRelationshipID } from "@/lib/utils/relationship";
import type { Order, Product } from "@/payload-types";
import type { RequiredDataFromCollectionSlug } from "payload";

type CustomerID = Order["customer"];
type OrderItem = Order["items"][number];
type CartSource = Order["source"];
type CartChannel = Order["channel"];
type CartEditor = NonNullable<Order["lastEditedBy"]>;
type CartApplyMode = "append" | "replace";

type CartItemInput = {
  comment?: null | string;
  product: Product["id"];
  quantity?: number;
};

type CartMutationMeta = {
  ai?: Order["ai"];
  channel: CartChannel;
  lastEditedBy: CartEditor;
  source: CartSource;
};

type SubmitOrderInput = {
  delivery?: Partial<NonNullable<Order["delivery"]>>;
  payment?: Partial<NonNullable<Order["payment"]>>;
};

function getCustomerID(customer: CustomerID) {
  return typeof customer === "object" ? customer.id : customer;
}

function normalizeQuantity(quantity: number | undefined) {
  return Math.max(Math.trunc(Number(quantity ?? 1)), 1);
}

function getOrderItemProductID(item: OrderItem) {
  const productID = getRelationshipID(item.product);

  if (!productID) {
    throw new Error("Order item product is missing.");
  }

  return Number(productID);
}

function buildOrderItem(product: Product, quantity: number, comment?: null | string): OrderItem {
  const normalizedQuantity = normalizeQuantity(quantity);

  return {
    product: product.id,
    productNameSnapshot: product.name,
    unitPriceSnapshot: product.price,
    quantity: normalizedQuantity,
    lineTotalSnapshot: product.price * normalizedQuantity,
    comment: comment ?? undefined,
  };
}

async function findActiveProduct(productID: Product["id"]) {
  const payload = await getPayloadLocal();
  const product = (await payload.findByID({
    collection: "products",
    id: productID,
    depth: 0,
    overrideAccess: true,
  })) as Product;

  if (product.status !== "active") {
    throw new Error(`Product ${product.id} is not available.`);
  }

  return product;
}

async function buildOrderItems(inputs: CartItemInput[]) {
  const itemsByProduct = new Map<Product["id"], CartItemInput>();

  for (const input of inputs) {
    const existing = itemsByProduct.get(input.product);

    if (existing) {
      itemsByProduct.set(input.product, {
        ...existing,
        comment: input.comment ?? existing.comment,
        quantity: normalizeQuantity(existing.quantity) + normalizeQuantity(input.quantity),
      });
      continue;
    }

    itemsByProduct.set(input.product, {
      ...input,
      quantity: normalizeQuantity(input.quantity),
    });
  }

  const items = await Promise.all(
    [...itemsByProduct.values()].map(async (input) => {
      const product = await findActiveProduct(input.product);

      return buildOrderItem(product, normalizeQuantity(input.quantity), input.comment);
    }),
  );

  if (items.length === 0) {
    throw new Error("Cart must contain at least one item.");
  }

  return items;
}

function mergeOrderItems(existingItems: OrderItem[], newItems: OrderItem[]) {
  const merged = new Map<Product["id"], OrderItem>();

  for (const item of existingItems) {
    merged.set(getOrderItemProductID(item), item);
  }

  for (const item of newItems) {
    const productID = getOrderItemProductID(item);
    const existing = merged.get(productID);

    if (!existing) {
      merged.set(productID, item);
      continue;
    }

    const quantity = normalizeQuantity(existing.quantity) + normalizeQuantity(item.quantity);

    merged.set(productID, {
      ...existing,
      productNameSnapshot: item.productNameSnapshot,
      unitPriceSnapshot: item.unitPriceSnapshot,
      quantity,
      lineTotalSnapshot: item.unitPriceSnapshot * quantity,
      comment: item.comment ?? existing.comment,
    });
  }

  return [...merged.values()];
}

/**
 * Находит активную корзину клиента. Возвращает null, если клиент еще ничего не добавлял.
 */
export async function findActiveCart(customerID: CustomerID) {
  const payload = await getPayloadLocal();

  const result = await payload.find({
    collection: "orders",
    depth: 2,
    limit: 1,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [
        {
          customer: {
            equals: getCustomerID(customerID),
          },
        },
        {
          status: {
            equals: "cart",
          },
        },
      ],
    },
  });

  return (result.docs[0] as Order | undefined) ?? null;
}

/**
 * Создает корзину только с первым набором товаров. Пустые корзины не создаются.
 */
export async function createCartWithItems(
  customerID: CustomerID,
  items: CartItemInput[],
  meta: CartMutationMeta,
) {
  const payload = await getPayloadLocal();
  const orderItems = await buildOrderItems(items);

  try {
    const data = {
      ai: meta.ai,
      channel: meta.channel,
      customer: getCustomerID(customerID),
      items: orderItems,
      lastEditedBy: meta.lastEditedBy,
      source: meta.source,
      status: "cart",
    } as unknown as RequiredDataFromCollectionSlug<"orders">;

    return (await payload.create({
      collection: "orders",
      data,
      depth: 2,
      overrideAccess: true,
    })) as Order;
  } catch (error) {
    const activeCart = await findActiveCart(customerID);

    if (activeCart) {
      return updateCartItems(activeCart, mergeOrderItems(activeCart.items, orderItems), meta);
    }

    throw error;
  }
}

/**
 * Возвращает активную корзину или создает ее с первым товаром.
 */
export async function getOrCreateCartWithItems(
  customerID: CustomerID,
  items: CartItemInput[],
  meta: CartMutationMeta,
) {
  const activeCart = await findActiveCart(customerID);
  const orderItems = await buildOrderItems(items);

  if (activeCart) {
    return updateCartItems(activeCart, mergeOrderItems(activeCart.items, orderItems), meta);
  }

  return createCartWithItems(customerID, items, meta);
}

async function updateCartItems(cart: Order, items: OrderItem[], meta: CartMutationMeta) {
  if (cart.status !== "cart") {
    throw new Error("Only cart orders can be changed by customer or AI.");
  }

  if (items.length === 0) {
    return deleteOrder(cart.id);
  }

  const payload = await getPayloadLocal();

  return (await payload.update({
    collection: "orders",
    id: cart.id,
    data: {
      ai: meta.ai ?? cart.ai,
      items,
      lastEditedBy: meta.lastEditedBy,
    },
    depth: 2,
    overrideAccess: true,
  })) as Order;
}

/**
 * Добавляет товар в активную корзину. Если корзины еще нет, создает ее.
 */
export async function addCartItem(
  customerID: CustomerID,
  item: CartItemInput,
  meta: CartMutationMeta,
) {
  return getOrCreateCartWithItems(customerID, [item], meta);
}

/**
 * Меняет количество позиции в корзине. Количество 0 удаляет позицию.
 */
export async function updateCartItemQuantity(
  customerID: CustomerID,
  productID: Product["id"],
  quantity: number,
  meta: CartMutationMeta,
) {
  const activeCart = await findActiveCart(customerID);

  if (!activeCart) {
    return null;
  }

  const normalizedQuantity = Math.trunc(Number(quantity));
  const nextItems = activeCart.items
    .map((item) => {
      if (getOrderItemProductID(item) !== productID) {
        return item;
      }

      if (normalizedQuantity <= 0) {
        return null;
      }

      return {
        ...item,
        quantity: normalizedQuantity,
        lineTotalSnapshot: Number(item.unitPriceSnapshot) * normalizedQuantity,
      };
    })
    .filter((item): item is OrderItem => Boolean(item));

  return updateCartItems(activeCart, nextItems, meta);
}

/**
 * Удаляет товар из активной корзины. Если удаляется последняя позиция, удаляет корзину.
 */
export async function removeCartItem(
  customerID: CustomerID,
  productID: Product["id"],
  meta: CartMutationMeta,
) {
  return updateCartItemQuantity(customerID, productID, 0, meta);
}

/**
 * Применяет AI-предложение к корзине: заменяет ее целиком или добавляет товары.
 */
export async function applyAiSuggestionToCart(
  customerID: CustomerID,
  items: CartItemInput[],
  mode: CartApplyMode,
  meta: Omit<CartMutationMeta, "lastEditedBy" | "source"> & { source?: CartSource },
) {
  const activeCart = await findActiveCart(customerID);
  const aiMeta: CartMutationMeta = {
    ...meta,
    lastEditedBy: "ai",
    source: meta.source ?? "ai",
  };
  const suggestionItems = await buildOrderItems(items);

  if (!activeCart) {
    return createCartWithItems(customerID, items, aiMeta);
  }

  const nextItems =
    mode === "replace" ? suggestionItems : mergeOrderItems(activeCart.items, suggestionItems);

  return updateCartItems(activeCart, nextItems, aiMeta);
}

/**
 * Находит публичный заказ-корзину по токену.
 * Возвращает null, если токен неизвестен или заказ истек.
 */
export async function findOrderByPublicToken(token: string) {
  const payload = await getPayloadLocal();

  const result = await payload.find({
    collection: "orders",
    depth: 2,
    limit: 1,
    overrideAccess: true,
    where: {
      publicToken: {
        equals: token,
      },
    },
  });

  const order = result.docs[0] as Order | undefined;

  if (!order) {
    return null;
  }

  if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
    return null;
  }

  return order;
}

/**
 * Обновляет только workflow-статус заказа.
 */
export async function updateOrderStatus(id: Order["id"], status: Order["status"]) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      status,
    },
    overrideAccess: true,
  });
}

/**
 * Заменяет блок доставки в заказе.
 */
export async function updateOrderDelivery(
  id: Order["id"],
  delivery: Partial<NonNullable<Order["delivery"]>>,
) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      delivery,
    },
    overrideAccess: true,
  });
}

/**
 * Заменяет блок оплаты в заказе.
 */
export async function updateOrderPayment(
  id: Order["id"],
  payment: Partial<NonNullable<Order["payment"]>>,
) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      payment,
    },
    overrideAccess: true,
  });
}

/**
 * Отмечает заказ как отмененный и фиксирует время отмены.
 */
export async function cancelOrder(id: Order["id"]) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      cancelledAt: new Date().toISOString(),
      status: "cancelled",
    },
    overrideAccess: true,
  });
}

/**
 * Отмечает заказ и оплату как оплаченные.
 */
export async function markOrderAsPaid(id: Order["id"]) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      paidAt: new Date().toISOString(),
      payment: {
        status: "paid",
      },
      status: "paid",
    },
    overrideAccess: true,
  });
}

/**
 * Отмечает корзину как отправленный заказ и фиксирует время отправки.
 */
export async function submitOrder(id: Order["id"], input: SubmitOrderInput = {}) {
  const payload = await getPayloadLocal();
  const order = (await payload.findByID({
    collection: "orders",
    id,
    depth: 0,
    overrideAccess: true,
  })) as Order;

  if (order.status !== "cart") {
    throw new Error("Only cart orders can be submitted.");
  }

  const data = {
    ...(input.delivery ? { delivery: input.delivery } : {}),
    ...(input.payment ? { payment: input.payment } : {}),
    status: "submitted" as const,
    submittedAt: new Date().toISOString(),
  };

  return payload.update({
    collection: "orders",
    id,
    data,
    overrideAccess: true,
  });
}

/**
 * Отправляет активную корзину клиента. После этого клиент и AI больше не редактируют заказ.
 */
export async function submitActiveCart(customerID: CustomerID, input: SubmitOrderInput = {}) {
  const activeCart = await findActiveCart(customerID);

  if (!activeCart) {
    throw new Error("Active cart was not found.");
  }

  return submitOrder(activeCart.id, input);
}

/**
 * Удаляет заказ по ID.
 */
export async function deleteOrder(id: Order["id"]) {
  const payload = await getPayloadLocal();

  return payload.delete({
    collection: "orders",
    id,
    overrideAccess: true,
  });
}

/**
 * Считает все заказы, связанные с клиентом.
 */
export async function countCustomerOrders(customerID: Order["customer"]) {
  const payload = await getPayloadLocal();

  return payload.count({
    collection: "orders",
    overrideAccess: true,
    where: {
      customer: {
        equals: getCustomerID(customerID),
      },
    },
  });
}
