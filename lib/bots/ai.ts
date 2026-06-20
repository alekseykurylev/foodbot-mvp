import { getPayloadLocal } from "@/lib/cms/payload-local";
import { askDeepSeekForProposal } from "@/lib/integrations/deepseek";
import { getProposalUrl } from "@/lib/bots/urls";
import type { Customer, Product } from "@/payload-types";

const AWAITING_PROMPT_TTL_MS = 15 * 60 * 1000;
const PROCESSING_TTL_MS = 3 * 60 * 1000;
const AI_MODEL = "deepseek-v4-pro";

type BotChannel = "max" | "telegram";
type TerminalStatus = "cancelled" | "expired" | "failed";

type ProposalRecord = {
  id: number | string;
  status?: string | null;
  expiresAt?: null | string;
  processingStartedAt?: null | string;
};

type BotFlowInput = {
  channel: BotChannel;
  customer: Customer;
  providerUserId: number | string;
};

type StartProposalResult = { status: "awaiting_prompt" } | { status: "processing" };

export type PromptProposalResult =
  | { status: "busy" }
  | { status: "cancelled" }
  | { status: "expired" }
  | { status: "failed"; explanation: string }
  | { status: "missing" }
  | { status: "no_match"; explanation: string }
  | { proposalId: number; proposalUrl: string; status: "ready"; totalAmount: number };

function toProviderUserId(id: number | string): string {
  return String(id);
}

function getDateAfter(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

function isPast(date?: null | string): boolean {
  return Boolean(date && new Date(date).getTime() <= Date.now());
}

function isFreshProcessing(proposal: ProposalRecord): boolean {
  if (proposal.status !== "processing") {
    return false;
  }

  const startedAt = proposal.processingStartedAt
    ? new Date(proposal.processingStartedAt).getTime()
    : 0;

  return Date.now() - startedAt < PROCESSING_TTL_MS;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI-подбор завершился ошибкой.";
}

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

async function findActiveProposal(
  channel: BotChannel,
  providerUserId: string,
): Promise<ProposalRecord | null> {
  const payload = await getPayloadLocal();

  const result = await payload.find({
    collection: "ai-proposals",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: "-updatedAt",
    where: {
      and: [
        { channel: { equals: channel } },
        { providerUserId: { equals: providerUserId } },
        { status: { in: ["awaiting_prompt", "processing"] } },
      ],
    },
  });

  return (result.docs[0] as ProposalRecord | undefined) ?? null;
}

async function closeActiveProposal(
  channel: BotChannel,
  providerUserId: string,
  status: TerminalStatus,
): Promise<void> {
  const payload = await getPayloadLocal();

  const active = await payload.find({
    collection: "ai-proposals",
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: {
      and: [
        { channel: { equals: channel } },
        { providerUserId: { equals: providerUserId } },
        { status: { in: ["awaiting_prompt", "processing"] } },
      ],
    },
  });

  await Promise.all(
    active.docs.map((proposal) =>
      payload.update({
        collection: "ai-proposals",
        id: proposal.id,
        data: { status },
        overrideAccess: true,
      }),
    ),
  );
}

async function expireStaleActiveProposal(proposal: ProposalRecord): Promise<boolean> {
  const payload = await getPayloadLocal();

  if (proposal.status === "awaiting_prompt" && isPast(proposal.expiresAt)) {
    await payload.update({
      collection: "ai-proposals",
      id: proposal.id,
      data: { status: "expired" },
      overrideAccess: true,
    });
    return true;
  }

  if (proposal.status === "processing" && !isFreshProcessing(proposal)) {
    await payload.update({
      collection: "ai-proposals",
      id: proposal.id,
      data: {
        errorMessage: "AI-подбор не завершился за отведенное время.",
        status: "failed",
      },
      overrideAccess: true,
    });
    return true;
  }

  return false;
}

export async function cancelProposalFlow(input: BotFlowInput): Promise<void> {
  await closeActiveProposal(input.channel, toProviderUserId(input.providerUserId), "cancelled");
}

export async function startProposalFlow(input: BotFlowInput): Promise<StartProposalResult> {
  const providerUserId = toProviderUserId(input.providerUserId);
  const active = await findActiveProposal(input.channel, providerUserId);

  if (active) {
    const expired = await expireStaleActiveProposal(active);

    if (!expired && active.status === "processing") {
      return { status: "processing" };
    }

    if (!expired) {
      await closeActiveProposal(input.channel, providerUserId, "expired");
    }
  }

  const payload = await getPayloadLocal();

  await payload.create({
    collection: "ai-proposals",
    data: {
      channel: input.channel,
      customer: input.customer.id,
      expiresAt: getDateAfter(AWAITING_PROMPT_TTL_MS),
      providerUserId,
      status: "awaiting_prompt",
      totalAmount: 0,
    },
    depth: 0,
    overrideAccess: true,
  });

  return { status: "awaiting_prompt" };
}

export async function processProposalPrompt(
  input: BotFlowInput & { onProcessing?: () => Promise<void>; userPrompt: string },
): Promise<PromptProposalResult> {
  const providerUserId = toProviderUserId(input.providerUserId);
  const active = await findActiveProposal(input.channel, providerUserId);

  if (!active) {
    return { status: "missing" };
  }

  const expired = await expireStaleActiveProposal(active);

  if (expired) {
    return active.status === "awaiting_prompt"
      ? { status: "expired" }
      : { status: "failed", explanation: "Предыдущий подбор не завершился. Попробуйте ещё раз." };
  }

  if (active.status === "processing") {
    return { status: "busy" };
  }

  const payload = await getPayloadLocal();

  const processingProposal = (await payload.update({
    collection: "ai-proposals",
    id: active.id,
    data: {
      processingStartedAt: new Date().toISOString(),
      status: "processing",
      userPrompt: input.userPrompt,
    },
    depth: 0,
    overrideAccess: true,
  })) as ProposalRecord;

  await input.onProcessing?.();

  try {
    const products = await loadActiveProducts();
    const { proposal, rawResponse } = await askDeepSeekForProposal(products, input.userPrompt);

    const latest = (await payload.findByID({
      collection: "ai-proposals",
      id: processingProposal.id,
      depth: 0,
      overrideAccess: true,
    })) as ProposalRecord;

    if (latest.status !== "processing") {
      return { status: "cancelled" };
    }

    if (proposal.status === "no_match") {
      await payload.update({
        collection: "ai-proposals",
        id: processingProposal.id,
        data: {
          aiRawResponse: rawResponse as Record<string, unknown>,
          explanation: proposal.explanation,
          items: [],
          model: AI_MODEL,
          status: "no_match",
          totalAmount: 0,
        },
        overrideAccess: true,
      });

      return { status: "no_match", explanation: proposal.explanation };
    }

    if (proposal.status === "failed" || proposal.items.length === 0) {
      await payload.update({
        collection: "ai-proposals",
        id: processingProposal.id,
        data: {
          aiRawResponse: rawResponse as Record<string, unknown>,
          errorMessage: proposal.explanation,
          explanation: proposal.explanation,
          items: [],
          model: AI_MODEL,
          status: "failed",
          totalAmount: 0,
        },
        overrideAccess: true,
      });

      return { status: "failed", explanation: proposal.explanation };
    }

    const items = proposal.items.map((item) => ({
      lineTotal: item.unitPrice * item.quantity,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const readyProposal = (await payload.update({
      collection: "ai-proposals",
      id: processingProposal.id,
      data: {
        aiRawResponse: rawResponse as Record<string, unknown>,
        explanation: proposal.explanation,
        items,
        model: AI_MODEL,
        status: "ready",
        totalAmount: proposal.totalAmount,
      },
      depth: 0,
      overrideAccess: true,
    })) as ProposalRecord;

    return {
      proposalId: Number(readyProposal.id),
      proposalUrl: getProposalUrl(readyProposal.id),
      status: "ready",
      totalAmount: proposal.totalAmount,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    await payload.update({
      collection: "ai-proposals",
      id: processingProposal.id,
      data: {
        errorMessage,
        explanation: "Не удалось подобрать заказ из-за технической ошибки.",
        items: [],
        status: "failed",
        totalAmount: 0,
      },
      overrideAccess: true,
    });

    return { status: "failed", explanation: "Не удалось подобрать заказ. Попробуйте ещё раз." };
  }
}
