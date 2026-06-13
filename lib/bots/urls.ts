function getAppUrl(): string {
  const url = process.env.MINI_APP_URL;

  if (!url) {
    throw new Error("MINI_APP_URL is not set");
  }

  return url;
}

function getMaxBotName(): string {
  const name = process.env.MAX_BOT_NAME;

  if (!name) {
    throw new Error("MAX_BOT_NAME is not set");
  }

  return name;
}

/** URL мини-приложения для Telegram (прямая ссылка) */
export function getTelegramMiniAppUrl(path = ""): string {
  return `${getAppUrl()}${path}`;
}

/** Диплинк мини-приложения для MAX */
export function getMaxMiniAppUrl(payload?: string): string {
  const base = `https://max.ru/${getMaxBotName()}?startapp`;
  return payload ? `${base}=${payload}` : base;
}

/** URL страницы корзины в мини-приложении */
export function getCartMiniAppUrl(orderId?: number | string): string {
  const base = `/cart`;
  return orderId ? `${base}?orderId=${orderId}` : base;
}
