import { Container } from "@mantine/core";
import { Menu } from "@/components/menu/menu";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;

  return (
    <>
      <div>
        <Container>
          <Menu />
        </Container>
      </div>
      <div>
        <Container>{JSON.stringify(query ?? null, null, 2)}</Container>
      </div>
    </>
  );
}
