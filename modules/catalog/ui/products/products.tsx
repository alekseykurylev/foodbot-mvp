import type { ComponentProps } from "react";
import Image from "next/image";

import { getMediaImage } from "@/common/helpers/media";
import { Item, ItemActions, ItemContent, ItemGroup, ItemHeader, ItemTitle } from "@/common/ui/item";
import { Skeleton } from "@/common/ui/skeleton";
import { AddToCartButton } from "@/modules/cart/ui/add-to-cart-button";
import { getPublishedProductCategories } from "@/modules/catalog/server/products";

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
        <section key={category.id} id={category.slug ?? undefined} className="scroll-mt-6 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
          <ItemGroup className="grid grid-cols-2 gap-6 md:grid-cols-3">
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
                    <ItemTitle className="px-2 text-center font-semibold lg:text-lg">
                      {product.name}
                    </ItemTitle>
                    {product.description ? (
                      <p className="line-clamp-3 px-2 text-center text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    ) : null}
                    <ItemActions className="w-full flex-col">
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
    <ItemGroup className="grid grid-cols-2 gap-6 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Item key={index}>
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
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
