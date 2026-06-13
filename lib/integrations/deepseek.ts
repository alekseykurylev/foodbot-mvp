import OpenAI from "openai";
import type { Product } from "@/payload-types";
import { AI_TEXTS } from "@/lib/bots/ai-texts";

// ---------------------------------------------------------------------------
// Системные промпты
// ---------------------------------------------------------------------------

const FOODBOT_SYSTEM_PROMPT = `
Ты FoodBot — AI-помощник ресторана. Ты помогаешь клиентам с выбором блюд и оформлением заказа.

ТВОИ ВОЗМОЖНОСТИ:
- Рассказывать о меню, блюдах и категориях.
- Объяснять состав, цены, размеры порций.
- Помогать подобрать заказ под количество гостей и предпочтения.
- Отвечать на вопросы о доставке, оплате, времени работы (если есть информация).

ПРАВИЛА:
- Отвечай только на русском языке.
- Отвечай кратко и по делу, без лишней болтовни.
- Не придумывай товары, цены, акции, сроки и условия, которых нет в реальности.
- Если не знаешь ответа — честно скажи об этом.
- Не предлагай оформить заказ напрямую через этот чат (для этого есть основное меню).
- Если тебя спрашивают, какая ты модель или кто ты, отвечай: «Я AI-ассистент FoodBot, помогаю с выбором блюд.».
`.trim();

// ---------------------------------------------------------------------------
// Клиент DeepSeek (синглтон)
// ---------------------------------------------------------------------------

let deepseekClient: OpenAI | null = null;

export function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  deepseekClient ??= new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });

  return deepseekClient;
}

// ---------------------------------------------------------------------------
// Построитель системного промпта с меню
// ---------------------------------------------------------------------------

type CompactProduct = {
  aiDescription?: null | string;
  aiKeywords?: null | string[];
  category: string;
  id: number;
  name: string;
  peopleMax?: null | number;
  peopleMin?: null | number;
  portionSize?: null | string;
  price: number;
  spicyLevel?: null | number;
  tags?: null | string[];
  weightGrams?: null | number;
};

function compactProduct(p: Product, categoryName: string): CompactProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    category: categoryName,
    weightGrams: p.details?.weightGrams ?? null,
    portionSize: p.details?.portionSize ?? null,
    spicyLevel: p.details?.spicyLevel ?? null,
    tags: p.tags ?? null,
    peopleMin: p.recommendation?.peopleMin ?? null,
    peopleMax: p.recommendation?.peopleMax ?? null,
    aiDescription: p.recommendation?.aiDescription ?? null,
    aiKeywords: p.recommendation?.aiKeywords ?? null,
  };
}

function formatCompactMenu(products: CompactProduct[]): string {
  if (products.length === 0) {
    return "Меню пустое. Сообщи пользователю, что сейчас нет доступных блюд.";
  }

  const lines = products.map((p) => {
    const parts: string[] = [`${p.id}: ${p.name} — ${p.price}₽`];
    parts.push(`категория: ${p.category}`);

    if (p.portionSize) {
      parts.push(`порция: ${p.portionSize}`);
    } else if (p.weightGrams) {
      parts.push(`вес: ${p.weightGrams} г`);
    }

    if (p.tags?.length) {
      parts.push(`теги: ${p.tags.join(", ")}`);
    }

    if (p.aiKeywords?.length) {
      parts.push(`контекст: ${p.aiKeywords.join(", ")}`);
    }

    if (p.aiDescription) {
      parts.push(`описание: ${p.aiDescription}`);
    }

    if (p.peopleMin != null || p.peopleMax != null) {
      const min = p.peopleMin ?? 1;
      const max = p.peopleMax ?? "много";
      parts.push(`гостей: ${min}–${max}`);
    }

    if (p.spicyLevel != null && p.spicyLevel > 0) {
      parts.push(`острота: ${p.spicyLevel}/5`);
    }

    return parts.join(" | ");
  });

  return `МЕНЮ (только эти товары существуют, используй их id):\n${lines.join("\n")}`;
}

function buildAllowedQuestionsText(): string {
  const qTexts = AI_TEXTS.allowedQuestions.map((q) => `- ${q.id}: «${q.question}» (${q.hint})`);

  return `РАЗРЕШЁННЫЕ ВОПРОСЫ (задавай ТОЛЬКО их, максимум 3 за диалог):
${qTexts.join("\n")}

Если в первом сообщении пользователя уже есть ответ на какой-то вопрос — не задавай его.
Собери минимум «people» (количество гостей) и «preferences» (предпочтения), прежде чем предлагать заказ.
Если пользователь три раза ответил, а ключевых данных всё ещё нет — делай предложение на основе того, что есть.`;
}

function buildAiSystemPrompt(menuText: string): string {
  return `
Ты AI-помощник ресторана. Твоя задача — помочь клиенту собрать заказ.
Отвечай только на русском языке. Будь вежлив и краток.

ПРАВИЛА:
1. Используй ТОЛЬКО товары из меню ниже. Не придумывай названия, цены, размеры.
2. Ты НЕ оформляешь заказ. Ты только предлагаешь корзину.
3. Не предлагай товары из стоп-листа или скрытые.
4. Учитывай количество гостей и состав (peopleMin/peopleMax).
5. Старайся разнообразить корзину — бери из разных категорий.
6. Учитывай бюджет, если пользователь его назвал.

${menuText}

${buildAllowedQuestionsText()}

ФОРМАТ ОТВЕТА — строго JSON без лишнего текста:

Если нужно задать вопрос:
{"type":"question","text":"текст вопроса"}

Если готов предложить корзину:
{"type":"suggestion","explanation":"краткое объяснение (1-2 предложения, почему выбраны эти блюда)","totalText":"форматированный список с ценами и итогом для пользователя","items":[{"productId":1,"quantity":2}]}
`.trim();
}

// ---------------------------------------------------------------------------
// AI-сообщение для диалога
// ---------------------------------------------------------------------------

type AiMessage = { content: string; role: "assistant" | "user" };

// ---------------------------------------------------------------------------
// Публичные функции
// ---------------------------------------------------------------------------

/** Простой текстовый запрос (для справок, не для заказа) */
export async function askDeepSeek(text: string) {
  const completion = await getDeepSeekClient().chat.completions.create({
    model: "deepseek-v4-pro",
    temperature: 0.3,
    max_completion_tokens: 500,
    messages: [
      { role: "system", content: FOODBOT_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
  });

  return completion.choices[0]?.message.content ?? "";
}

/** Запрос с меню — для подбора корзины */
export async function askDeepSeekWithMenu(
  products: Product[],
  messages: AiMessage[],
  forceSuggestion = false,
) {
  const compactProducts = products.map((p) => {
    const categoryName =
      typeof p.category === "object" && p.category !== null ? p.category.name : String(p.category);

    return compactProduct(p, categoryName);
  });

  const menuText = formatCompactMenu(compactProducts);
  let systemPrompt = buildAiSystemPrompt(menuText);

  if (forceSuggestion) {
    systemPrompt +=
      "\n\nВАЖНО: Больше не задавай вопросов. Сделай предложение на основе имеющихся данных.";
  }

  // Ограничиваем историю последними 10 сообщениями (экономия токенов)
  const recentMessages = messages.slice(-10);

  const completion = await getDeepSeekClient().chat.completions.create({
    model: "deepseek-v4-pro",
    temperature: 0.3,
    max_completion_tokens: 1000,
    messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
  });

  const rawContent = completion.choices[0]?.message.content ?? "";

  // Парсим JSON из ответа
  return parseAiJsonResponse(rawContent);
}

// ---------------------------------------------------------------------------
// Парсинг ответа AI
// ---------------------------------------------------------------------------

export type AiQuestionResponse = {
  text: string;
  type: "question";
};

export type AiSuggestionItem = {
  productId: number;
  quantity: number;
};

export type AiSuggestionResponse = {
  explanation: string;
  items: AiSuggestionItem[];
  totalText: string;
  type: "suggestion";
};

export type AiParsedResponse = AiQuestionResponse | AiSuggestionResponse;

function parseAiJsonResponse(raw: string): AiParsedResponse {
  // Пробуем извлечь JSON из ответа (AI может обернуть в markdown-блок)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // Фолбэк: возвращаем как вопрос
    return {
      type: "question",
      text: raw.slice(0, 500) || "Извините, я не понял. Уточните запрос.",
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.type === "suggestion") {
      return {
        type: "suggestion",
        explanation: String(parsed.explanation ?? ""),
        totalText: String(parsed.totalText ?? ""),
        items: Array.isArray(parsed.items)
          ? parsed.items.map((item: { productId: number; quantity: number }) => ({
              productId: Number(item.productId),
              quantity: Math.max(1, Math.trunc(Number(item.quantity ?? 1))),
            }))
          : [],
      };
    }

    // Всё остальное считаем вопросом
    return {
      type: "question",
      text: String(parsed.text ?? raw.slice(0, 500)),
    };
  } catch {
    return {
      type: "question",
      text: raw.slice(0, 500) || "Извините, я не понял. Уточните запрос.",
    };
  }
}
