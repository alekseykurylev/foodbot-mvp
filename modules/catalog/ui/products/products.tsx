import type { ComponentProps } from "react";
import Image from "next/image";

import { getMediaImage } from "@/common/helpers/media";
import { Item, ItemActions, ItemContent, ItemGroup, ItemHeader, ItemTitle } from "@/common/ui/item";
import { Skeleton } from "@/common/ui/skeleton";
import { AddToCartButton } from "@/modules/cart/ui/add-to-cart-button";
import { getPublishedProductCategories } from "@/modules/catalog/server/products";
import { ProductCompareAtPrice } from "@/modules/catalog/ui/products/product-compare-at-price";

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

              return (
                <Item key={product.id} className="p-0">
                  <ItemHeader>
                    {image ? (
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full rounded-lg bg-muted" />
                    )}
                  </ItemHeader>
                  <ItemContent className="items-center gap-3">
                    <ItemTitle className="lg:text-lg px-2 font-semibold text-center">
                      {product.name}
                    </ItemTitle>
                    <ItemActions className="w-full flex-col">
                      <ProductCompareAtPrice
                        compareAtPrice={product.compareAtPriceInRUB}
                        price={product.priceInRUB}
                      />
                      <AddToCartButton
                        productId={product.id}
                        productName={product.name}
                        price={product.priceInRUB}
                      />
                    </ItemActions>
                  </ItemContent>
                </Item>
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
          <Skeleton className="h-11 w-1/4" />
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
