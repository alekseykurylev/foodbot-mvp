import { Badge, Group, Scroller } from "@mantine/core";

export function Menu() {
  return (
    <Scroller>
      <Group gap="xs" wrap="nowrap">
        {Array.from({ length: 10 }).map((_, index) => (
          <Badge key={index} variant="light" size="lg" miw="fit-content">
            Menu {index + 1}
          </Badge>
        ))}
      </Group>
    </Scroller>
  );
}
