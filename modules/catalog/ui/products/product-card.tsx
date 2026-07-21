"use client";

import { useState } from "react";
import Image from "next/image";
import type { DefaultDocumentIDType } from "payload";

import { Dialog } from "@/common/ui/dialog";
import { Item, ItemActions, ItemContent, ItemHeader, ItemTitle } from "@/common/ui/item";
import { AddToCartButton } from "@/modules/cart/ui/add-to-cart-button";
import type {
  ProductCardImage,
  ProductCardVariant,
} from "@/modules/catalog/ui/products/product-card-types";
import { ProductDialog } from "@/modules/catalog/ui/products/product-dialog";
import { ProductCompareAtPrice } from "@/modules/catalog/ui/products/product-compare-at-price";

type ProductCardProps = {
  description?: null | string;
  image?: ProductCardImage;
  productId: DefaultDocumentIDType;
  productName: string;
  price?: null | number;
  compareAtPrice?: null | number;
  variants: ProductCardVariant[];
};

export function ProductCard({
  compareAtPrice,
  description,
  image,
  price,
  productId,
  productName,
  variants,
}: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasVariants = variants.length > 0;

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
            <AddToCartButton
              productId={productId}
              productName={productName}
              price={price}
              variantSelectionRequired={hasVariants}
              onVariantSelectionRequired={() => setIsOpen(true)}
            />
          </ItemActions>
        </ItemContent>
      </Item>

      <ProductDialog
        description={description}
        image={image}
        onAdded={() => setIsOpen(false)}
        price={price}
        productId={productId}
        productName={productName}
        variants={variants}
      />
    </Dialog>
  );
}
