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
  "data:image/jpeg;base64,/9j/4QDKRXhpZgAATU0AKgAAAAgABgESAAMAAAABAAEAAAEaAAUAAAABAAAAVgEbAAUAAAABAAAAXgEoAAMAAAABAAIAAAITAAMAAAABAAEAAIdpAAQAAAABAAAAZgAAAAAAAABIAAAAAQAAAEgAAAABAAeQAAAHAAAABDAyMjGRAQAHAAAABAECAwCgAAAHAAAABDAxMDCgAQADAAAAAQABAACgAgAEAAAAAQAAABCgAwAEAAAAAQAAABCkBgADAAAAAQAAAAAAAAAAAAD/2wCEAAEBAQEBAQIBAQIDAgICAwQDAwMDBAUEBAQEBAUGBQUFBQUFBgYGBgYGBgYHBwcHBwcICAgICAkJCQkJCQkJCQkBAQEBAgICBAICBAkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCf/dAAQAAf/AABEIABAAEAMBIgACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP0q/a0/aa/bN/al0DXPFPgieXwd4b0HXZDYSaQ0smpQ2ys9vY3Em3Nu8UwMVzIsqbYUkGfu7gfs4ftXfF2zfwz4k+D+l6lPc2aquqrqDXVtcPa6Vdi3ukezmiVZY7gNN5TFt2WjmVhGAW7rx98SPjb+y5YWXwQvfAt1YQaTqsOnzapctF5d9ZRSZ+0W3+sM73Fvv+b5TklSN4wL+k/sh6z+2F8YtH8TeCdJ1nwnothq9vPNqik20MtpZ3n2mSPyJ490pusyQF1K/uyrElQgr/O/L8RmGLzn2k3L6zzvbXlle1ml7yUeiulH+XVs/q+HCOCwuHjWnVbw0YvRytCV7O+lk30UVdNdLo//2Q==";

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
                            className="object-contain"
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
