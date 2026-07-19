"use client";

import { useCart, useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";

import { Button } from "@/common/ui/button";

type AddToCartButtonProps = {
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
};

export function AddToCartButton({ productId, productName, price }: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart();
  const { formatCurrency } = useCurrency();

  return (
    <Button
      size="lg"
      type="button"
      variant="secondary"
      className="lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={`Добавить ${productName} в корзину`}
      disabled={!price || isLoading}
      onClick={() => void addItem({ product: productId })}
    >
      <span className="font-medium">{price ? formatCurrency(price) : "Цена не задана"}</span>
    </Button>
  );
}
