import type { ComponentProps } from "react";
import { getMediaImage } from "@/common/helpers/media";
import { Item, ItemGroup } from "@/common/ui/item";
import { Skeleton } from "@/common/ui/skeleton";
import { getPublishedProductCategories } from "@/modules/catalog/server/products";
import { ProductCard } from "@/modules/catalog/ui/products/product-card";

function ProductsRoot({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="space-y-10" {...props}>
      {children}
    </div>
  );
}

async function ProductsList() {
  const groups = await getPublishedProductCategories();

  return (
    <div className="space-y-10">
      {groups.map(({ category, products }) => (
        <section
          key={category.id}
          id={category.slug ?? undefined}
          className="scroll-mt-40 space-y-10"
        >
          <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
          <ItemGroup className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const image = getMediaImage(product.image, { fallbackAlt: product.name });
              const variantTypeLabels = new Map(
                (product.variantTypes ?? []).flatMap((variantType) =>
                  typeof variantType === "object"
                    ? [[String(variantType.id), variantType.label] as const]
                    : [],
                ),
              );
              const variants = (product.variants?.docs ?? []).flatMap((variant) => {
                if (typeof variant !== "object") return [];

                const options = variant.options.flatMap((option) => {
                  if (typeof option !== "object") return [];

                  const variantType = option.variantType;
                  const typeId = typeof variantType === "object" ? variantType.id : variantType;
                  const typeLabel =
                    typeof variantType === "object"
                      ? variantType.label
                      : variantTypeLabels.get(String(variantType));

                  if (!typeLabel) return [];

                  return [
                    {
                      id: option.id,
                      label: option.label,
                      typeId,
                      typeLabel,
                    },
                  ];
                });

                return [
                  {
                    id: variant.id,
                    options,
                    price: variant.priceInRUB,
                    compareAtPrice: variant.compareAtPriceInRUB,
                  },
                ];
              });
              const lowestPriceVariant = variants.reduce<(typeof variants)[number] | undefined>(
                (lowest, variant) => (!lowest || variant.price < lowest.price ? variant : lowest),
                undefined,
              );

              return (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  productName={product.name}
                  description={product.description}
                  image={image ?? undefined}
                  price={lowestPriceVariant?.price ?? product.priceInRUB}
                  compareAtPrice={lowestPriceVariant?.compareAtPrice ?? product.compareAtPriceInRUB}
                  variants={variants}
                />
              );
            })}
          </ItemGroup>
        </section>
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <ItemGroup className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Item key={index} className="flex flex-col justify-center">
          <Skeleton className="aspect-square rounded-full w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-11 w-1/3" />
        </Item>
      ))}
    </ItemGroup>
  );
}

export const Products = {
  Root: ProductsRoot,
  List: ProductsList,
  Skeleton: ProductsSkeleton,
};
