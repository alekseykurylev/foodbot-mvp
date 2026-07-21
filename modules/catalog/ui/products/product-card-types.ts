import type { DefaultDocumentIDType } from "payload";

export type ProductCardImage = {
  alt: string;
  src: string;
};

export type ProductCardVariant = {
  compareAtPrice?: null | number;
  id: DefaultDocumentIDType;
  options: ProductCardVariantOption[];
  price: number;
};

export type ProductCardVariantOption = {
  id: DefaultDocumentIDType;
  label: string;
  optionOrder: number;
  typeId: DefaultDocumentIDType;
  typeLabel: string;
  typeOrder: number;
};
