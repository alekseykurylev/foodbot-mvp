"use client";

import { useCallback, useEffect, useRef } from "react";

export function useActiveItemScroll(activeId: string | null) {
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const activeItem = itemRefs.current.get(activeId);
    const scrollContainer = activeItem?.closest<HTMLElement>('[data-slot="navigation-menu"]');

    if (!activeItem || !scrollContainer) {
      return;
    }

    const itemRect = activeItem.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;
    const scrollDelta = itemCenter - containerCenter;
    const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
    const targetScrollLeft = Math.min(
      Math.max(scrollContainer.scrollLeft + scrollDelta, 0),
      maxScrollLeft,
    );

    if (Math.abs(targetScrollLeft - scrollContainer.scrollLeft) > 1) {
      scrollContainer.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    }
  }, [activeId]);

  return useCallback((id: string, element: HTMLAnchorElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);
}
