import { ComponentProps } from "react";
import { getPayloadLocal } from "@/lib/cms/payload-local";
import { Container } from "../ui/container";
import { Skeleton } from "../ui/skeleton";

function MenuRoot({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="sticky py-6" {...props}>
      <Container>
        <div className="flex justify-between gap-4 h-10 items-center">{children}</div>
      </Container>
    </div>
  );
}

async function MenuItems() {
  const payload = await getPayloadLocal();

  const menu = await payload.find({ collection: "categories" });

  return (
    <div className="scroll-fade-x scrollbar-none overflow-x-auto ">
      <ul className="flex gap-3">
        {menu.docs.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

function MenuItemsSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-20" />
      ))}
    </div>
  );
}

export const Menu = {
  Root: MenuRoot,
  Items: MenuItems,
  ItemsSkeleton: MenuItemsSkeleton,
};
