"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PROGRAMMATIC_SCROLL_DURATION = 700;

export function useScrollSpy(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateActiveItem = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }

    const sections = itemIds
      .map((id) => {
        const element = document.getElementById(id);

        if (!element) {
          return null;
        }

        return {
          id,
          y: element.getBoundingClientRect().top + window.scrollY,
        };
      })
      .filter((section): section is { id: string; y: number } => section !== null)
      .sort((a, b) => b.y - a.y);

    const viewportMiddle = window.scrollY + window.innerHeight / 2;
    const activeSection = sections.find(({ y }) => y <= viewportMiddle);

    setActiveId(activeSection?.id ?? null);
  }, [itemIds]);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        updateActiveItem();
      });
    };

    const mutationObserver = new MutationObserver(() => {
      updateActiveItem();

      if (itemIds.every((id) => document.getElementById(id))) {
        mutationObserver.disconnect();
      }
    });

    updateActiveItem();

    if (!itemIds.every((id) => document.getElementById(id))) {
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mutationObserver.disconnect();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [itemIds, updateActiveItem]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const activateItem = useCallback(
    (id: string) => {
      isProgrammaticScrollRef.current = true;
      setActiveId(id);

      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        scrollTimeoutRef.current = null;
        updateActiveItem();
      }, PROGRAMMATIC_SCROLL_DURATION);
    },
    [updateActiveItem],
  );

  return { activeId, activateItem };
}
