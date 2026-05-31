import { NextRequest, NextResponse } from "next/server";
import { getTelegramBot } from "@/lib/bots/telegram";
import type { Update } from "grammy/types";

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (secret) {
    const requestSecret = request.headers.get("x-telegram-bot-api-secret-token");

    if (requestSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = (await request.json()) as Update;

  await getTelegramBot().handleUpdate(update);

  return NextResponse.json({ ok: true });
}
