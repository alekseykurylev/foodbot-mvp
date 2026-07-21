"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { DefaultDocumentIDType } from "payload";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/common/ui/dialog";
import { Label } from "@/common/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/ui/select";
import { Spinner } from "@/common/ui/spinner";
import type {
  ProductCardImage,
  ProductCardVariant,
} from "@/modules/catalog/ui/products/product-card-types";

type ProductDialogProps = {
  description?: null | string;
  image?: ProductCardImage;
  onAdded: () => void;
  price?: null | number;
  productId: DefaultDocumentIDType;
  productName: string;
  variants: ProductCardVariant[];
};

export function ProductDialog({
  description,
  image,
  onAdded,
  price,
  productId,
  productName,
  variants,
}: ProductDialogProps) {
  const selectIdPrefix = useId();
  const { addItem, isLoading } = useCart();
  const { formatMoney } = useMoney();
  const variantTypes = variants.reduce<
    Array<{
      id: string;
      label: string;
      options: Array<{ id: string; label: string; order: number }>;
      order: number;
    }>
  >((types, variant) => {
    for (const option of variant.options) {
      const typeId = String(option.typeId);
      let type = types.find(({ id }) => id === typeId);

      if (!type) {
        type = {
          id: typeId,
          label: option.typeLabel,
          options: [],
          order: option.typeOrder,
        };
        types.push(type);
      }

      const optionId = String(option.id);
      if (!type.options.some(({ id }) => id === optionId)) {
        type.options.push({ id: optionId, label: option.label, order: option.optionOrder });
      }
    }

    return types;
  }, []);
  variantTypes.sort((a, b) => a.order - b.order);
  for (const type of variantTypes) {
    type.options.sort((a, b) => a.order - b.order);
  }

  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      variantTypes.flatMap((type) => (type.options[0] ? [[type.id, type.options[0].id]] : [])),
    ),
  );
  const allOptionsSelected = variantTypes.every(({ id }) => Boolean(selectedOptionIds[id]));
  const selectedVariant = variants.find(
    (variant) =>
      variant.options.length === variantTypes.length &&
      variant.options.every(
        (option) => selectedOptionIds[String(option.typeId)] === String(option.id),
      ),
  );
  const hasVariants = variants.length > 0;
  const selectedPrice = selectedVariant?.price ?? price;

  async function handleAddToCart() {
    if (hasVariants && !selectedVariant) return;

    await addItem({
      product: productId,
      variant: selectedVariant?.id,
    });
    onAdded();
  }

  return (
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

        {hasVariants ? (
          <div className="flex flex-col gap-3">
            {variantTypes.map((variantType) => {
              const selectId = `${selectIdPrefix}-${variantType.id}`;

              return (
                <div key={variantType.id} className="flex flex-col gap-2">
                  <Label htmlFor={selectId}>{variantType.label}</Label>
                  <Select
                    value={selectedOptionIds[variantType.id] ?? null}
                    onValueChange={(value) =>
                      setSelectedOptionIds((current) => ({
                        ...current,
                        [variantType.id]: value ?? "",
                      }))
                    }
                  >
                    <SelectTrigger id={selectId} className="w-full">
                      <SelectValue>
                        {(value: string | null) =>
                          variantType.options.find((option) => option.id === value)?.label ??
                          "Выберите значение"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {variantType.options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        ) : null}

        <DialogFooter className="mt-auto">
          {selectedPrice ? (
            <Button
              className="relative w-full"
              type="button"
              size="xl"
              disabled={isLoading || (hasVariants && !selectedVariant)}
              onClick={() => void handleAddToCart()}
            >
              {isLoading ? (
                <Spinner
                  className="absolute top-1/2 left-4 -translate-y-1/2"
                  aria-label="Добавление товара в корзину"
                />
              ) : null}
              {hasVariants && !selectedVariant
                ? allOptionsSelected
                  ? "Комбинация недоступна"
                  : "Выберите вариации"
                : `В корзину за ${formatMoney(selectedPrice)}`}
            </Button>
          ) : null}
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
