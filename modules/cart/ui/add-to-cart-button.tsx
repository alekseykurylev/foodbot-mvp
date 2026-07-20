"use client";

import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";

type AddToCartButtonProps = {
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
};

export function AddToCartButton({ productId, productName, price }: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart();
  const { formatMoney } = useMoney();

  if (!price) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      className="disabled:opacity-100 lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={`Добавить ${productName} в корзину`}
      disabled={isLoading}
      onClick={() => void addItem({ product: productId })}
    >
      <span className="font-medium">{formatMoney(price)}</span>
    </Button>
  );
}
