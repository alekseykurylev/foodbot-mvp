import { Bot } from "@maxhub/max-bot-api";
import type { Update } from "@maxhub/max-bot-api/types";

const MAX_BOT_COMMANDS = [
  {
    name: "start",
    description: "Начать работу с ботом",
  },
  {
    name: "menu",
    description: "Открыть меню",
  },
];

type WebhookMaxBot = {
  handleUpdate(update: Update): Promise<void>;
};

let maxBot: Bot | undefined;
let maxBotInitPromise: Promise<void> | undefined;

function getMaxBotToken() {
  const token = process.env.MAX_BOT_TOKEN;

  if (!token) {
    throw new Error("MAX_BOT_TOKEN is not set");
  }

  return token;
}

export function getMaxBot() {
  if (maxBot) {
    return maxBot;
  }

  const bot = new Bot(getMaxBotToken());

  bot.on("bot_started", async (ctx) => {
    await ctx.reply(
      "Привет! Я помогу собрать заказ. Скоро здесь будет меню, корзина и подбор еды на компанию.",
    );
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Привет! Напишите, что хотите заказать, или сколько гостей нужно накормить.",
    );
  });

  bot.command("menu", async (ctx) => {
    await ctx.reply("Меню скоро появится в Mini App. Пока можно написать заказ текстом.");
  });

  bot.on("message_created", async (ctx) => {
    const text = ctx.message.body.text?.trim();

    if (!text) {
      await ctx.reply("Пока я понимаю только текстовые сообщения.");
      return;
    }

    await ctx.reply(
      "Принял сообщение. Следующий шаг MVP: связать этот чат с меню, корзиной и уведомлениями администратору.",
    );
  });

  bot.catch((err, ctx) => {
    console.error(`MAX bot error while handling ${ctx.update.update_type}:`, err);
  });

  maxBot = bot;

  return bot;
}

export async function handleMaxUpdate(update: Update) {
  const bot = getMaxBot();
  const webhookBot = bot as unknown as WebhookMaxBot;

  if (!bot.botInfo) {
    maxBotInitPromise ??= bot.api.setMyCommands(MAX_BOT_COMMANDS).then((botInfo) => {
      bot.botInfo = botInfo;
    });
    await maxBotInitPromise;
  }

  await webhookBot.handleUpdate(update);
}
