import OpenAI from "openai";
import type { Product } from "@/payload-types";

// ---------------------------------------------------------------------------
// Системные промпты
// ---------------------------------------------------------------------------

const FOODBOT_SYSTEM_PROMPT = `
Ты FoodBot — AI-помощник ресторана.

ЧТО ТЫ МОЖЕШЬ:
- Рассказывать о меню, блюдах, категориях.
- Объяснять состав, цены, размеры порций.
- Отвечать на вопросы о доставке, оплате, времени работы (если есть информация).

ЧТО ТЫ НЕ ДЕЛАЕШЬ:
- Не принимаешь заказы и не собираешь корзину в этом чате.
- Для подбора заказа посоветуй нажать кнопку «Подобрать заказ» в главном меню.

ПРАВИЛА:
- Отвечай только на русском языке.
- Отвечай кратко и по делу, без лишней болтовни.
- Не придумывай товары, цены, акции, сроки и условия.
- Если не знаешь ответа — честно скажи об этом.
- Если тебя спрашивают, кто ты: «Я AI-ассистент FoodBot, помогаю с выбором блюд.».
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

// ---------------------------------------------------------------------------
// AI-предложение: промпт и парсинг
// ---------------------------------------------------------------------------

type CompactProduct = {
  aiDescription?: null | string;
  aiKeywords?: null | string[];
  category: string;
  id: number;
  ingredients?: null | string;
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
    aiDescription: p.recommendation?.aiDescription ?? null,
    aiKeywords: p.recommendation?.aiKeywords as string[] | null,
    category: categoryName,
    id: p.id,
    ingredients: p.details?.ingredients ?? null,
    name: p.name,
    peopleMax: p.recommendation?.peopleMax ?? null,
    peopleMin: p.recommendation?.peopleMin ?? null,
    portionSize: p.details?.portionSize ?? null,
    price: p.price,
    spicyLevel: p.details?.spicyLevel ?? null,
    tags: p.tags ?? null,
    weightGrams: p.details?.weightGrams ?? null,
  };
}

function formatCompactMenu(products: CompactProduct[]): string {
  if (products.length === 0) {
    return "Меню пустое. Предложений нет.";
  }

  const lines = products.map((p) => {
    const parts: string[] = [`${p.id}: ${p.name} — ${p.price}₽`];
    parts.push(`категория: ${p.category}`);

    if (p.portionSize) {
      parts.push(`порция: ${p.portionSize}`);
    } else if (p.weightGrams) {
      parts.push(`вес: ${p.weightGrams} г`);
    }

    if (p.ingredients) {
      parts.push(`состав: ${p.ingredients}`);
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
      parts.push(`гостей: ${p.peopleMin ?? 1}–${p.peopleMax ?? "много"}`);
    }

    if (p.spicyLevel != null && p.spicyLevel > 0) {
      parts.push(`острота: ${p.spicyLevel}/5`);
    }

    return parts.join(" | ");
  });

  return `МЕНЮ (только эти товары существуют, используй их id):\n${lines.join("\n")}`;
}

function buildProposalSystemPrompt(menuText: string): string {
  return `
Ты AI-помощник ресторана. Твоя задача — подобрать заказ под запрос клиента.
Отвечай только на русском языке.

ПРАВИЛА:
1. Используй ТОЛЬКО товары из меню ниже. Не придумывай названия, цены, размеры.
2. Учитывай количество человек — следи за параметрами гостей (peopleMin/peopleMax).
3. Старайся разнообразить корзину — бери из разных категорий, когда это уместно.
4. Учитывай бюджет, если пользователь его назвал.
5. Учитывай предпочтения (мясо/рыба/вегетарианство).
6. Исключай товары, которые не подходят под ограничения (без острого, без свинины).
7. Если данных недостаточно — делай лучшее предположение на основе того, что есть.

${menuText}

ФОРМАТ ОТВЕТА — строго JSON без лишнего текста:
{
  "explanation": "краткое объяснение (1-2 предложения), почему выбраны эти блюда",
  "items": [
    { "productId": 1, "productName": "Маргарита", "quantity": 2, "unitPrice": 650 }
  ]
}
`.trim();
}

export type ProposalItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type ProposalResult = {
  explanation: string;
  items: ProposalItem[];
  totalAmount: number;
};

/**
 * Вызывает DeepSeek для подбора предложения на основе меню и запроса пользователя.
 */
export async function askDeepSeekForProposal(
  products: Product[],
  userPrompt: string,
): Promise<{ proposal: ProposalResult; rawResponse: unknown }> {
  const compactProducts = products.map((p) => {
    const categoryName =
      typeof p.category === "object" && p.category !== null ? p.category.name : String(p.category);

    return compactProduct(p, categoryName);
  });

  const menuText = formatCompactMenu(compactProducts);
  const systemPrompt = buildProposalSystemPrompt(menuText);

  const completion = await getDeepSeekClient().chat.completions.create({
    model: "deepseek-v4-pro",
    temperature: 0.3,
    max_completion_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawContent = completion.choices[0]?.message.content ?? "";
  const proposal = parseProposalResponse(rawContent);

  return { proposal, rawResponse: { content: rawContent } };
}

function parseProposalResponse(raw: string): ProposalResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      explanation: "Не удалось подобрать заказ. Попробуйте уточнить запрос.",
      items: [],
      totalAmount: 0,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const explanation = String(parsed.explanation ?? "");

    const items: ProposalItem[] = Array.isArray(parsed.items)
      ? parsed.items.map((item: Record<string, unknown>) => ({
          productId: Number(item.productId ?? 0),
          productName: String(item.productName ?? ""),
          quantity: Math.max(1, Math.trunc(Number(item.quantity ?? 1))),
          unitPrice: Math.max(0, Math.trunc(Number(item.unitPrice ?? 0))),
        }))
      : [];

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return { explanation, items, totalAmount };
  } catch {
    return {
      explanation: "Не удалось подобрать заказ. Попробуйте уточнить запрос.",
      items: [],
      totalAmount: 0,
    };
  }
}
