"use client";

import useSWR from "swr";

import { getMiniAppLaunchData } from "@/lib/mini-app/launch-data";
import type { Order } from "@/payload-types";

type CartApiResponse = { cart: Order | null };

async function fetchCart(provider: string, initData: string): Promise<Order | null> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, initData }),
  });

  if (!response.ok) {
    throw new Error("Не удалось получить корзину.");
  }

  const json = (await response.json()) as CartApiResponse;
  return json.cart;
}

export function useCart() {
  const launchData = getMiniAppLaunchData();

  const { data, error, isLoading, mutate } = useSWR(
    launchData ? ["/api/cart", launchData.provider, launchData.initData] : null,
    ([, provider, initData]) => fetchCart(provider, initData),
  );

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
