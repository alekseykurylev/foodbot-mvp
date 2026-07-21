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

              return (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  productName={product.name}
                  description={product.description}
                  image={image ?? undefined}
                  price={product.priceInRUB}
                  compareAtPrice={product.compareAtPriceInRUB}
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
