"use client";

import * as React from "react";
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { Minus, Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

type NumberFieldProps = Omit<NumberFieldPrimitive.Root.Props, "children"> & {
  groupClassName?: string;
  inputClassName?: string;
};

const stepperClasses =
  "flex h-full w-8 items-center justify-center border border-border bg-background bg-clip-padding text-foreground outline-none select-none transition-colors hover:not-data-disabled:bg-muted active:not-data-disabled:bg-muted disabled:pointer-events-none data-disabled:text-muted-foreground";

function NumberField({
  className,
  groupClassName,
  inputClassName,
  max,
  min,
  step = 1,
  ...props
}: NumberFieldProps) {
  return (
    <NumberFieldPrimitive.Root
      className={cn("flex flex-col items-start gap-1", className)}
      max={max}
      min={min}
      step={step}
      {...props}
    >
      <NumberFieldPrimitive.Group className={cn("flex h-8", groupClassName)}>
        <NumberFieldPrimitive.Decrement
          aria-label="Уменьшить количество"
          className={cn(stepperClasses, "rounded-l-md border-r-0")}
        >
          <HugeiconsIcon aria-hidden="true" icon={Minus} strokeWidth={2} />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          className={cn(
            "h-full w-[5ch] border border-border bg-background px-2 text-center text-sm font-normal text-foreground tabular-nums outline-none focus:z-1 focus:outline-2 focus:-outline-offset-1 focus:outline-ring any-pointer-coarse:text-base",
            inputClassName,
          )}
        />
        <NumberFieldPrimitive.Increment
          aria-label="Увеличить количество"
          className={cn(stepperClasses, "rounded-r-md border-l-0")}
        >
          <HugeiconsIcon aria-hidden="true" icon={Plus} strokeWidth={2} />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

export { NumberField };
