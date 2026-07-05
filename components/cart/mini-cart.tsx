"use client";

import { ReactElement, useId } from "react";
import Image from "next/image";
import { NumberField } from "@base-ui/react/number-field";
import {
  DrawerHeader,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import { Trash, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

const stepperClasses =
  "flex h-full w-8 items-center justify-center border border-neutral-950 bg-white bg-clip-padding text-neutral-950 outline-0 select-none dark:border-white dark:bg-neutral-950 dark:text-white hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400";

export function MiniCart({ children }: { children: ReactElement }) {
  const isMobile = useIsMobile();
  const id = useId();

  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={children} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl">5 товаров на 3 005 ₽</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 p-4 flex flex-col gap-6">
          <ItemGroup className="gap-4">
            <Item variant="outline">
              <ItemMedia variant="image">
                <Image src="" alt="" width={32} height={32} className="object-cover grayscale" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="line-clamp-1">Шашлык из филе индейки</ItemTitle>
                <ItemDescription>250 гр</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button size="icon-sm" variant="outline" className="rounded-full">
                  <Trash />
                </Button>
              </ItemActions>
              <Separator className="basis-full" />
              <div className="flex basis-full justify-between items-center gap-4">
                <div>2 007 ₽</div>
                <NumberField.Root
                  id={id}
                  defaultValue={3}
                  className="flex flex-col items-start gap-1"
                >
                  <NumberField.Group className="flex h-8">
                    <NumberField.Decrement className={`${stepperClasses} border-r-0`}>
                      <Minus />
                    </NumberField.Decrement>
                    <NumberField.Input className="h-full w-[5ch] text-center border border-neutral-950 bg-white px-2 text-sm font-normal text-neutral-950 tabular-nums any-pointer-coarse:text-base dark:border-white dark:bg-neutral-950 dark:text-white focus:z-1 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white" />
                    <NumberField.Increment className={`${stepperClasses} border-l-0`}>
                      <Plus />
                    </NumberField.Increment>
                  </NumberField.Group>
                </NumberField.Root>
              </div>
            </Item>
          </ItemGroup>
        </div>
        <DrawerFooter>
          <div className="flex items-center justify-between gap-4">
            <div>Сумма заказа</div>
            <div>3 005 ₽</div>
          </div>
          <Button size="lg">К оформлению заказа</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
