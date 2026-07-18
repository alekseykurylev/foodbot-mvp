import { getActiveCategories } from "@/modules/catalog/server/categories";
import { Skeleton } from "@/common/ui/skeleton";
import { NavigationMenu, NavigationMenuList } from "@/common/ui/navigation-menu";
import { MenuItem } from "@/modules/catalog/ui/menu/menu-item";

export async function Menu() {
  const categories = await getActiveCategories();

  return (
    <NavigationMenu className="scroll-fade-x scrollbar-none overflow-x-auto">
      <NavigationMenuList>
        {categories.map((category) => (
          <MenuItem key={category.id} slug={category.slug} name={category.name} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function MenuSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-20" />
      ))}
    </div>
  );
}
