"use client";

import type { ComponentProps } from "react";
import { Button } from "@/common/ui/button";
import { cn } from "@/common/utils/cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons";
import { formatRubles } from "@/common/helpers/format";
import { useCartTotalAmount, useCartTotalItems } from "@/modules/cart/model/store";

export function MiniCartTrigger({ className, ...props }: ComponentProps<typeof Button>) {
  const totalAmount = useCartTotalAmount();
  const totalItems = useCartTotalItems();

  return (
    <Button
      size="lg"
      className={cn("max-md:fixed max-md:bottom-4 max-md:right-4", className)}
      {...props}
    >
      <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
      <span>{totalItems > 0 ? formatRubles(totalAmount) : "Корзина"}</span>
    </Button>
  );
}
