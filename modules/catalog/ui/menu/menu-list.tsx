"use client";

import { type MouseEvent, useMemo } from "react";
import { useScrollSpy } from "@/common/hooks/use-scroll-spy";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/common/ui/navigation-menu";

export function MenuList({ items }: { items: { id: number; slug: string; name: string }[] }) {
  const itemIds = useMemo(() => items.map((item) => item.slug), [items]);
  const { activeId, activateItem } = useScrollSpy(itemIds);

  const handleItemClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      activateItem(id);
    }
  };

  return (
    <NavigationMenuList>
      {items.map((item) => (
        <NavigationMenuItem key={item.id}>
          <NavigationMenuLink
            href={`#${item.slug}`}
            data-active={item.slug === activeId}
            onClick={(event) => handleItemClick(event, item.slug)}
          >
            {item.name}
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  );
}
