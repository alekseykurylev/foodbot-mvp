"use client";

import { useMoney } from "@/common/ecommerce/use-money";

type ProductCompareAtPriceProps = {
  compareAtPrice?: null | number;
  price?: null | number;
};

export function ProductCompareAtPrice({ compareAtPrice, price }: ProductCompareAtPriceProps) {
  const { formatMoney } = useMoney();

  if (typeof price !== "number" || typeof compareAtPrice !== "number" || compareAtPrice <= price) {
    return null;
  }

  return <span className="line-through text-lg">{formatMoney(compareAtPrice)}</span>;
}
