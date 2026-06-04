import { Bot, GrammyError, HttpError, Keyboard } from "grammy";
import { TELEGRAM_BOT_COMMANDS } from "@/lib/bots/commands";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { askDeepSeek } from "@/lib/integrations/deepseek";

let telegramBot: Bot | undefined;

function getTelegramDisplayName(user: { first_name?: string; last_name?: string }) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

async function upsertTelegramCustomer(user: {
  first_name?: string;
  id: number | string;
  last_name?: string;
  username?: string;
}) {
  await upsertBotCustomer({
    channel: "telegram",
    telegramUserId: user.id,
    telegramUsername: user.username,
    displayName: getTelegramDisplayName(user),
  });
}

async function saveTelegramCustomerPhone(
  user: {
    first_name?: string;
    id: number | string;
    last_name?: string;
    username?: string;
  },
  phone: string,
) {
  await saveBotCustomerPhone({
    channel: "telegram",
    telegramUserId: user.id,
    telegramUsername: user.username,
    displayName: getTelegramDisplayName(user),
    phone,
  });
}

function getTelegramContactKeyboard() {
  return new Keyboard()
    .requestContact("Поделиться телефоном")
    .oneTime()
    .resized();
}

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

    if (ctx.from) {
      await upsertTelegramCustomer(ctx.from);
    }

    await ctx.reply(
      `Привет, ${name}! Я помогу собрать заказ. Скоро здесь будет меню, корзина и подбор еды на компанию.`,
    );
  });

  bot.command("menu", async (ctx) => {
    if (ctx.from) {
      await upsertTelegramCustomer(ctx.from);
    }

    await ctx.reply("Меню скоро появится в Mini App. Пока можно написать, что хотите заказать.");
  });

  bot.command("phone", async (ctx) => {
    if (ctx.from) {
      await upsertTelegramCustomer(ctx.from);
    }

    await ctx.reply("Поделитесь номером телефона, чтобы мы могли связаться по заказу.", {
      reply_markup: getTelegramContactKeyboard(),
    });
  });

  bot.on("message:contact", async (ctx) => {
    const contactUserId = ctx.message.contact.user_id;

    if (!ctx.from) {
      await ctx.reply("Не удалось определить пользователя. Попробуйте отправить номер еще раз.");
      return;
    }

    if (contactUserId && contactUserId !== ctx.from.id) {
      await ctx.reply("Пожалуйста, отправьте свой номер через кнопку /phone.");
      return;
    }

    await saveTelegramCustomerPhone(ctx.from, ctx.message.contact.phone_number);
    await ctx.reply("Спасибо, сохранил ваш телефон.", {
      reply_markup: { remove_keyboard: true },
    });
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.from) {
      await upsertTelegramCustomer(ctx.from);
    }

    await ctx.reply(await askDeepSeek(ctx.message.text));
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
