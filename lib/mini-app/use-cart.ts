"use client";

import useSWR from "swr";

import { getMiniAppLaunchData, type MiniAppLaunchData } from "@/lib/mini-app/launch-data";
import type { Order } from "@/payload-types";

async function fetchCart(url: string, launchData: MiniAppLaunchData) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: launchData.provider,
      initData: launchData.initData,
    }),
  });

  if (!response.ok) {
    throw new Error("Не удалось получить корзину.");
  }

  return (await response.json()) as Order;
}

export function useCart() {
  const launchData = getMiniAppLaunchData();
  const { data, error, isLoading } = useSWR(
    launchData ? ["/api/cart", launchData] : null,
    ([url, launchData]) => fetchCart(url, launchData),
  );

  return {
    data,
    isLoading,
    isError: error,
  };
}
