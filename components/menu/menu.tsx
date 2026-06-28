import { ComponentProps } from "react";
import { getActiveCategories } from "@/lib/domain/categories";
import { Container } from "../ui/container";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

function MenuRoot({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("sticky top-0 z-10 bg-white py-6", className)} {...props}>
      <Container>
        <div className="flex justify-between gap-4 h-10 items-center">{children}</div>
      </Container>
    </div>
  );
}

async function MenuItems() {
  const categories = await getActiveCategories();

  return (
    <div className="scroll-fade-x scrollbar-none overflow-x-auto ">
      <ul className="flex gap-3">
        {categories.map((item) => (
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
