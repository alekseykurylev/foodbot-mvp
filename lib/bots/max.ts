import { Bot, Keyboard as MaxKeyboard } from "@maxhub/max-bot-api";
import type { Update, User } from "@maxhub/max-bot-api/types";
import { MAX_BOT_COMMANDS } from "@/lib/bots/commands";
import { saveBotCustomerPhone, upsertBotCustomer } from "@/lib/domain/customers";
import { askDeepSeek } from "@/lib/integrations/deepseek";

type WebhookMaxBot = {
  handleUpdate(update: Update): Promise<void>;
};

let maxBot: Bot | undefined;
let maxBotInitPromise: Promise<void> | undefined;

async function upsertMaxCustomer(user: User) {
  await upsertBotCustomer({
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

function getMaxContactKeyboard() {
  return MaxKeyboard.inlineKeyboard([
    [MaxKeyboard.button.requestContact("Поделиться телефоном")],
  ]);
}

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
    if (ctx.user) {
      await upsertMaxCustomer(ctx.user);
    }

    await ctx.reply(
      "Привет! Я помогу собрать заказ. Скоро здесь будет меню, корзина и подбор еды на компанию.",
    );
  });

  bot.command("start", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(
      "Привет! Напишите, что хотите заказать, или сколько гостей нужно накормить.",
    );
  });

  bot.command("menu", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply("Меню скоро появится в Mini App. Пока можно написать заказ текстом.");
  });

  bot.command("phone", async (ctx) => {
    const sender = ctx.message.sender;

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply("Поделитесь номером телефона, чтобы мы могли связаться по заказу.", {
      attachments: [getMaxContactKeyboard()],
    });
  });

  bot.on("message_created", async (ctx) => {
    const text = ctx.message.body.text?.trim();
    const sender = ctx.message.sender;
    const phone = ctx.contactInfo?.tel;

    if (phone) {
      if (!sender) {
        await ctx.reply("Не удалось определить пользователя. Попробуйте отправить номер еще раз.");
        return;
      }

      await saveMaxCustomerPhone(sender, phone);
      await ctx.reply("Спасибо, сохранил ваш телефон.");
      return;
    }

    if (!text) {
      await ctx.reply("Пока я понимаю только текстовые сообщения.");
      return;
    }

    if (sender) {
      await upsertMaxCustomer(sender);
    }

    await ctx.reply(await askDeepSeek(text));
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
