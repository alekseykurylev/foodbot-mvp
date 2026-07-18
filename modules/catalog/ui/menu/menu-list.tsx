"use client";

import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/common/ui/navigation-menu";

export function MenuList({ items }: { items: { id: number; slug: string; name: string }[] }) {
  return (
    <NavigationMenuList>
      {items.map((item) => (
        <NavigationMenuItem key={item.id}>
          <NavigationMenuLink href={`#${item.slug}`}>{item.name}</NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  );
}
