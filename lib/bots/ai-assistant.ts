import { getPayloadLocal } from "@/lib/cms/payload-local";
import { getRelationshipID } from "@/lib/utils/relationship";
import { applyAiSuggestionToCart, findActiveCart } from "@/lib/domain/orders";
import { askDeepSeekWithMenu } from "@/lib/integrations/deepseek";
import { AI_TEXTS } from "@/lib/bots/ai-texts";
import { getCartMiniAppUrl } from "@/lib/bots/urls";
import { BOT_TEXTS } from "@/lib/bots/texts";
import type { AiConversation, Customer, Order, Product } from "@/payload-types";
import type { AiSuggestionItem } from "@/lib/integrations/deepseek";

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

type Channel = "max" | "telegram";

export type AiMessageResult =
  | {
      cartId?: never;
      items?: never;
      miniAppUrl: string;
      text: string;
      totalText?: never;
      type: "existing_cart";
    }
  | {
      cartId?: never;
      items?: never;
      miniAppUrl?: never;
      text: string;
      totalText?: never;
      type: "question";
    }
  | {
      cartId: number;
      items: AiSuggestionItem[];
      miniAppUrl: string;
      text: string;
      totalText: string;
      type: "suggestion";
    };

export type AiCallbackResult =
  | {
      cartId: number;
      items: AiSuggestionItem[];
      miniAppUrl: string;
      text: string;
      totalText: string;
      type: "suggestion";
    }
  | { text: string; type: "error" };

// ---------------------------------------------------------------------------
// Внутренние хелперы
// ---------------------------------------------------------------------------

type AiMessage = { content: string; role: "assistant" | "user" };

function getCustomerID(customer: Customer | number | string) {
  return typeof customer === "object" ? customer.id : Number(customer);
}

function buildCartMiniAppUrl(cartId: number | string): string {
  return getCartMiniAppUrl(cartId);
}

function buildExistingCartText(cart: Order): string {
  const total = cart.totals?.totalAmount ?? 0;
  return BOT_TEXTS.existingCart.replace("{total}", String(total));
}

// ---------------------------------------------------------------------------
// Работа с диалогами (коллекция ai-conversations)
// ---------------------------------------------------------------------------

async function findActiveConversation(customerID: number): Promise<AiConversation | null> {
  const payload = await getPayloadLocal();

  const result = await payload.find({
    collection: "ai-conversations",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [{ customer: { equals: customerID } }, { status: { equals: "active" } }],
    },
  });

  return (result.docs[0] as AiConversation | undefined) ?? null;
}

async function createConversation(
  customerID: number,
  channel: Channel,
  userMessage: string,
): Promise<AiConversation> {
  const payload = await getPayloadLocal();

  const conversation = await payload.create({
    collection: "ai-conversations",
    data: {
      channel,
      customer: customerID,
      messages: [{ role: "user", content: userMessage }],
      originalPrompt: userMessage,
      status: "active",
    },
    overrideAccess: true,
  });

  return conversation as AiConversation;
}

async function addMessageToConversation(conversationID: number, message: AiMessage): Promise<void> {
  const payload = await getPayloadLocal();

  const conversation = await payload.findByID({
    collection: "ai-conversations",
    id: conversationID,
    depth: 0,
    overrideAccess: true,
  });

  const messages = Array.isArray(conversation.messages)
    ? [...(conversation.messages as AiMessage[]), message]
    : [message];

  await payload.update({
    collection: "ai-conversations",
    id: conversationID,
    data: { messages },
    overrideAccess: true,
  });
}

async function completeConversation(
  conversationID: number,
  cartID: number,
  collectedAnswers?: Record<string, unknown>,
): Promise<void> {
  const payload = await getPayloadLocal();

  await payload.update({
    collection: "ai-conversations",
    id: conversationID,
    data: {
      cart: cartID,
      collectedAnswers: collectedAnswers ?? undefined,
      status: "completed",
    },
    overrideAccess: true,
  });
}

// ---------------------------------------------------------------------------
// Загрузка меню
// ---------------------------------------------------------------------------

async function loadActiveProducts(): Promise<Product[]> {
  const payload = await getPayloadLocal();

  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 200,
    overrideAccess: true,
    pagination: false,
    sort: "sortOrder",
    where: {
      and: [
        { status: { equals: "active" } },
        { "recommendation.isRecommended": { not_equals: false } },
      ],
    },
  });

  return result.docs as Product[];
}

// ---------------------------------------------------------------------------
// Вызов AI и применение к корзине
// ---------------------------------------------------------------------------

async function callAiAndApply(
  customerID: number,
  conversation: AiConversation,
  mode: "append" | "replace",
  channel: Channel,
  forceSuggestion: boolean,
): Promise<AiCallbackResult> {
  const messages = (conversation.messages as AiMessage[]) ?? [];

  if (messages.length === 0) {
    return { type: "error", text: AI_TEXTS.errors.noActiveConversation };
  }

  // Загружаем меню
  let products: Product[];
  try {
    products = await loadActiveProducts();
  } catch {
    return { type: "error", text: AI_TEXTS.errors.generic };
  }

  // Вызываем AI
  const aiResponse = await askDeepSeekWithMenu(products, messages, forceSuggestion);

  if (aiResponse.type === "question" && forceSuggestion) {
    // AI всё равно вернул вопрос — фолбэк: пробуем ещё раз с более жёстким промптом
    const retry = await askDeepSeekWithMenu(products, messages, true);

    if (retry.type !== "suggestion") {
      return { type: "error", text: AI_TEXTS.errors.aiNoSuggestion };
    }

    return applySuggestionToCart(customerID, retry, conversation, mode, channel);
  }

  if (aiResponse.type !== "suggestion") {
    return { type: "error", text: AI_TEXTS.errors.aiNoSuggestion };
  }

  return applySuggestionToCart(customerID, aiResponse, conversation, mode, channel);
}

async function applySuggestionToCart(
  customerID: number,
  aiResponse: { explanation: string; items: AiSuggestionItem[]; totalText: string },
  conversation: AiConversation,
  mode: "append" | "replace",
  channel: Channel,
): Promise<AiCallbackResult> {
  if (aiResponse.items.length === 0) {
    return { type: "error", text: AI_TEXTS.errors.aiNoSuggestion };
  }

  // Применяем к корзине
  const cart = await applyAiSuggestionToCart(
    customerID,
    aiResponse.items.map((i) => ({
      product: i.productId,
      quantity: i.quantity,
    })),
    mode,
    {
      channel,
      ai: {
        explanation: aiResponse.explanation,
        model: "deepseek-v4-pro",
        prompt: conversation.originalPrompt ?? "",
        rawResponse: conversation.messages,
      },
    },
  );

  const cartId = Number(getRelationshipID(cart.id) ?? cart.id);

  // Завершаем диалог
  await completeConversation(conversation.id, cartId, undefined);

  return {
    type: "suggestion",
    cartId,
    items: aiResponse.items,
    miniAppUrl: buildCartMiniAppUrl(cartId),
    text: aiResponse.totalText || aiResponse.explanation,
    totalText: aiResponse.totalText,
  };
}

// ---------------------------------------------------------------------------
// Публичные функции
// ---------------------------------------------------------------------------

/**
 * Обрабатывает текстовое сообщение от пользователя бота.
 *
 * Логика:
 * 1. Если есть активный диалог — продолжаем его (AI отвечает вопросом или предложением).
 * 2. Если диалога нет и есть корзина — предлагаем кнопки «Добавить» / «Заменить».
 * 3. Если диалога нет и корзины нет — начинаем новый диалог с AI.
 */
export async function handleAiMessage(
  customer: Customer | number | string,
  message: string,
  channel: Channel,
): Promise<AiMessageResult> {
  const customerID = getCustomerID(customer);

  // 1. Ищем активный диалог
  const activeConversation = await findActiveConversation(customerID);

  if (activeConversation) {
    // Продолжаем существующий диалог
    await addMessageToConversation(activeConversation.id, {
      role: "user",
      content: message,
    });

    // Загружаем обновлённые сообщения
    const payload = await getPayloadLocal();
    const updated = await payload.findByID({
      collection: "ai-conversations",
      id: activeConversation.id,
      depth: 0,
      overrideAccess: true,
    });
    const messages = (updated.messages as AiMessage[]) ?? [];

    // Загружаем меню
    const products = await loadActiveProducts();

    // Вызываем AI
    const aiResponse = await askDeepSeekWithMenu(products, messages);

    // Сохраняем ответ AI в диалог
    if (aiResponse.type === "question") {
      await addMessageToConversation(activeConversation.id, {
        role: "assistant",
        content: aiResponse.text,
      });
    } else {
      await addMessageToConversation(activeConversation.id, {
        role: "assistant",
        content: JSON.stringify(aiResponse),
      });
    }

    if (aiResponse.type === "question") {
      return { type: "question", text: aiResponse.text };
    }

    // AI готов предложить корзину
    if (aiResponse.items.length === 0) {
      return { type: "question", text: AI_TEXTS.errors.aiNoSuggestion };
    }

    // Проверяем существующую корзину
    const existingCart = await findActiveCart(customerID);

    if (existingCart) {
      // Есть корзина — показываем кнопки выбора
      return {
        type: "existing_cart",
        text: buildExistingCartText(existingCart),
        miniAppUrl: buildCartMiniAppUrl(existingCart.id),
      };
    }

    // Нет корзины — создаём
    const cart = await applyAiSuggestionToCart(
      customerID,
      aiResponse.items.map((i) => ({
        product: i.productId,
        quantity: i.quantity,
      })),
      "replace",
      {
        channel,
        ai: {
          explanation: aiResponse.explanation,
          model: "deepseek-v4-pro",
          prompt: updated.originalPrompt ?? "",
          rawResponse: messages,
        },
      },
    );

    const cartId = Number(getRelationshipID(cart.id) ?? cart.id);

    await completeConversation(activeConversation.id, cartId);

    return {
      type: "suggestion",
      cartId,
      items: aiResponse.items,
      miniAppUrl: buildCartMiniAppUrl(cartId),
      text: aiResponse.totalText || aiResponse.explanation,
      totalText: aiResponse.totalText,
    };
  }

  // 2. Нет активного диалога — проверяем корзину
  const existingCart = await findActiveCart(customerID);

  if (existingCart) {
    // Создаём диалог, сохраняем сообщение, показываем кнопки
    await createConversation(customerID, channel, message);

    return {
      type: "existing_cart",
      text: buildExistingCartText(existingCart),
      miniAppUrl: buildCartMiniAppUrl(existingCart.id),
    };
  }

  // 3. Ни диалога, ни корзины — начинаем новый диалог
  const conversation = await createConversation(customerID, channel, message);

  // Загружаем меню и вызываем AI
  const products = await loadActiveProducts();

  const aiResponse = await askDeepSeekWithMenu(products, [{ role: "user", content: message }]);

  // Сохраняем ответ AI
  if (aiResponse.type === "question") {
    await addMessageToConversation(conversation.id, {
      role: "assistant",
      content: aiResponse.text,
    });
  } else {
    await addMessageToConversation(conversation.id, {
      role: "assistant",
      content: JSON.stringify(aiResponse),
    });
  }

  if (aiResponse.type === "question") {
    return { type: "question", text: aiResponse.text };
  }

  // Предложение — создаём корзину
  if (aiResponse.items.length === 0) {
    return { type: "question", text: AI_TEXTS.errors.aiNoSuggestion };
  }

  const cart = await applyAiSuggestionToCart(
    customerID,
    aiResponse.items.map((i) => ({
      product: i.productId,
      quantity: i.quantity,
    })),
    "replace",
    {
      channel,
      ai: {
        explanation: aiResponse.explanation,
        model: "deepseek-v4-pro",
        prompt: message,
        rawResponse: [{ role: "user", content: message }],
      },
    },
  );

  const cartId = Number(getRelationshipID(cart.id) ?? cart.id);

  await completeConversation(conversation.id, cartId);

  return {
    type: "suggestion",
    cartId,
    items: aiResponse.items,
    miniAppUrl: buildCartMiniAppUrl(cartId),
    text: aiResponse.totalText || aiResponse.explanation,
    totalText: aiResponse.totalText,
  };
}

/**
 * Обрабатывает нажатие на кнопку «Добавить в заказ» или «Заменить заказ».
 * Вызывает AI с историей диалога и применяет результат к корзине.
 */
export async function handleAiCallback(
  customer: Customer | number | string,
  mode: "append" | "replace",
  channel: Channel,
): Promise<AiCallbackResult> {
  const customerID = getCustomerID(customer);

  const conversation = await findActiveConversation(customerID);

  if (!conversation) {
    return { type: "error", text: AI_TEXTS.errors.noActiveConversation };
  }

  return callAiAndApply(customerID, conversation, mode, channel, true);
}
