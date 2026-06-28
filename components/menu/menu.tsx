import { ComponentProps } from "react";
import { getActiveCategories } from "@/lib/domain/categories";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

function MenuRoot({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      className={cn(
        "sticky w-full top-16 z-10 bg-white py-6 flex justify-between gap-4 h-14 items-center",
        className,
      )}
      {...props}
    />
  );
}

async function MenuItems() {
  const categories = await getActiveCategories();

  return (
    <div className="scroll-fade-x scrollbar-none overflow-x-auto">
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
