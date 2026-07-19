import { Bot, Keyboard as MaxKeyboard } from "@maxhub/max-bot-api";
import type { Update } from "@maxhub/max-bot-api/types";
import { MAX_BOT_COMMANDS } from "@/modules/bots/commands";
import { getBotToken } from "@/modules/bots/shared";
import { getMaxCartAppUrl, getMaxMenuAppUrl } from "@/modules/bots/urls";
import { BOT_TEXTS } from "@/modules/bots/texts";

// ---------------------------------------------------------------------------
// Хелперы
// ---------------------------------------------------------------------------

function getStartKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMenuAppUrl())],
    [MaxKeyboard.button.link(BOT_TEXTS.cartButton, getMaxCartAppUrl())],
  ]);
}

function getMenuKeyboard() {
  return MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMenuAppUrl())]]);
}

function getCartKeyboard() {
  return MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.link(BOT_TEXTS.cartButton, getMaxCartAppUrl())]]);
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

  // Первый запуск бота пользователем
  bot.on("bot_started", async (ctx) => {
    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /start
  bot.command("start", async (ctx) => {
    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /menu
  bot.command("menu", async (ctx) => {
    await ctx.reply(BOT_TEXTS.menu, {
      attachments: [getMenuKeyboard()],
    });
  });

  // /cart
  bot.command("cart", async (ctx) => {
    await ctx.reply(BOT_TEXTS.cart, {
      attachments: [getCartKeyboard()],
    });
  });

  // Входящие сообщения
  bot.on("message_created", async (ctx) => {
    const text = ctx.message.body.text?.trim();
    const sender = ctx.message.sender;
    // Текст
    if (!text) {
      await ctx.reply(BOT_TEXTS.start, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    // Команды обработаны выше
    if (text.startsWith("/")) {
      return;
    }

    if (!sender) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
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

  if (!instance.botInfo) {
    initPromise ??= instance.api.setMyCommands(MAX_BOT_COMMANDS).then((botInfo) => {
      instance.botInfo = botInfo;
    });
    await initPromise;
  }

  await webhook.handleUpdate(update);
}
