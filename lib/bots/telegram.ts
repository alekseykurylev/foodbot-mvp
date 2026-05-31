import { Bot, GrammyError, HttpError } from "grammy";
import { TELEGRAM_BOT_COMMANDS } from "@/lib/bots/commands";

let telegramBot: Bot | undefined;

function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  return token;
}

export function getTelegramBot() {
  if (telegramBot) {
    return telegramBot;
  }

  const bot = new Bot(getTelegramBotToken());

  bot.init = async (...args: Parameters<typeof bot.init>) => {
    const [signal] = args;

    await Bot.prototype.init.call(bot, signal);
    await bot.api.setMyCommands(TELEGRAM_BOT_COMMANDS, undefined, signal);
  };

  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "друг";

    await ctx.reply(
      `Привет, ${name}! Я помогу собрать заказ. Скоро здесь будет меню, корзина и подбор еды на компанию.`,
    );
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("Меню скоро появится в Mini App. Пока можно написать, что хотите заказать.");
  });

  bot.on("message:text", async (ctx) => {
    await ctx.reply(
      "Принял сообщение. Следующий шаг MVP: связать этот чат с меню, корзиной и уведомлениями администратору.",
    );
  });

  bot.catch((err) => {
    const ctx = err.ctx;

    console.error(`Telegram bot error while handling update ${ctx.update.update_id}`);

    if (err.error instanceof GrammyError) {
      console.error("Telegram API error:", err.error.description);
      return;
    }

    if (err.error instanceof HttpError) {
      console.error("Telegram network error:", err.error);
      return;
    }

    console.error("Unknown Telegram bot error:", err.error);
  });

  telegramBot = bot;

  return bot;
}
