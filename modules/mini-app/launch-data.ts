"use client";

import type { MiniAppProvider } from "@/modules/mini-app/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: unknown;
        ready?: () => void;
      };
    };
    WebApp?: {
      initData?: string;
      initDataUnsafe?: unknown;
      ready?: () => void;
    };
  }
}

export type MiniAppLaunchData = {
  initData: string;
  provider: MiniAppProvider;
  raw?: unknown;
};

export function getMiniAppLaunchData(): MiniAppLaunchData | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const telegramWebApp = window.Telegram?.WebApp;
  const maxWebApp = window.WebApp;

  if (telegramWebApp?.initData) {
    telegramWebApp.ready?.();
    return {
      provider: "telegram",
      initData: telegramWebApp.initData,
      raw: telegramWebApp.initDataUnsafe,
    };
  }

  if (maxWebApp?.initData) {
    maxWebApp.ready?.();
    return {
      provider: "max",
      initData: maxWebApp.initData,
      raw: maxWebApp.initDataUnsafe,
    };
  }

  return undefined;
}
