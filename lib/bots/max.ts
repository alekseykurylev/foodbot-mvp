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

function getContactKeyboard() {
  return MaxKeyboard.inlineKeyboard([[MaxKeyboard.button.requestContact(BOT_TEXTS.phoneButton)]]);
}

function getStartKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMiniAppUrl())],
    [MaxKeyboard.button.callback(BOT_TEXTS.helpButton, BOT_TEXTS.callbackHelp)],
  ]);
}

function getHelpKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.callback("Отмена", BOT_TEXTS.callbackCancel)],
  ]);
}

function getProposalKeyboard(proposalUrl: string) {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.link(BOT_TEXTS.proposalButton, getMaxMiniAppUrl(proposalUrl))],
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
      attachments: [
        MaxKeyboard.inlineKeyboard([
          [MaxKeyboard.button.link(BOT_TEXTS.menuButton, getMaxMiniAppUrl())],
        ]),
      ],
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

  // Callback: «Подобрать заказ» / «Отмена»
  bot.on("message_callback", async (ctx) => {
    const payload = ctx.callback?.payload;
    const user = ctx.user;

    if (!payload || !user) {
      return;
    }

    const customer = await upsertMaxCustomer(user);

    if (payload === BOT_TEXTS.callbackCancel) {
      await cancelProposalFlow({
        channel: "max",
        customer,
        providerUserId: user.user_id,
      });
      await ctx.reply(BOT_TEXTS.helpCancelled, {
        attachments: [getStartKeyboard()],
      });
      return;
    }

    if (payload !== BOT_TEXTS.callbackHelp) {
      return;
    }

    const result = await startProposalFlow({
      channel: "max",
      customer,
      providerUserId: user.user_id,
    });

    if (result.status === "processing") {
      await ctx.reply(BOT_TEXTS.busy);
      return;
    }

    await ctx.reply(BOT_TEXTS.helpPrompt, {
      attachments: [getHelpKeyboard()],
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
