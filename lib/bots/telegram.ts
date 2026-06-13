import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from "grammy";
import { BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getTelegramMiniAppUrl, getCartMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { handleAiMessage, handleAiCallback } from "@/lib/bots/ai-assistant";
import { askDeepSeek } from "@/lib/integrations/deepseek";

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

function getCartMiniAppKeyboard(cartId: number) {
  const url = getTelegramMiniAppUrl(getCartMiniAppUrl(cartId));

  return new InlineKeyboard().webApp(BOT_TEXTS.cartOpen, url);
}

// ---------------------------------------------------------------------------
// AI-хелперы
// ---------------------------------------------------------------------------

async function handleTextMessage(
  ctx: {
    from: TgUser;
    reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
    replyWithHTML?: (text: string) => Promise<unknown>;
  },
  text: string,
) {
  const customer = await upsertCustomer(ctx.from);
  const result = await handleAiMessage(customer, text, "telegram");

  if (result.type === "question") {
    await ctx.reply(result.text);
    return;
  }

  if (result.type === "existing_cart") {
    await ctx.reply(result.text, {
      reply_markup: new InlineKeyboard([
        [InlineKeyboard.text(BOT_TEXTS.cartAppend, BOT_TEXTS.callbackAppend)],
        [InlineKeyboard.text(BOT_TEXTS.cartReplace, BOT_TEXTS.callbackReplace)],
      ]),
    });
    return;
  }

  if (result.type === "suggestion") {
    await ctx.reply(result.text, {
      reply_markup: getCartMiniAppKeyboard(result.cartId),
    });
    return;
  }
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

  // Регистрируем команды при bot.init (вызывается grammy runner / webhook callback)
  instance.init = async (...args: Parameters<typeof instance.init>) => {
    const [signal] = args;

    await Bot.prototype.init.call(instance, signal);
    await instance.api.setMyCommands(BOT_COMMANDS, undefined, signal);
  };

  instance.command("start", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    await ctx.reply(BOT_TEXTS.start);
  });

  instance.command("menu", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    const url = getTelegramMiniAppUrl();

    await ctx.reply(BOT_TEXTS.menu, {
      reply_markup: new InlineKeyboard().webApp(BOT_TEXTS.menuButton, url),
    });
  });

  instance.command("phone", async (ctx) => {
    if (ctx.from) {
      await upsertCustomer(ctx.from);
    }

    await ctx.reply(BOT_TEXTS.phoneRequest, {
      reply_markup: getContactKeyboard(),
    });
  });

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

  instance.on("message:text", async (ctx) => {
    // Если сообщение выглядит как команда — пропускаем (уже обработано command())
    const text = ctx.message.text.trim();

    if (text.startsWith("/")) {
      await ctx.reply(await askDeepSeek(text));
      return;
    }

    if (ctx.from) {
      await handleTextMessage(ctx, text);
      return;
    }

    await ctx.reply(BOT_TEXTS.userNotIdentified);
  });

  // Обработка нажатий на inline-кнопки
  instance.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (!ctx.from) {
      await ctx.answerCallbackQuery({ text: BOT_TEXTS.userNotIdentified });
      return;
    }

    // Кнопки AI: «Добавить в заказ» / «Заменить заказ»
    if (data === BOT_TEXTS.callbackAppend || data === BOT_TEXTS.callbackReplace) {
      const mode = data === BOT_TEXTS.callbackAppend ? "append" : "replace";

      await ctx.answerCallbackQuery();

      const customer = await upsertCustomer(ctx.from);
      const result = await handleAiCallback(customer, mode, "telegram");

      if (result.type === "error") {
        await ctx.reply(result.text);
        return;
      }

      // Редактируем исходное сообщение — показываем результат
      await ctx.editMessageText(result.text, {
        reply_markup: getCartMiniAppKeyboard(result.cartId),
      });

      return;
    }

    await ctx.answerCallbackQuery({ text: "Неизвестное действие." });
  });

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
