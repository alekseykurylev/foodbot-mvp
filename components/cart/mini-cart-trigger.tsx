"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingBagIcon } from "lucide-react";

export function MiniCartTrigger({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button size="lg" className={cn("h-11 px-5 py-4 text-base ", className)} {...props}>
      <ShoppingBagIcon /> Корзина
    </Button>
  );
}
