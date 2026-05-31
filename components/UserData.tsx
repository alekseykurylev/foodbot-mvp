"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Code, Container, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import type { MiniAppSession } from "@/lib/mini-app/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: unknown;
        ready?: () => void;
      };
    };
    WebApp?: {
      initData?: string;
      initDataUnsafe?: unknown;
      ready?: () => void;
    };
  }
}

type State =
  | { status: "loading" }
  | { status: "error"; error: string; raw?: unknown }
  | { status: "ready"; session: MiniAppSession; raw?: unknown };

function getLaunchData() {
  const telegramWebApp = window.Telegram?.WebApp;
  const maxWebApp = window.WebApp;

  if (telegramWebApp?.initData) {
    telegramWebApp.ready?.();
    return { provider: "telegram" as const, initData: telegramWebApp.initData, raw: telegramWebApp.initDataUnsafe };
  }

  if (maxWebApp?.initData) {
    maxWebApp.ready?.();
    return { provider: "max" as const, initData: maxWebApp.initData, raw: maxWebApp.initDataUnsafe };
  }

  return undefined;
}

export function UserData() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const launchData = getLaunchData();

    if (!launchData) {
      queueMicrotask(() => {
        setState({
          status: "error",
          error: "initData не найдена. Откройте страницу как Mini App из Telegram или MAX.",
        });
      });
      return;
    }

    fetch(`/api/${launchData.provider}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: launchData.initData }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { session?: MiniAppSession; error?: string };

        if (!response.ok || !data.session) {
          throw new Error(data.error ?? "Не удалось проверить initData.");
        }

        setState({ status: "ready", session: data.session, raw: launchData.raw });
      })
      .catch((error: unknown) => {
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Не удалось получить данные пользователя.",
          raw: launchData.raw,
        });
      });
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs">
            <Title order={1}>Данные пользователя</Title>
            {state.status === "ready" ? <Badge>{state.session.provider}</Badge> : null}
          </Group>
          <Text c="dimmed">Проверенные данные Mini App для дальнейшей привязки заказов.</Text>
        </div>

        {state.status === "loading" ? <Loader /> : null}

        {state.status === "error" ? (
          <Alert color="red" title="Не удалось проверить пользователя">
            {state.error}
          </Alert>
        ) : null}

        {state.status === "ready" ? (
          <Table withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th>Provider</Table.Th>
                <Table.Td>{state.session.provider}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>User ID</Table.Th>
                <Table.Td>{state.session.user.id}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Имя</Table.Th>
                <Table.Td>{state.session.user.firstName ?? "—"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Фамилия</Table.Th>
                <Table.Td>{state.session.user.lastName ?? "—"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Username</Table.Th>
                <Table.Td>{state.session.user.username ?? "—"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Chat ID</Table.Th>
                <Table.Td>{state.session.chat?.id ?? "—"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Start param</Table.Th>
                <Table.Td>{state.session.startParam ?? "—"}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        ) : null}

        {state.status !== "loading" ? (
          <Stack gap="xs">
            <Text fw={600}>initDataUnsafe</Text>
            <Code block>{JSON.stringify(state.raw ?? null, null, 2)}</Code>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
}
