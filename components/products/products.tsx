import { ComponentProps } from "react";
import { getActiveProductCategories } from "@/lib/domain/products";
import { getMediaImage } from "@/lib/helpers/media";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { Button } from "../ui/button";

function ProductsRoot({ children, ...props }: ComponentProps<"div">) {
  return <div className="space-y-10">{children}</div>;
}

async function ProductsList() {
  const productCategories = await getActiveProductCategories();

  return (
    <>
      {productCategories.map(({ category, products }) => {
        return (
          <div key={category.id} className="space-y-10">
            <h2 className="text-2xl font-bold">{category.name}</h2>

            <ItemGroup className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const productImage = getMediaImage(product.image, {
                  fallbackAlt: product.name,
                });

                return (
                  <Item key={product.id}>
                    <ItemHeader>
                      {productImage ? (
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                          <Image
                            src={productImage.src}
                            alt={productImage.alt}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full rounded-lg bg-muted" />
                      )}
                    </ItemHeader>
                    <ItemContent className="gap-3 items-center">
                      <ItemTitle className="text-xl font-semibold text-center">
                        {product.name}
                      </ItemTitle>
                      <ItemActions>
                        <Button size="lg" variant="secondary" className="h-11 px-5 py-3 text-lg">
                          <span className="font-medium">{product.price} &#8381;</span>
                        </Button>
                      </ItemActions>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          </div>
        );
      })}
    </>
  );
}

function ProductsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => {
        return (
          <div key={index} className="space-y-6">
            <Skeleton className="h-5 w-1/6" />

            <ItemGroup className="grid grid-cols-3 gap-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <Item key={index}>
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </Item>
              ))}
            </ItemGroup>
          </div>
        );
      })}
    </>
  );
}

export const Products = {
  Root: ProductsRoot,
  List: ProductsList,
  Skeleton: ProductsSkeleton,
};
