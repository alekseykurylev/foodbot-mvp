import { verifyMaxInitData } from "@/lib/mini-app/verify/max";
import { verifyTelegramInitData } from "@/lib/mini-app/verify/telegram";
import type { MiniAppProvider, MiniAppSession } from "@/lib/mini-app/types";

export function verifyMiniAppSession(
  provider: MiniAppProvider,
  initData: string,
): MiniAppSession {
  if (provider === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    return verifyTelegramInitData(initData, token);
  }

  const token = process.env.MAX_BOT_TOKEN;

  if (!token) {
    throw new Error("MAX_BOT_TOKEN is not set");
  }

  return verifyMaxInitData(initData, token);
}
