import { Bot, Keyboard as MaxKeyboard } from "@maxhub/max-bot-api";
import type { Update, User } from "@maxhub/max-bot-api/types";
import { MAX_BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getMaxMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { buildProposal, isProcessing } from "@/lib/bots/ai";

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

function getStartKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMiniAppUrl())],
    [MaxKeyboard.button.callback(BOT_TEXTS.helpButton, BOT_TEXTS.callbackHelp)],
  ]);
}

function getProposalKeyboard(proposalUrl: string) {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.link(BOT_TEXTS.proposalButton, getMaxMiniAppUrl(proposalUrl))],
  ]);
}

// ---------------------------------------------------------------------------
// Обработка заказа через AI
// ---------------------------------------------------------------------------

async function processOrder(
  ctx: {
    reply: (text: string, params?: Record<string, unknown>) => Promise<unknown>;
    sendAction?: (action: "typing_on") => Promise<unknown>;
  },
  user: User,
  text: string,
) {
  // Показываем набор текста
  ctx.sendAction?.("typing_on").catch(() => {});

  const customer = await upsertMaxCustomer(user);
  const result = await buildProposal(customer, text, "max");

  if (!result) {
    await ctx.reply("Не удалось подобрать заказ. Попробуйте уточнить запрос.");
    return;
  }

  await ctx.reply(result.message, {
    attachments: [getProposalKeyboard(result.proposalUrl)],
  });
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
    if (ctx.user) {
      await upsertMaxCustomer(ctx.user);
    }

    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /start
  bot.command("start", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /menu
  bot.command("menu", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(BOT_TEXTS.menu, {
      attachments: [
        MaxKeyboard.inlineKeyboard([
          [MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMiniAppUrl())],
        ]),
      ],
    });
  });

  // /phone
  bot.command("phone", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(BOT_TEXTS.phoneRequest, {
      attachments: [getContactKeyboard()],
    });
  });

  // Callback: кнопка «Собрать корзину»
  bot.on("message_callback", async (ctx) => {
    const payload = ctx.callback?.payload;

    if (!payload || payload !== BOT_TEXTS.callbackHelp) {
      return;
    }

    await ctx.reply(BOT_TEXTS.helpPrompt);
  });

  // Входящие сообщения
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

    // Текст
    if (!text) {
      await ctx.reply(BOT_TEXTS.nonText);
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

    // Бот занят
    if (isProcessing(Number(sender.user_id))) {
      await ctx.reply(BOT_TEXTS.busy);
      return;
    }

    await processOrder(
      ctx as {
        reply: (text: string, params?: Record<string, unknown>) => Promise<unknown>;
        sendAction?: (action: "typing_on") => Promise<unknown>;
      },
      sender,
      text,
    );
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
