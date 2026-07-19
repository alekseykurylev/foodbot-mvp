import type { NumberField } from "payload";

import { ecommerceCurrenciesConfig } from "@/common/ecommerce/currencies";

const rubCurrency = ecommerceCurrenciesConfig.supportedCurrencies.find(
  (currency) => currency.code === "RUB",
);

if (!rubCurrency) {
  throw new Error("RUB currency must be configured before creating compare-at price fields");
}

export const compareAtPriceInRUBField: NumberField = {
  name: "compareAtPriceInRUB",
  type: "number",
  label: "Старая цена (RUB)",
  min: 0,
  admin: {
    description: "Необязательно. Должна быть выше текущей цены.",
    components: {
      Cell: {
        clientProps: {
          currenciesConfig: ecommerceCurrenciesConfig,
          currency: rubCurrency,
        },
        path: "@payloadcms/plugin-ecommerce/client#PriceCell",
      },
      Field: {
        clientProps: {
          currenciesConfig: ecommerceCurrenciesConfig,
          currency: rubCurrency,
        },
        path: "@payloadcms/plugin-ecommerce/rsc#PriceInput",
      },
    },
  },
  validate: (value, { siblingData }) => {
    if (value == null) {
      return true;
    }

    if (!Number.isInteger(value) || value < 0) {
      return "Старая цена должна быть положительной денежной суммой.";
    }

    const currentPrice = (siblingData as { priceInRUB?: null | number }).priceInRUB;

    if (typeof currentPrice !== "number") {
      return "Сначала укажите текущую цену в RUB.";
    }

    return value > currentPrice || "Старая цена должна быть выше текущей цены.";
  },
};
