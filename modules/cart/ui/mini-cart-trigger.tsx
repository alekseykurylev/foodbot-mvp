"use client";

import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import type { ComponentProps } from "react";
import { LucideShoppingBag } from "lucide-react";
import { useMoney } from "@/common/ecommerce/use-money";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/spinner";
import { cn } from "@/common/utils/cn";

export function MiniCartTrigger({ className, disabled, ...props }: ComponentProps<typeof Button>) {
  const { cart, isLoading } = useCart();
  const { formatMoney } = useMoney();
  const items = cart?.items ?? [];
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Button
      {...props}
      size="xl"
      className={cn("max-md:fixed max-md:right-4 max-md:bottom-4", className)}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Spinner data-icon="inline-start" aria-label="Обновление корзины" />
      ) : (
        <LucideShoppingBag data-icon="inline-start" />
      )}
      <span>{totalItems > 0 ? formatMoney(cart?.subtotal) : "Корзина"}</span>
    </Button>
  );
}
