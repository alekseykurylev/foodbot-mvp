"use client";

import { EcommerceProvider as PayloadEcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";

import { ecommerceCurrenciesConfig } from "@/common/ecommerce/currencies";

export function EcommerceProvider({ children }: { children: React.ReactNode }) {
  return (
    <PayloadEcommerceProvider
      api={{
        cartsFetchQuery: {
          depth: 3,
          populate: {
            products: {
              compareAtPriceInRUB: true,
              image: true,
              name: true,
              priceInRUB: true,
            },
            variants: {
              compareAtPriceInRUB: true,
              options: true,
              priceInRUB: true,
              title: true,
            },
          },
        },
      }}
      customersSlug="customers"
      currenciesConfig={ecommerceCurrenciesConfig}
      enableVariants
      paymentMethods={[]}
      syncLocalStorage={{ key: "foodbot-cart" }}
    >
      {children}
    </PayloadEcommerceProvider>
  );
}
