import { Bot, Keyboard as MaxKeyboard } from "@maxhub/max-bot-api";
import type { Update, User } from "@maxhub/max-bot-api/types";
import { MAX_BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getMaxMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { cancelProposalFlow, processProposalPrompt, startProposalFlow } from "@/lib/bots/ai";

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

type MaxKeyboardRows = Parameters<typeof MaxKeyboard.inlineKeyboard>[0];
type MaxKeyboardButton = MaxKeyboardRows[number][number];
type MaxRawButton =
  | MaxKeyboardButton
  | { type: "message"; text: string }
  | { contact_id?: number; text: string; type: "open_app"; web_app?: string };

function inlineKeyboard(buttons: MaxRawButton[][]) {
  return MaxKeyboard.inlineKeyboard(buttons as MaxKeyboardRows);
}

function messageButton(text: string): MaxRawButton {
  return { type: "message", text };
}

function openAppButton(text: string, webApp?: string): MaxRawButton {
  return { text, type: "open_app", web_app: webApp };
}

function getContactKeyboard() {
  return inlineKeyboard([[MaxKeyboard.button.requestContact(BOT_TEXTS.phoneButton)]]);
}

function getStartKeyboard() {
  return inlineKeyboard([
    [openAppButton(BOT_TEXTS.menuButton, getMaxMiniAppUrl())],
    [messageButton(BOT_TEXTS.helpButton)],
  ]);
}

function getHelpKeyboard() {
  return inlineKeyboard([[messageButton("Отмена")]]);
}

function getProposalKeyboard(proposalUrl: string) {
  return inlineKeyboard([
    [openAppButton(BOT_TEXTS.proposalButton, getMaxMiniAppUrl(proposalUrl))],
  ]);
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
      const customer = await upsertMaxCustomer(ctx.user);
      await cancelProposalFlow({
        channel: "max",
        customer,
        providerUserId: ctx.user.user_id,
      });
    }

    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /start
  bot.command("start", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      const customer = await upsertMaxCustomer(sender);
      await cancelProposalFlow({
        channel: "max",
        customer,
        providerUserId: sender.user_id,
      });
    }

    await ctx.reply(BOT_TEXTS.start, {
      attachments: [getStartKeyboard()],
    });
  });

  // /menu
  bot.command("menu", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      const customer = await upsertMaxCustomer(sender);
      await cancelProposalFlow({
        channel: "max",
        customer,
        providerUserId: sender.user_id,
      });
    }

    await ctx.reply(BOT_TEXTS.menu, {
      attachments: [inlineKeyboard([[openAppButton(BOT_TEXTS.menuButton, getMaxMiniAppUrl())]])],
    });
  });

  // /cancel
  bot.command("cancel", async (ctx) => {
    const sender = ctx.message.sender;

    if (!sender) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    const customer = await upsertMaxCustomer(sender);
    await cancelProposalFlow({
      channel: "max",
      customer,
      providerUserId: sender.user_id,
    });
    await ctx.reply(BOT_TEXTS.helpCancelled, {
      attachments: [getStartKeyboard()],
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

  // Callback: «Отмена»
  bot.action(BOT_TEXTS.callbackCancel, async (ctx) => {
    const user = ctx.user;

    if (!user) {
      return;
    }

    const customer = await upsertMaxCustomer(user);
    await cancelProposalFlow({
      channel: "max",
      customer,
      providerUserId: user.user_id,
    });
    await ctx.answerOnCallback({
      message: {
        attachments: [getStartKeyboard()],
        text: BOT_TEXTS.helpCancelled,
      },
      notification: BOT_TEXTS.helpCancelled,
    });
  });

  // Callback: «Подобрать заказ»
  bot.action(BOT_TEXTS.callbackHelp, async (ctx) => {
    const user = ctx.user;

    if (!user) {
      return;
    }

    const customer = await upsertMaxCustomer(user);

    const result = await startProposalFlow({
      channel: "max",
      customer,
      providerUserId: user.user_id,
    });

    if (result.status === "processing") {
      await ctx.answerOnCallback({
        message: { text: BOT_TEXTS.busy },
        notification: BOT_TEXTS.busy,
      });
      return;
    }

    await ctx.answerOnCallback({
      message: {
        attachments: [getHelpKeyboard()],
        text: BOT_TEXTS.helpPrompt,
      },
      notification: "Ожидаю описание заказа.",
    });
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

    const customer = await upsertMaxCustomer(sender);

    if (text === BOT_TEXTS.helpButton) {
      const result = await startProposalFlow({
        channel: "max",
        customer,
        providerUserId: sender.user_id,
      });

      if (result.status === "processing") {
        await ctx.reply(BOT_TEXTS.busy);
        return;
      }

      await ctx.reply(BOT_TEXTS.helpPrompt, {
        attachments: [getHelpKeyboard()],
      });
      return;
    }

    if (text === "Отмена") {
      await cancelProposalFlow({
        channel: "max",
        customer,
        providerUserId: sender.user_id,
      });
      await ctx.reply(BOT_TEXTS.helpCancelled, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    const result = await processProposalPrompt({
      channel: "max",
      customer,
      onProcessing: async () => {
        await ctx.reply(BOT_TEXTS.processing);
        ctx.sendAction?.("typing_on").catch(() => {});
      },
      providerUserId: sender.user_id,
      userPrompt: text,
    });

    if (result.status === "ready") {
      await ctx.reply(BOT_TEXTS.proposalReady.replace("{total}", String(result.totalAmount)), {
        attachments: [getProposalKeyboard(result.proposalUrl)],
      });
      return;
    }

    if (result.status === "no_match") {
      await ctx.reply(result.explanation, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    if (result.status === "busy") {
      await ctx.reply(BOT_TEXTS.busy);
      return;
    }

    if (result.status === "expired") {
      await ctx.reply(BOT_TEXTS.helpExpired, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    if (result.status === "missing") {
      await ctx.reply(BOT_TEXTS.helpRequired, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    if (result.status === "failed") {
      await ctx.reply(result.explanation || BOT_TEXTS.proposalFailed, {
        attachments: [getStartKeyboard()],
      });
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

  if (!instance.botInfo) {
    initPromise ??= instance.api.setMyCommands(MAX_BOT_COMMANDS).then((botInfo) => {
      instance.botInfo = botInfo;
    });
    await initPromise;
  }

  await webhook.handleUpdate(update);
}
