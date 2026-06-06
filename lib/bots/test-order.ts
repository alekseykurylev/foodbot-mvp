import { getPayloadLocal } from "@/lib/cms/payload-local";
import { applyItemsToCart, findActiveCart } from "@/lib/domain/orders";
import type { Customer, Order, Product } from "@/payload-types";

export const TEST_ORDER_COMMAND = "testorder";
export const TEST_ORDER_CALLBACK_PREFIX = "test_order:";

export type TestOrderMode = "append" | "replace";
export type TestOrderChannel = "max" | "telegram";

type TestOrderItem = {
  product: Product["id"];
  quantity: number;
};

export function isTestOrderMode(mode: string): mode is TestOrderMode {
  return mode === "append" || mode === "replace";
}

export function parseTestOrderCallback(data: string | undefined) {
  if (!data?.startsWith(TEST_ORDER_CALLBACK_PREFIX)) {
    return null;
  }

  const mode = data.slice(TEST_ORDER_CALLBACK_PREFIX.length);

  return isTestOrderMode(mode) ? mode : null;
}

export async function hasActiveCart(customerID: Customer["id"]) {
  return Boolean(await findActiveCart(customerID));
}

async function getTestOrderItems(): Promise<TestOrderItem[]> {
  const payload = await getPayloadLocal();
  const result = await payload.find({
    collection: "products",
    depth: 0,
    limit: 3,
    overrideAccess: true,
    sort: "sortOrder",
    where: {
      status: {
        equals: "active",
      },
    },
  });

  const products = result.docs as Product[];

  if (products.length === 0) {
    throw new Error("В каталоге нет активных товаров для тестового заказа.");
  }

  return products.map((product, index) => ({
    product: product.id,
    quantity: index === 0 ? 2 : 1,
  }));
}

export async function createTestOrder(
  customerID: Customer["id"],
  mode: TestOrderMode,
  channel: TestOrderChannel,
) {
  return applyItemsToCart(customerID, await getTestOrderItems(), mode, {
    channel,
    lastEditedBy: "customer",
    source: "manual",
  });
}

export function getTestOrderCallbackData(mode: TestOrderMode) {
  return `${TEST_ORDER_CALLBACK_PREFIX}${mode}`;
}

export function getMiniAppURL() {
  const miniAppURL = process.env.MINI_APP_URL;

  if (!miniAppURL) {
    throw new Error("MINI_APP_URL is not set.");
  }

  return new URL(miniAppURL);
}

export function getMiniAppCartURL() {
  const url = getMiniAppURL();
  const pathname = url.pathname.replace(/\/$/, "");

  if (!pathname.endsWith("/cart")) {
    url.pathname = `${pathname}/cart`;
  }

  url.search = "";
  url.hash = "";

  return url.toString();
}

export function getMaxMiniAppBotName(botUsername?: null | string) {
  const botName = (botUsername ?? process.env.MAX_BOT_NAME)?.trim().replace(/^@/, "");

  if (!botName) {
    throw new Error("MAX_BOT_NAME is not set.");
  }

  return botName;
}

export function getMaxMiniAppCartStartParam() {
  return "cart";
}

export function getMaxMiniAppCartURL(botUsername?: null | string) {
  const botName = getMaxMiniAppBotName(botUsername);
  const url = new URL(`https://max.ru/${encodeURIComponent(botName)}`);

  url.searchParams.set("startapp", getMaxMiniAppCartStartParam());

  return url.toString();
}

export function getTestOrderErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "MINI_APP_URL is not set.") {
      return "Не смог сформировать тестовый заказ: не настроена ссылка Mini App.";
    }

    if (error.message === "MAX_BOT_NAME is not set.") {
      return "Не смог сформировать тестовый заказ: не настроено имя MAX-бота.";
    }

    if (error.message === "В каталоге нет активных товаров для тестового заказа.") {
      return error.message;
    }
  }

  return "Не смог сформировать тестовый заказ. Попробуйте позже.";
}

export function formatOrderSummary(order: Order) {
  const orderTitle = order.orderNumber ? `заказ ${order.orderNumber}` : `заказ #${order.id}`;
  const lines = order.items.map((item) => `- ${item.productNameSnapshot} x ${item.quantity}`);
  const total = new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(order.totals.totalAmount);

  return [`Сформировал тестовый ${orderTitle}.`, "", ...lines, "", `Итого: ${total}`].join("\n");
}
