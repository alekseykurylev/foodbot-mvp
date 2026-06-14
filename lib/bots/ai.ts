import { getPayloadLocal } from "@/lib/cms/payload-local";
import { getRelationshipID } from "@/lib/utils/relationship";
import { askDeepSeekForProposal } from "@/lib/integrations/deepseek";
import { BOT_TEXTS } from "@/lib/bots/texts";
import { getProposalUrl } from "@/lib/bots/urls";
import type { AiProposal, Customer, Product } from "@/payload-types";

// ---------------------------------------------------------------------------
// Блокировка повторных сообщений во время обработки
// ---------------------------------------------------------------------------

const processing = new Set<number>();

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
// Создание предложения
// ---------------------------------------------------------------------------

/**
 * Формирует AI-предложение на основе запроса пользователя.
 * Возвращает ID созданного proposal и текстовое сообщение для бота.
 */
export async function buildProposal(
  customer: Customer | number | string,
  userPrompt: string,
  channel: "max" | "telegram",
): Promise<{ message: string; proposalId: number; proposalUrl: string } | null> {
  const customerID = typeof customer === "object" ? customer.id : Number(customer);

  // Блокируем повторную обработку
  if (processing.has(customerID)) {
    return null;
  }

  processing.add(customerID);

  try {
    // Загружаем меню
    const products = await loadActiveProducts();

    // Вызываем AI
    const { proposal, rawResponse } = await askDeepSeekForProposal(products, userPrompt);

    if (proposal.items.length === 0) {
      return null;
    }

    // Сохраняем в базу
    const payload = await getPayloadLocal();
    const items = proposal.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    }));

    const record = (await payload.create({
      collection: "ai-proposals",
      data: {
        channel,
        customer: customerID,
        explanation: proposal.explanation,
        items,
        model: "deepseek-v4-pro",
        status: "active",
        totalAmount: proposal.totalAmount,
        userPrompt,
        aiRawResponse: rawResponse as Record<string, unknown>,
      },
      depth: 0,
      overrideAccess: true,
    })) as AiProposal;

    const proposalId = getRelationshipID(record.id) ?? Number(record.id);
    const proposalUrl = getProposalUrl(proposalId);

    const message = BOT_TEXTS.proposalReady
      .replace("{explanation}", proposal.explanation)
      .replace("{total}", String(proposal.totalAmount));

    return { message, proposalId: Number(proposalId), proposalUrl };
  } finally {
    processing.delete(customerID);
  }
}

/**
 * Занят ли бот обработкой запроса для этого клиента.
 */
export function isProcessing(customerID: number): boolean {
  return processing.has(customerID);
}
