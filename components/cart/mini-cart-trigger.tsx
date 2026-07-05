"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons";

export function MiniCartTrigger({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      size="xl"
      className={cn("max-md:fixed max-md:bottom-4 max-md:right-4", className)}
      {...props}
    >
      <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
      {/*<span>Корзина</span>*/}
      <span>2 007 ₽</span>
    </Button>
  );
}
