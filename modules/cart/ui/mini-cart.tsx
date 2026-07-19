"use client";

import { Cancel01Icon, Delete02Icon, MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCart, useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import type { ReactElement } from "react";

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
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/common/ui/item";
import { Separator } from "@/common/ui/separator";

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

export function MiniCart({ children }: { children: ReactElement }) {
  const isMobile = useIsMobile();
  const {
    cart,
    clearCart,
    decrementItem,
    incrementItem,
    isLoading,
    removeItem,
  } = useCart();
  const { formatCurrency } = useCurrency();
  const items = cart?.items ?? [];
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={children} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl">
            {totalItems > 0
              ? `${formatProductsCount(totalItems)} на ${formatCurrency(cart?.subtotal)}`
              : "Корзина"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {items.length > 0 ? (
            <ItemGroup className="gap-4">
              {items.map((item) => {
                const productID = getProductID(item.product);
                const itemID = item.id;

                return (
                  <Item key={itemID} variant="outline">
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">Товар #{productID}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        aria-label={`Удалить товар ${productID} из корзины`}
                        disabled={isLoading}
                        onClick={() => void removeItem(itemID)}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                      </Button>
                    </ItemActions>
                    <Separator className="basis-full" />
                    <div className="flex basis-full items-center justify-end gap-3">
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        aria-label={`Уменьшить количество товара ${productID}`}
                        disabled={isLoading}
                        onClick={() => void decrementItem(itemID)}
                      >
                        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
                      </Button>
                      <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        aria-label={`Увеличить количество товара ${productID}`}
                        disabled={isLoading}
                        onClick={() => void incrementItem(itemID)}
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                      </Button>
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
            <div>{formatCurrency(cart?.subtotal)}</div>
          </div>
          <Button
            size="xl"
            variant="outline"
            disabled={items.length === 0 || isLoading}
            onClick={() => void clearCart()}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Очистить корзину
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
