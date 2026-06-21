import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from "grammy";
import { BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getTelegramAiAppUrl, getTelegramMenuAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";

// ---------------------------------------------------------------------------
// Хелперы
// ---------------------------------------------------------------------------

type TgUser = { first_name?: string; id: number | string; last_name?: string; username?: string };

function getDisplayName(user: TgUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

async function upsertCustomer(user: TgUser) {
  return upsertBotCustomer({
    channel: "telegram",
    telegramUserId: user.id,
    telegramUsername: user.username,
    displayName: getDisplayName(user),
  });
}

async function saveCustomerPhone(user: TgUser, phone: string) {
  await saveBotCustomerPhone({
    channel: "telegram",
    telegramUserId: user.id,
    telegramUsername: user.username,
    displayName: getDisplayName(user),
    phone,
  });
}

function getContactKeyboard() {
  return new Keyboard().requestContact(BOT_TEXTS.phoneButton).oneTime().resized();
}

function getStartKeyboard() {
  return new InlineKeyboard([
    [InlineKeyboard.webApp(BOT_TEXTS.menuButton, getTelegramMenuAppUrl())],
    [InlineKeyboard.webApp(BOT_TEXTS.helpButton, getTelegramAiAppUrl())],
  ]);
}

// ---------------------------------------------------------------------------
// Фабрика бота (синглтон)
// ---------------------------------------------------------------------------

let bot: Bot | undefined;

export function getTelegramBot() {
  if (bot) {
    return bot;
  }

  const instance = new Bot(getBotToken("TELEGRAM_BOT_TOKEN"));

  instance.init = async (...args: Parameters<typeof instance.init>) => {
    const [signal] = args;

    await Bot.prototype.init.call(instance, signal);
    await instance.api.setMyCommands(BOT_COMMANDS, undefined, signal);
  };

  // /start — приветствие с двумя кнопками
  instance.command("start", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    await ctx.reply(BOT_TEXTS.start, {
      reply_markup: getStartKeyboard(),
    });
  });

  // /menu — открыть мини-приложение
  instance.command("menu", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    await ctx.reply(BOT_TEXTS.menu, {
      reply_markup: new InlineKeyboard().webApp(BOT_TEXTS.menuButton, getTelegramMenuAppUrl()),
    });
  });

  // /phone — поделиться телефоном
  instance.command("phone", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    await ctx.reply(BOT_TEXTS.phoneRequest, {
      reply_markup: getContactKeyboard(),
    });
  });

  // Контакт
  instance.on("message:contact", async (ctx) => {
    const contactUserId = ctx.message.contact.user_id;

    if (!ctx.from) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    if (contactUserId && contactUserId !== ctx.from.id) {
      await ctx.reply(BOT_TEXTS.wrongContact);
      return;
    }

    await saveCustomerPhone(ctx.from, ctx.message.contact.phone_number);
    await ctx.reply(BOT_TEXTS.phoneSaved, {
      reply_markup: { remove_keyboard: true },
    });
  });

  // Текстовые сообщения
  instance.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();

    // Команды уже обработаны выше
    if (text.startsWith("/")) {
      return;
    }

    if (!ctx.from) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    await upsertCustomer(ctx.from);
    await ctx.reply(BOT_TEXTS.openAppHint, {
      reply_markup: getStartKeyboard(),
    });
  });

  // Ошибки
  instance.catch((err) => {
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

  bot = instance;
  return instance;
}
