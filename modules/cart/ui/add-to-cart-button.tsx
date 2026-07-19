"use client";

import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";
import { useState } from "react";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/spinner";
import { cn } from "@/common/utils/cn";

type AddToCartButtonProps = {
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
};

export function AddToCartButton({ productId, productName, price }: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const { formatMoney } = useMoney();

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addItem({ product: productId });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="relative has-data-[icon=inline-start]:pl-5 lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
      aria-label={
        isAdding ? `Добавляем ${productName} в корзину` : `Добавить ${productName} в корзину`
      }
      aria-busy={isAdding}
      disabled={!price || isLoading}
      onClick={() => void handleAddToCart()}
    >
      {isAdding ? (
        <Spinner
          data-icon="inline-start"
          aria-label="Добавление в корзину"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6"
        />
      ) : null}
      <span className={cn("flex items-center gap-2", isAdding && "opacity-0")}>
        <span className="font-medium">{price ? formatMoney(price) : "Цена не задана"}</span>
      </span>
    </Button>
  );
}
