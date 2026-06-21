import { getPayloadLocal } from "@/lib/cms/payload-local";
import { Alert, Container, Group, Stack, Text, Title } from "@mantine/core";
import type { AiProposal } from "@/payload-types";

type ProposalItem = {
  lineTotal: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <Container py="xl" size="sm">
        <Text c="red" ta="center">
          Не указан ID предложения.
        </Text>
      </Container>
    );
  }

  let proposal: AiProposal;

  try {
    const payload = await getPayloadLocal();
    proposal = (await payload.findByID({
      collection: "ai-proposals",
      id,
      depth: 0,
      overrideAccess: true,
    })) as AiProposal;
  } catch {
    return (
      <Container py="xl" size="sm">
        <Text c="red" ta="center">
          Предложение не найдено.
        </Text>
      </Container>
    );
  }

  const items = (proposal.items as ProposalItem[]) ?? [];

  if (proposal.status !== "ready") {
    const message =
      proposal.status === "processing"
        ? "Предложение ещё готовится. Вернитесь в чат и дождитесь сообщения от бота."
        : proposal.status === "no_match"
          ? proposal.explanation || "Не удалось подобрать позиции из текущего меню."
          : proposal.status === "failed"
            ? proposal.errorMessage || "Не удалось подготовить предложение."
            : "Предложение пока не готово.";

    return (
      <Container py="xl" size="sm">
        <Alert color={proposal.status === "processing" ? "blue" : "yellow"}>{message}</Alert>
      </Container>
    );
  }

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Title order={2}>Ваше предложение</Title>

        {proposal.explanation ? (
          <Text c="dimmed" size="sm">
            {proposal.explanation}
          </Text>
        ) : null}

        <Stack gap="sm">
          {items.map((item, idx) => (
            <Group key={idx} justify="space-between" wrap="nowrap">
              <Text flex={1}>
                {item.productName} ×{item.quantity}
              </Text>
              <Text fw={500}>{item.lineTotal ?? item.unitPrice * item.quantity} ₽</Text>
            </Group>
          ))}
        </Stack>

        <Group justify="space-between">
          <Text fw={700} size="lg">
            Итого
          </Text>
          <Text fw={700} size="lg">
            {proposal.totalAmount} ₽
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
