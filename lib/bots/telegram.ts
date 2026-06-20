import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from "grammy";
import { BOT_COMMANDS } from "@/lib/bots/commands";
import { getBotToken } from "@/lib/bots/shared";
import { getTelegramMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { cancelProposalFlow, processProposalPrompt, startProposalFlow } from "@/lib/bots/ai";

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
    [InlineKeyboard.webApp(BOT_TEXTS.menuButton, getTelegramMiniAppUrl())],
    [InlineKeyboard.text(BOT_TEXTS.helpButton, BOT_TEXTS.callbackHelp)],
  ]);
}

function getHelpKeyboard() {
  return new InlineKeyboard().text("Отмена", BOT_TEXTS.callbackCancel);
}

function getProposalKeyboard(proposalUrl: string) {
  return new InlineKeyboard().webApp(BOT_TEXTS.proposalButton, getTelegramMiniAppUrl(proposalUrl));
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
      const customer = await upsertCustomer(ctx.from);
      await cancelProposalFlow({
        channel: "telegram",
        customer,
        providerUserId: ctx.from.id,
      });
    }

    await ctx.reply(BOT_TEXTS.start, {
      reply_markup: getStartKeyboard(),
    });
  });

  // /menu — открыть мини-приложение
  instance.command("menu", async (ctx) => {
    if (ctx.from) {
      const customer = await upsertCustomer(ctx.from);
      await cancelProposalFlow({
        channel: "telegram",
        customer,
        providerUserId: ctx.from.id,
      });
    }

    await ctx.reply(BOT_TEXTS.menu, {
      reply_markup: new InlineKeyboard().webApp(BOT_TEXTS.menuButton, getTelegramMiniAppUrl()),
    });
  });

  // /cancel — отменить подбор
  instance.command("cancel", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    const customer = await upsertCustomer(ctx.from);
    await cancelProposalFlow({
      channel: "telegram",
      customer,
      providerUserId: ctx.from.id,
    });
    await ctx.reply(BOT_TEXTS.helpCancelled, {
      reply_markup: getStartKeyboard(),
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

  // Callback: кнопка «Подобрать заказ» / «Отмена»
  instance.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (!ctx.from) {
      await ctx.answerCallbackQuery();
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    const customer = await upsertCustomer(ctx.from);

    if (data === BOT_TEXTS.callbackCancel) {
      await cancelProposalFlow({
        channel: "telegram",
        customer,
        providerUserId: ctx.from.id,
      });
      await ctx.answerCallbackQuery();
      await ctx.reply(BOT_TEXTS.helpCancelled, {
        reply_markup: getStartKeyboard(),
      });
      return;
    }

    if (data !== BOT_TEXTS.callbackHelp) {
      await ctx.answerCallbackQuery({ text: "Неизвестное действие." });
      return;
    }

    const result = await startProposalFlow({
      channel: "telegram",
      customer,
      providerUserId: ctx.from.id,
    });

    await ctx.answerCallbackQuery();

    if (result.status === "processing") {
      await ctx.reply(BOT_TEXTS.busy);
      return;
    }

    await ctx.reply(BOT_TEXTS.helpPrompt, {
      reply_markup: getHelpKeyboard(),
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

    const customer = await upsertCustomer(ctx.from);
    const result = await processProposalPrompt({
      channel: "telegram",
      customer,
      onProcessing: async () => {
        await ctx.reply(BOT_TEXTS.processing);
        ctx.replyWithChatAction("typing").catch(() => {});
      },
      providerUserId: ctx.from.id,
      userPrompt: text,
    });

    if (result.status === "ready") {
      await ctx.reply(BOT_TEXTS.proposalReady.replace("{total}", String(result.totalAmount)), {
        reply_markup: getProposalKeyboard(result.proposalUrl),
      });
      return;
    }

    if (result.status === "no_match") {
      await ctx.reply(result.explanation, {
        reply_markup: getStartKeyboard(),
      });
      return;
    }

    if (result.status === "busy") {
      await ctx.reply(BOT_TEXTS.busy);
      return;
    }

    if (result.status === "expired") {
      await ctx.reply(BOT_TEXTS.helpExpired, {
        reply_markup: getStartKeyboard(),
      });
      return;
    }

    if (result.status === "missing") {
      await ctx.reply(BOT_TEXTS.helpRequired, {
        reply_markup: getStartKeyboard(),
      });
      return;
    }

    if (result.status === "failed") {
      await ctx.reply(result.explanation || BOT_TEXTS.proposalFailed, {
        reply_markup: getStartKeyboard(),
      });
    }
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
