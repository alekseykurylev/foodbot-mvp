"use server";

import { getPayloadLocal } from "@/lib/cms/payload-local";
import type { Order } from "@/payload-types";

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
export async function submitOrder(id: Order["id"]) {
  const payload = await getPayloadLocal();

  return payload.update({
    collection: "orders",
    id,
    data: {
      status: "submitted",
      submittedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  });
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
        equals: typeof customerID === "object" ? customerID.id : customerID,
      },
    },
  });
}
