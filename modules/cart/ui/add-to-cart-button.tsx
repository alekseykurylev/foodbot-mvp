"use client";

import { Button } from "@/common/ui/button";
import { formatRubles } from "@/common/helpers/format";
import { useCartActions } from "@/modules/cart/model/store";

type AddToCartButtonProps = {
  image?: {
    alt: string;
    src: string;
  } | null;
  productId: number;
  productName: string;
  price: number;
};

export function AddToCartButton({
  image = null,
  productId,
  productName,
  price,
}: AddToCartButtonProps) {
  const { addItem } = useCartActions();

  return (
    <Button
      size="lg"
      type="button"
      variant="secondary"
      className="lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={`Добавить ${productName} в корзину`}
      onClick={() => addItem({ image, name: productName, price, productId })}
    >
      <span className="font-medium">{formatRubles(price)}</span>
    </Button>
  );
}
