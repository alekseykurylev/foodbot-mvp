"use client";

import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { ComponentProps } from "react";

import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";
import { cn } from "@/common/utils/cn";

export function MiniCartTrigger({ className, ...props }: ComponentProps<typeof Button>) {
  const { cart } = useCart();
  const { formatMoney } = useMoney();
  const items = cart?.items ?? [];
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Button
      size="lg"
      className={cn("max-md:fixed max-md:right-4 max-md:bottom-4", className)}
      {...props}
    >
      <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
      <span>{totalItems > 0 ? formatMoney(cart?.subtotal) : "Корзина"}</span>
    </Button>
  );
}
