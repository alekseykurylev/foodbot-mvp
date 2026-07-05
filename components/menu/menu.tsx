import { ComponentProps } from "react";
import { getActiveCategories } from "@/lib/domain/categories";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { Container } from "../ui/container";

function MenuRoot({ className, children, ...props }: ComponentProps<"nav">) {
  return (
    <nav className={cn("bg-sidebar-accent top-16 sticky z-10 ", className)} {...props}>
      <div className="w-full bg-white py-6 rounded-t-[48px] xl:rounded-t-[60px]">
        <Container>
          <div className="flex justify-between gap-4 items-center">{children}</div>
        </Container>
      </div>
    </nav>
  );
}

async function MenuItems() {
  const categories = await getActiveCategories();

  return (
    <div className="scroll-fade-x scrollbar-none overflow-x-auto">
      <ul className="flex gap-5">
        {categories.map((category) => (
          <li key={category.id}>
            <a href={`#${category.slug}`} className="font-medium hover:text-primary">
              {category.name}
            </a>
          </li>
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
