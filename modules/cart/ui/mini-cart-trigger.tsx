"use client";

import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { ComponentProps } from "react";
import { LucideShoppingBag } from "lucide-react";
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
      size="xl"
      className={cn("max-md:fixed max-md:right-4 max-md:bottom-4", className)}
      {...props}
    >
      <LucideShoppingBag />
      <span>{totalItems > 0 ? formatMoney(cart?.subtotal) : "Корзина"}</span>
    </Button>
  );
}
