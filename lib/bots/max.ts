import { Bot, Keyboard as MaxKeyboard } from "@maxhub/max-bot-api";
import type { Update, User } from "@maxhub/max-bot-api/types";
import { MAX_BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getMaxMiniAppUrl, getCartMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { handleAiMessage, handleAiCallback } from "@/lib/bots/ai-assistant";
import { askDeepSeek } from "@/lib/integrations/deepseek";

// ---------------------------------------------------------------------------
// Хелперы
// ---------------------------------------------------------------------------

async function upsertMaxCustomer(user: User) {
  return upsertBotCustomer({
    channel: "max",
    maxUserId: user.user_id,
    maxFirstName: user.name,
    displayName: user.name,
  });
}

async function saveMaxCustomerPhone(user: User, phone: string) {
  await saveBotCustomerPhone({
    channel: "max",
    maxUserId: user.user_id,
    maxFirstName: user.name,
    displayName: user.name,
    phone,
  });
}

function getContactKeyboard() {
  return MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.requestContact(BOT_TEXTS.phoneButton)]]);
}

function getCartMiniAppKeyboard() {
  const url = getMaxMiniAppUrl(getCartMiniAppUrl());

  return MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.link(BOT_TEXTS.cartOpen, url)]]);
}

function getCartChoiceKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.callback(BOT_TEXTS.cartAppend, BOT_TEXTS.callbackAppend)],
    [MaxKeyboard.button.callback(BOT_TEXTS.cartReplace, BOT_TEXTS.callbackReplace)],
  ]);
}

// ---------------------------------------------------------------------------
// AI-хелперы
// ---------------------------------------------------------------------------

async function handleTextMessage(
  ctx: { reply: (text: string, params?: Record<string, unknown>) => Promise<unknown> },
  sender: User,
  text: string,
) {
  const customer = await upsertMaxCustomer(sender);
  const result = await handleAiMessage(customer, text, "max");

  if (result.type === "question") {
    await ctx.reply(result.text);
    return;
  }

  if (result.type === "existing_cart") {
    await ctx.reply(result.text, {
      attachments: [getCartChoiceKeyboard()],
    });
    return;
  }

  if (result.type === "suggestion") {
    await ctx.reply(result.text, {
      attachments: [getCartMiniAppKeyboard()],
    });
    return;
  }
}

// ---------------------------------------------------------------------------
// Фабрика бота (синглтон)
// ---------------------------------------------------------------------------

let bot: Bot | undefined;
let initPromise: Promise<void> | undefined;

export function getMaxBot() {
  if (bot) {
    return bot;
  }

  bot = new Bot(getBotToken("MAX_BOT_TOKEN"));

  bot.on("bot_started", async (ctx) => {
    if (ctx.user) {
      await upsertMaxCustomer(ctx.user);
    }

    await ctx.reply(BOT_TEXTS.start);
  });

  bot.command("start", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(BOT_TEXTS.start);
  });

  bot.command("menu", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    const url = getMaxMiniAppUrl();

    await ctx.reply(BOT_TEXTS.menu, {
      attachments: [
        MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.link(BOT_TEXTS.menuButton, url)]]),
      ],
    });
  });

  bot.command("phone", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(BOT_TEXTS.phoneRequest, {
      attachments: [getContactKeyboard()],
    });
  });

  bot.on("message_created", async (ctx) => {
    const text = ctx.message.body.text?.trim();
    const sender = ctx.message.sender;
    const phone = ctx.contactInfo?.tel;

    // Контакт
    if (phone) {
      if (!sender) {
        await ctx.reply(BOT_TEXTS.userNotIdentified);
        return;
      }

      await saveMaxCustomerPhone(sender, phone);
      await ctx.reply(BOT_TEXTS.phoneSaved);
      return;
    }

    // Текстовое сообщение
    if (!text) {
      await ctx.reply(BOT_TEXTS.nonText);
      return;
    }

    // Если похоже на команду — простой текстовый ответ
    if (text.startsWith("/")) {
      await ctx.reply(await askDeepSeek(text));
      return;
    }

    if (sender) {
      await handleTextMessage(ctx, sender, text);
      return;
    }

    await ctx.reply(BOT_TEXTS.userNotIdentified);
  });

  // Обработка нажатий на callback-кнопки
  bot.on("message_callback", async (ctx) => {
    const payload = ctx.callback?.payload;

    if (!payload) {
      return;
    }

    // Кнопки AI: «Добавить в заказ» / «Заменить заказ»
    if (payload === BOT_TEXTS.callbackAppend || payload === BOT_TEXTS.callbackReplace) {
      const user = ctx.user;

      if (!user) {
        await ctx.reply(BOT_TEXTS.userNotIdentified);
        return;
      }

      const mode = payload === BOT_TEXTS.callbackAppend ? "append" : "replace";
      const customer = await upsertMaxCustomer(user);
      const result = await handleAiCallback(customer, mode, "max");

      if (result.type === "error") {
        await ctx.reply(result.text);
        return;
      }

      await ctx.reply(result.text, {
        attachments: [getCartMiniAppKeyboard()],
      });

      return;
    }
  });

  bot.catch((err, ctx) => {
    console.error(`MAX bot error while handling ${ctx.update.update_type}:`, err);
  });

  return bot;
}

// ---------------------------------------------------------------------------
// Обработчик вебхуков
// ---------------------------------------------------------------------------

type WebhookMaxBot = { handleUpdate(update: Update): Promise<void> };

export async function handleMaxUpdate(update: Update) {
  const instance = getMaxBot();
  const webhook = instance as unknown as WebhookMaxBot;

  // Регистрируем команды один раз
  if (!instance.botInfo) {
    initPromise ??= instance.api.setMyCommands(MAX_BOT_COMMANDS).then((botInfo) => {
      instance.botInfo = botInfo;
    });
    await initPromise;
  }

  await webhook.handleUpdate(update);
}
