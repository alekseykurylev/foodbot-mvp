"use client";

import type { ReactElement } from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import Image from "next/image";
import { Minus, Plus, XIcon } from "lucide-react";
import { useMoney } from "@/common/ecommerce/use-money";
import { getMediaImage } from "@/common/helpers/media";
import { useIsMobile } from "@/common/hooks/use-mobile";
import { Button } from "@/common/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/common/ui/drawer";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/common/ui/item";
import { Separator } from "@/common/ui/separator";
import type { Product, Variant } from "@/payload-types";

function formatProductsCount(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} товар`;
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

function getProductID(product: unknown) {
  if (typeof product === "number" || typeof product === "string") {
    return product;
  }

  if (product && typeof product === "object" && "id" in product) {
    const id = product.id;
    return typeof id === "number" || typeof id === "string" ? id : "";
  }

  return "";
}

function getDocument<T>(value: unknown): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

export function MiniCart({ children }: { children: ReactElement }) {
  const isMobile = useIsMobile();
  const { cart, clearCart, decrementItem, incrementItem, isLoading, removeItem } = useCart();
  const { formatMoney } = useMoney();
  const items = cart?.items ?? [];
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={children} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl">
            {totalItems > 0
              ? `${formatProductsCount(totalItems)} на ${formatMoney(cart?.subtotal)}`
              : "Корзина"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {items.length > 0 ? (
            <ItemGroup className="gap-4">
              {items.map((item) => {
                const productID = getProductID(item.product);
                const product = getDocument<Product>(item.product);
                const variant = getDocument<Variant>(item.variant);
                const itemID = item.id;
                const productName = product?.name ?? `Товар #${productID}`;
                const image = getMediaImage(product?.image, { fallbackAlt: productName });
                const price = variant?.priceInRUB ?? product?.priceInRUB;
                const compareAtPrice = variant?.compareAtPriceInRUB ?? product?.compareAtPriceInRUB;
                const hasCompareAtPrice =
                  typeof price === "number" &&
                  typeof compareAtPrice === "number" &&
                  compareAtPrice > price;

                return (
                  <Item key={itemID} variant="outline">
                    <ItemMedia variant="image" className="size-20 rounded-lg bg-muted">
                      {image ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      ) : null}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{productName}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        aria-label={`Удалить ${productName} из корзины`}
                        disabled={isLoading}
                        onClick={() => void removeItem(itemID)}
                      >
                        <XIcon />
                      </Button>
                    </ItemActions>
                    <Separator className="basis-full" />
                    <div className="flex basis-full items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold">
                          {typeof price === "number" ? formatMoney(price) : "Цена не задана"}
                        </span>
                        {hasCompareAtPrice ? (
                          <span className="text-muted-foreground line-through">
                            {formatMoney(compareAtPrice)}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <Button
                          size="icon-sm"
                          type="button"
                          variant="outline"
                          aria-label={`Уменьшить количество товара ${productName}`}
                          disabled={isLoading}
                          onClick={() => void decrementItem(itemID)}
                        >
                          <Minus />
                        </Button>
                        <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="icon-sm"
                          type="button"
                          variant="outline"
                          aria-label={`Увеличить количество товара ${productName}`}
                          disabled={isLoading}
                          onClick={() => void incrementItem(itemID)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </div>
                  </Item>
                );
              })}
            </ItemGroup>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-lg font-bold">
              В корзине пока пусто
            </div>
          )}
        </div>
        <DrawerFooter>
          <div className="flex items-center justify-between gap-4 text-lg font-bold">
            <div>Сумма заказа</div>
            <div>{formatMoney(cart?.subtotal)}</div>
          </div>
          <Button
            variant="outline"
            disabled={items.length === 0 || isLoading}
            onClick={() => void clearCart()}
          >
            Очистить корзину
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
