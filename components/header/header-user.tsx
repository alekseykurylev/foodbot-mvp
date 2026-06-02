"use client";

import { useUserData } from "@/hooks/use-user-data";
import { Avatar, Skeleton, UnstyledButton, Popover, Table, Code } from "@mantine/core";

export function HeaderUser() {
  const state = useUserData();

  if (state.status === "loading") return <Skeleton height={38} circle />;
  if (state.status === "error") return null;

  return (
    <Popover width={300} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <UnstyledButton>
          <Avatar
            src={state.session.user.photoUrl}
            alt={state.session.user.firstName ?? state.session.user.username}
          />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <Table>
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

        {/*<Code mt="md" block>*/}
        {/*  {JSON.stringify(state.raw ?? null, null, 2)}*/}
        {/*</Code>*/}
      </Popover.Dropdown>
    </Popover>
  );
}
