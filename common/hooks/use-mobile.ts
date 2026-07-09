import * as React from "react";

export function useIsMobile(mobileBreakpoint = 768) {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);

      mql.addEventListener("change", onStoreChange);

      return () => mql.removeEventListener("change", onStoreChange);
    },
    [mobileBreakpoint],
  );

  const getSnapshot = React.useCallback(() => {
    return window.innerWidth < mobileBreakpoint;
  }, [mobileBreakpoint]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
