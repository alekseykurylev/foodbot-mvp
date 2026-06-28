import { getPayloadLocal } from "@/lib/cms/payload-local";
import { Container } from "../ui/container";

export async function Menu() {
  const payload = await getPayloadLocal();

  const menu = await payload.find({ collection: "categories" });

  return (
    <div>
      <Container>
        <ul className="flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain w-full">
          {menu.docs.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
