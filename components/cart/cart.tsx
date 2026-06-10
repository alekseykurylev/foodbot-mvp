"use client";

import { Alert, Loader, Stack, Table, Text } from "@mantine/core";

import { useCart } from "@/lib/mini-app/use-cart";

export function Cart() {
  const { data, isError, isLoading } = useCart();

  if (isLoading) {
    return <Loader size="sm" />;
  }

  if (isError) {
    return <Alert color="red">Ошибка</Alert>;
  }

  if (!data || data.items.length === 0) {
    return <Text c="dimmed">Корзина пуста.</Text>;
  }

  return (
    <Stack gap="md">
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Товар</Table.Th>
            <Table.Th>Кол-во</Table.Th>
            <Table.Th>Цена</Table.Th>
            <Table.Th>Итого</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.items.map((item) => (
            <Table.Tr key={item.id ?? item.productNameSnapshot}>
              <Table.Td>{item.productNameSnapshot}</Table.Td>
              <Table.Td>{item.quantity}</Table.Td>
              <Table.Td>{item.unitPriceSnapshot} ₽</Table.Td>
              <Table.Td>{item.lineTotalSnapshot} ₽</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Text fw={600}>Итого: {data.totals.totalAmount} ₽</Text>
    </Stack>
  );
}
