import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { BOT_COMMANDS } from "@/modules/bots/commands";
import { getBotToken } from "@/modules/bots/shared";
import { getTelegramCartAppUrl, getTelegramMenuAppUrl } from "@/modules/bots/urls";
import { BOT_TEXTS } from "@/modules/bots/texts";

// ---------------------------------------------------------------------------
// Хелперы
// ---------------------------------------------------------------------------

function getStartKeyboard() {
  return new InlineKeyboard([
    [InlineKeyboard.webApp(BOT_TEXTS.menuButton, getTelegramMenuAppUrl())],
    [InlineKeyboard.webApp(BOT_TEXTS.cartButton, getTelegramCartAppUrl())],
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
    await ctx.reply(BOT_TEXTS.start, {
      reply_markup: getStartKeyboard(),
    });
  });

  // /menu — открыть мини-приложение
  instance.command("menu", async (ctx) => {
    await ctx.reply(BOT_TEXTS.menu, {
      reply_markup: new InlineKeyboard().webApp(BOT_TEXTS.menuButton, getTelegramMenuAppUrl()),
    });
  });

  // /cart — открыть корзину
  instance.command("cart", async (ctx) => {
    await ctx.reply(BOT_TEXTS.cart, {
      reply_markup: new InlineKeyboard().webApp(BOT_TEXTS.cartButton, getTelegramCartAppUrl()),
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

    await ctx.reply(BOT_TEXTS.start, {
      reply_markup: getStartKeyboard(),
    });
  });

  // Остальные сообщения
  instance.on("message", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply(BOT_TEXTS.userNotIdentified);
      return;
    }

    await ctx.reply(BOT_TEXTS.start, {
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
