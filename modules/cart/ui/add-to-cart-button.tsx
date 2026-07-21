"use client";

import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";

type AddToCartButtonProps = {
  onVariantSelectionRequired?: () => void;
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
  variantSelectionRequired?: boolean;
};

export function AddToCartButton({
  onVariantSelectionRequired,
  productId,
  productName,
  price,
  variantSelectionRequired = false,
}: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart();
  const { formatMoney } = useMoney();

  if (!price) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      className="disabled:opacity-100 lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={
        variantSelectionRequired
          ? `Выбрать вариацию товара ${productName}`
          : `Добавить ${productName} в корзину`
      }
      disabled={isLoading}
      onClick={() => {
        if (variantSelectionRequired) {
          onVariantSelectionRequired?.();
          return;
        }

        void addItem({ product: productId });
      }}
    >
      <span className="font-medium">
        {variantSelectionRequired ? "от " : null}
        {formatMoney(price)}
      </span>
    </Button>
  );
}
