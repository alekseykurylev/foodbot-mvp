import type { CurrenciesConfig, Currency } from "@payloadcms/plugin-ecommerce/types";

export const RUB: Currency = {
  code: "RUB",
  decimals: 2,
  label: "Российский рубль",
  symbol: "₽",
};

export const ecommerceCurrenciesConfig: CurrenciesConfig = {
  defaultCurrency: RUB.code,
  supportedCurrencies: [RUB],
};
