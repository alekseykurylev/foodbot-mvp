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
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

const blurDataURL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDU1PUtT1GJ5YcwwpJldnLAdj6eh/Gk0/U7geS9ojsyj59xIJCnB4xznmpZ7i705UtWtCoRwrOxGGHqPXjNKmlnVb1JIY5IY1fl+gIBz0755rylzSnrudvIkr30P//Z";

function ProductsRoot({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="space-y-10" {...props}>
      {children}
    </div>
  );
}

async function ProductsList() {
  const productCategories = await getActiveProductCategories();

  return (
    <>
      {productCategories.map(({ category, products }) => {
        return (
          <section id={category.slug} key={category.id} className="space-y-10 scroll-mt-40">
            <h2 className="text-2xl font-bold">{category.name}</h2>

            <ItemGroup className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const productImage = getMediaImage(product.image, {
                  fallbackAlt: product.name,
                });

                return (
                  <Item key={product.id} className="p-0">
                    <ItemHeader>
                      {productImage ? (
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                          <Image
                            src={productImage.src}
                            alt={productImage.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            quality={75}
                            style={{ objectFit: "contain" }}
                            placeholder="blur"
                            blurDataURL={blurDataURL}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full rounded-lg bg-muted" />
                      )}
                    </ItemHeader>
                    <ItemContent className="gap-3 items-center">
                      <ItemTitle className="lg:text-lg px-2 font-semibold text-center">
                        {product.name}
                      </ItemTitle>
                      <ItemActions className="flex-col w-full">
                        <AddToCartButton
                          productId={product.id}
                          productName={product.name}
                          price={product.price}
                        />
                      </ItemActions>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          </section>
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
