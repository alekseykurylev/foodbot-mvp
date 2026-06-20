import { webhookCallback } from "grammy";
import { getTelegramBot } from "@/lib/bots/telegram";

export const maxDuration = 60;

export const POST = webhookCallback(getTelegramBot(), "std/http", {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  timeoutMilliseconds: 55_000,
});
