"use client";

import { useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import { useCallback } from "react";

const MONEY_LOCALE = "ru-RU";

export function useMoney() {
  const currencyContext = useCurrency();
  const { currency } = currencyContext;

  const formatMoney = useCallback(
    (value?: null | number) => {
      if (value == null) {
        return "";
      }

      const base = Math.pow(10, currency.decimals);
      const hasFraction = value % base !== 0;

      return new Intl.NumberFormat(MONEY_LOCALE, {
        currency: currency.code,
        currencyDisplay: currency.symbolDisplay ?? "symbol",
        maximumFractionDigits: currency.decimals,
        minimumFractionDigits: hasFraction ? currency.decimals : 0,
        style: "currency",
      }).format(value / base);
    },
    [currency],
  );

  return {
    ...currencyContext,
    formatMoney,
  };
}
