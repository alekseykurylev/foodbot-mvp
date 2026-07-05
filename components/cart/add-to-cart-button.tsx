"use client";

import { Button } from "@/components/ui/button";
import { useCartActions } from "@/lib/cart/store";

type AddToCartButtonProps = {
  productId: number;
  productName: string;
  price: number;
};

export function AddToCartButton({ productId, productName, price }: AddToCartButtonProps) {
  const { addItem } = useCartActions();

  return (
    <Button
      size="lg"
      type="button"
      variant="secondary"
      className="lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={`Добавить ${productName} в корзину`}
      onClick={() => addItem({ productId })}
    >
      <span className="font-medium">{price} &#8381;</span>
    </Button>
  );
}
