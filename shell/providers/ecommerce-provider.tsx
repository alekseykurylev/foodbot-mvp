"use client";

import { EcommerceProvider as PayloadEcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";

import { ecommerceCurrenciesConfig } from "@/common/ecommerce/currencies";

export function EcommerceProvider({ children }: { children: React.ReactNode }) {
  return (
    <PayloadEcommerceProvider
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
