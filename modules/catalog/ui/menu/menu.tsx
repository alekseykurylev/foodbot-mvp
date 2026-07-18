import { getActiveCategories } from "@/modules/catalog/server/categories";
import { Skeleton } from "@/common/ui/skeleton";
import { NavigationMenu } from "@/common/ui/navigation-menu";
import { MenuList } from "@/modules/catalog/ui/menu/menu-list";

export async function Menu() {
  const categories = await getActiveCategories();

  return (
    <NavigationMenu className="scroll-fade-x scrollbar-none justify-start overflow-x-auto">
      <MenuList items={categories} />
    </NavigationMenu>
  );
}

export function MenuSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-full" />
      ))}
    </div>
  );
}
