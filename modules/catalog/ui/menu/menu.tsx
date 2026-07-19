import { Skeleton } from "@/common/ui/skeleton";
import { NavigationMenu } from "@/common/ui/navigation-menu";
import { getPublishedProductCategories } from "@/modules/catalog/server/products";
import { MenuList } from "@/modules/catalog/ui/menu/menu-list";

export async function Menu() {
  const groups = await getPublishedProductCategories();
  const categories = groups.map(({ category }) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  return (
    <NavigationMenu className="scroll-fade-x scrollbar-none overscroll-x-contain justify-start overflow-x-auto">
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
