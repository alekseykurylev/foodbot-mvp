"use client";

import { ReactElement } from "react";
import Image from "next/image";
import {
  DrawerHeader,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerFooter,
} from "@/common/ui/drawer";

import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from "@/common/ui/item";
import { Button } from "@/common/ui/button";
import { useIsMobile } from "@/common/hooks/use-mobile";
import { Separator } from "@/common/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { NumberField } from "@/common/ui/number-field";
import { formatRubles } from "@/common/helpers/format";
import {
  CART_ITEM_MAX_QUANTITY,
  CART_ITEM_MIN_QUANTITY,
  useCartActions,
  useCartItems,
  useCartTotalAmount,
  useCartTotalItems,
} from "@/modules/cart/model/store";

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

export function MiniCart({ children }: { children: ReactElement }) {
  const isMobile = useIsMobile();
  const items = useCartItems();
  const totalItems = useCartTotalItems();
  const totalAmount = useCartTotalAmount();
  const { removeItem, setItemQuantity } = useCartActions();

  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={children} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl">
            {totalItems > 0
              ? `${formatProductsCount(totalItems)} на ${formatRubles(totalAmount)}`
              : "Корзина"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">
          {items.length > 0 ? (
            <ItemGroup className="gap-4">
              {items.map((item) => (
                <Item key={item.productId} variant="outline">
                  <ItemMedia variant="image">
                    {item.image ? (
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full bg-muted" />
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="line-clamp-1">{item.name}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      aria-label={`Удалить ${item.name} из корзины`}
                      onClick={() => removeItem(item.productId)}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                    </Button>
                  </ItemActions>
                  <Separator className="basis-full" />
                  <div className="flex basis-full justify-between items-center gap-4">
                    <div className="text-lg font-bold">
                      {formatRubles(item.price * item.quantity)}
                    </div>
                    <NumberField
                      aria-label={`Количество ${item.name}`}
                      max={CART_ITEM_MAX_QUANTITY}
                      min={CART_ITEM_MIN_QUANTITY}
                      value={item.quantity}
                      onValueChange={(value) => {
                        if (value !== null) {
                          setItemQuantity(item.productId, value);
                        }
                      }}
                    />
                  </div>
                </Item>
              ))}
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
            <div>{formatRubles(totalAmount)}</div>
          </div>
          <Button size="xl" className="relative" disabled={items.length === 0}>
            К оформлению заказа
            <HugeiconsIcon className="absolute right-4" icon={ArrowRight02Icon} strokeWidth={2} />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
