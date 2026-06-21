import { Container } from "@mantine/core";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return <Container>{JSON.stringify(query ?? null, null, 2)}</Container>;
}
