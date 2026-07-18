"use client";

import { NavigationMenuItem, NavigationMenuLink } from "@/common/ui/navigation-menu";

export function MenuItem({ slug, name }: { slug: string; name: string }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink href={`#${slug}`}>{name}</NavigationMenuLink>
    </NavigationMenuItem>
  );
}
