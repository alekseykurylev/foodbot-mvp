"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/common/ui/dialog";
import { Item, ItemActions, ItemContent, ItemHeader, ItemTitle } from "@/common/ui/item";
import { Spinner } from "@/common/ui/spinner";
import { AddToCartButton } from "@/modules/cart/ui/add-to-cart-button";
import { ProductCompareAtPrice } from "@/modules/catalog/ui/products/product-compare-at-price";

type ProductCardProps = {
  description?: null | string;
  image?: {
    alt: string;
    src: string;
  };
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
  compareAtPrice?: null | number;
};

export function ProductCard({
  compareAtPrice,
  description,
  image,
  price,
  productId,
  productName,
}: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addItem, isLoading } = useCart();
  const { formatMoney } = useMoney();

  async function handleAddToCart() {
    await addItem({ product: productId });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Item className="p-0">
        <ItemHeader>
          <button
            type="button"
            className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg text-left"
            aria-label={`Открыть подробности товара ${productName}`}
            onClick={() => setIsOpen(true)}
          >
            {image ? (
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <span className="block size-full bg-muted" />
            )}
          </button>
        </ItemHeader>
        <ItemContent className="items-center gap-3">
          <ItemTitle className="px-2 text-center font-semibold lg:text-lg">
            <button type="button" className="cursor-pointer" onClick={() => setIsOpen(true)}>
              {productName}
            </button>
          </ItemTitle>
          <ItemActions className="w-full flex-col">
            <ProductCompareAtPrice compareAtPrice={compareAtPrice} price={price} />
            <AddToCartButton productId={productId} productName={productName} price={price} />
          </ItemActions>
        </ItemContent>
      </Item>

      <DialogContent className="sm:max-w-2xl sm:grid-cols-2">
        {image ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) calc(100vw - 4rem), 320px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square w-full rounded-lg bg-muted" />
        )}
        <div className="flex min-w-0 flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl">{productName}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {description || "Описание товара скоро появится."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-auto">
            {price ? (
              <Button
                className="relative w-full"
                type="button"
                size="xl"
                disabled={isLoading}
                onClick={() => void handleAddToCart()}
              >
                {isLoading ? (
                  <Spinner
                    className="absolute top-1/2 left-4 -translate-y-1/2"
                    aria-label="Добавление товара в корзину"
                  />
                ) : null}
                В корзину за {formatMoney(price)}
              </Button>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
