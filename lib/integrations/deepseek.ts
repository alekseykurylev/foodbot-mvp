import OpenAI from "openai";
import type { Product } from "@/payload-types";

const DEEPSEEK_MODEL = "deepseek-v4-pro";

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
    model: DEEPSEEK_MODEL,
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

type AiProposalResponse = {
  explanation: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  status: "proposal" | "no_match";
};

export type ProposalItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type ProposalResult = {
  explanation: string;
  items: ProposalItem[];
  status: "proposal" | "no_match" | "failed";
  totalAmount: number;
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

function getCategoryName(product: Product): string {
  return typeof product.category === "object" && product.category !== null
    ? product.category.name
    : String(product.category);
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
      parts.push(`разговорные названия и контекст: ${p.aiKeywords.join(", ")}`);
    }

    if (p.aiDescription) {
      parts.push(`описание для подбора: ${p.aiDescription}`);
    }

    if (p.peopleMin != null || p.peopleMax != null) {
      parts.push(`гостей: ${p.peopleMin ?? 1}-${p.peopleMax ?? "много"}`);
    }

    if (p.spicyLevel != null && p.spicyLevel > 0) {
      parts.push(`острота: ${p.spicyLevel}/5`);
    }

    return parts.join(" | ");
  });

  return `МЕНЮ (только эти товары существуют, используй только их id):\n${lines.join("\n")}`;
}

function buildProposalSystemPrompt(menuText: string): string {
  return `
Ты AI-помощник ресторана. Твоя задача — подобрать заказ под одно сообщение клиента.
Отвечай только на русском языке.

ГЛАВНОЕ:
- Используй ТОЛЬКО товары из меню ниже.
- Не придумывай товары, id, названия, цены, размеры, акции и условия.
- В items возвращай только productId и quantity. Названия и цены рассчитает сервер.
- Не подменяй конкретный отсутствующий тип блюда другим типом без явного разрешения клиента.

КАК ПОДБИРАТЬ:
1. Если запрос общий ("на двоих", "до 3000", "что-нибудь сытное", "с рыбой"), подбери подходящие товары из доступного меню.
2. Если клиент просит конкретный тип блюда, которого нет в меню (например пиццу, бургер, пасту), верни status = "no_match".
3. Если клиент использует разговорные названия, сокращения или сленг, сопоставляй их с name, category, ingredients, tags, aiKeywords и aiDescription.
4. Примеры разговорных соответствий: "шейка" может значить "Шашлык из шейки свинины"; "люля" или "люляшка" может значить "Люля-Кебаб".
5. Если разговорное соответствие уверенное — используй товар из меню.
6. Учитывай количество человек, бюджет, предпочтения и ограничения.
7. Исключай товары, которые явно не подходят под ограничения клиента (без острого, без свинины, аллергии).
8. Если данных мало, но запрос совместим с меню, сделай разумное предложение.

${menuText}

ФОРМАТ ОТВЕТА — строго JSON без лишнего текста.

Если удалось подобрать:
{
  "status": "proposal",
  "explanation": "краткое объяснение (1-2 предложения), почему выбраны эти блюда",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}

Если запрос несовместим с меню:
{
  "status": "no_match",
  "explanation": "кратко объясни, чего нет в меню, и предложи попросить подбор из доступных позиций",
  "items": []
}
`.trim();
}

function failedProposal(
  explanation = "Не удалось подобрать заказ. Попробуйте уточнить запрос.",
): ProposalResult {
  return {
    explanation,
    items: [],
    status: "failed",
    totalAmount: 0,
  };
}

function noMatchProposal(explanation: string): ProposalResult {
  return {
    explanation,
    items: [],
    status: "no_match",
    totalAmount: 0,
  };
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(numberValue));
}

function extractJsonObject(raw: string): string | null {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return raw.slice(firstBrace, lastBrace + 1);
}

function parseProposalResponse(raw: string): AiProposalResponse | null {
  const json = extractJsonObject(raw);

  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const status = parsed.status === "no_match" ? "no_match" : "proposal";
    const explanation = String(parsed.explanation ?? "").trim();

    const items =
      status === "proposal" && Array.isArray(parsed.items)
        ? parsed.items.map((item) => {
            const record = item as Record<string, unknown>;

            return {
              productId: Number(record.productId ?? 0),
              quantity: parsePositiveInteger(record.quantity, 1),
            };
          })
        : [];

    return {
      explanation,
      items,
      status,
    };
  } catch {
    return null;
  }
}

function normalizeProposal(
  aiResponse: AiProposalResponse | null,
  products: Product[],
): ProposalResult {
  if (!aiResponse) {
    return failedProposal();
  }

  if (aiResponse.status === "no_match") {
    return noMatchProposal(
      aiResponse.explanation || "В меню нет подходящих позиций под ваш запрос.",
    );
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const quantitiesByProductId = new Map<number, number>();

  for (const item of aiResponse.items) {
    if (!Number.isInteger(item.productId) || !productsById.has(item.productId)) {
      continue;
    }

    const currentQuantity = quantitiesByProductId.get(item.productId) ?? 0;
    quantitiesByProductId.set(item.productId, currentQuantity + item.quantity);
  }

  const items: ProposalItem[] = Array.from(quantitiesByProductId.entries()).map(
    ([productId, quantity]) => {
      const product = productsById.get(productId);

      if (!product) {
        throw new Error(`Product ${productId} disappeared during proposal normalization.`);
      }

      return {
        productId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
      };
    },
  );

  if (items.length === 0) {
    return failedProposal("Не удалось подобрать товары из актуального меню.");
  }

  return {
    explanation: aiResponse.explanation || "Подобрал заказ из доступных позиций меню.",
    items,
    status: "proposal",
    totalAmount: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  };
}

/**
 * Вызывает DeepSeek для подбора предложения на основе меню и запроса пользователя.
 * AI выбирает только productId и quantity; названия, цены и суммы берутся из Product.
 */
export async function askDeepSeekForProposal(
  products: Product[],
  userPrompt: string,
): Promise<{ proposal: ProposalResult; rawResponse: unknown }> {
  if (products.length === 0) {
    return {
      proposal: noMatchProposal("Сейчас нет доступных позиций меню для подбора заказа."),
      rawResponse: { content: null },
    };
  }

  const compactProducts = products.map((product) =>
    compactProduct(product, getCategoryName(product)),
  );
  const menuText = formatCompactMenu(compactProducts);
  const systemPrompt = buildProposalSystemPrompt(menuText);

  const completion = await getDeepSeekClient().chat.completions.create({
    model: DEEPSEEK_MODEL,
    temperature: 0.2,
    max_completion_tokens: 800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawContent = completion.choices[0]?.message.content ?? "";
  const aiResponse = parseProposalResponse(rawContent);
  const proposal = normalizeProposal(aiResponse, products);

  return { proposal, rawResponse: { content: rawContent, parsed: aiResponse } };
}
