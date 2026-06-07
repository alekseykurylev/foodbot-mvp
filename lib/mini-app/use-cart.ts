"use client";

import useSWR, { type Fetcher } from "swr";

import {
  getMiniAppLaunchData,
  type MiniAppLaunchData,
} from "@/lib/mini-app/launch-data";
import type { MiniAppProvider } from "@/lib/mini-app/types";
import type { Order } from "@/payload-types";

export type CartResponse = {
  cart: null | Order;
};

type CartErrorResponse = {
  error?: string;
};

type LaunchDataKey = "mini-app-launch-data";
type CartKey = readonly ["/api/cart", MiniAppProvider, string];

const fetchLaunchData: Fetcher<MiniAppLaunchData, LaunchDataKey> = async () => {
  const launchData = getMiniAppLaunchData();

  if (!launchData) {
    throw new Error("initData не найдена. Откройте страницу как Mini App из Telegram или MAX.");
  }

  return launchData;
};

const fetchCart: Fetcher<CartResponse, CartKey> = async ([url, provider, initData]) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get", provider, initData }),
  });

  const data = (await response.json()) as CartErrorResponse | CartResponse;

  if (!response.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Не удалось получить корзину.",
    );
  }

  return data as CartResponse;
};

export function useCart() {
  const launchData = useSWR<MiniAppLaunchData, Error, LaunchDataKey>(
    "mini-app-launch-data",
    fetchLaunchData,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  );

  const key =
    launchData.data
      ? (["/api/cart", launchData.data.provider, launchData.data.initData] as const)
      : null;

  const cart = useSWR<CartResponse, Error, CartKey | null>(key, fetchCart);

  return {
    ...cart,
    error: launchData.error ?? cart.error,
    isLoading: launchData.isLoading || (!launchData.error && cart.isLoading),
  };
}
