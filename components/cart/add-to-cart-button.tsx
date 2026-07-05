"use client";

import { Button } from "@/components/ui/button";
import { useCartActions, useCartItemQuantity } from "@/lib/cart/store";

type AddToCartButtonProps = {
  productId: number;
  productName: string;
  price: number;
};

export function AddToCartButton({ productId, productName, price }: AddToCartButtonProps) {
  const { addItem } = useCartActions();
  const quantity = useCartItemQuantity(productId);

  return (
    <Button
      type="button"
      size="lg"
      variant="secondary"
      className="lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={`Добавить ${productName} в корзину`}
      onClick={() => addItem({ productId })}
    >
      <span className="font-medium">{price} &#8381;</span>
      {quantity > 0 ? <span className="font-medium">x{quantity}</span> : null}
    </Button>
  );
}
