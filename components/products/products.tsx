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

const blurDataURL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADiUlEQVR42jXTy28UdQDA8e9v57mz2+5sd4fuo6XbB2StPBSICA1ikRi9cSBEIR70pIkH412v3OBgTIzxogejCRyIiYmJlUhjiwhaiAJdKNBttwvbdh/tvmZ2Hl708z98BP+p1f4ylYAP/dbmW6Xbt8bldkUbmog1l/64jmG9EO0zPHtx5qel5LDy/fxM4bN3rzTqABJArbwwGpVCV3RJeqd597cdi5c/l+urd0W9UtXWynUtsCThxLflVljs6Nu5Z9rutk68aj6d+aFAXQpKNw1fCy7fL/54dL1cJFRZ405jgSuLHYoLLbYHFYzDccp+Fd9KoOQmMCQ/233y6MCZ3b3vZMfQ3r49O3Ps0uJXdCIeqmvzoF1jx3GL4s02ItGPK+lEI1mEXWPp+g32Jacx4nPHap3iWenUiamL57/5JBcaDzDtPqQll0wxjDnSjzOuIFkOqgfxlR7KrfuU50rM/l4irtlE9SAmjQ7GLzyr3wjvGU1zKkhwMp8nK9loz9o8ia6zJVfYeljhsBhhPDdEd9tFNTT2TyRZeERMOvtK5vzrWUXkWhES8Qj9mSwiPMDPsy2m0mH+vOpy+xeXqbzFg8dNXMfntZN5RNchmozo0hu79E/z+/Ki97RCdHQSwxpmYOIQg6aCXllmODuJHkmRjqdRVEEgC0aey5HKmcR0AjltBq7d2VbHXt5LNKmgWiO0ivPsmoxTNY+Scl0y3Yd0BaxUXITT4NK3VxndKYgJyQ05dleNWYMksiayrBC4NkZyEMftoiUyGLrG4K44e4+M8k85RKBGYb3NtbkqTW1MDelqz1PUfjw5gaQZNDcKtLer3Jn9lVbbxczlSQ6l0ESD43mPwBF0/TDNLcEmcU+OyuF1NgqpetCPmcniOS6lR0uUVmoMv+jTI0q3E8JubDH1koErEpRWt1iYL3BwampdLq+519JD/plWZ5u1jWXmbq5SLW/i9HrsLS8RVXzsrku9uIyShqf3/iYky0yfPkdqz+Q1aX9WL1UbnCssFuWNcpme42HFFXwhkVTaRBTBZmGVbqeB57sIz0EdmyZ18nTXI/hAAHz93tj7z0+YF3ZmzXAvkHi8XEHW+whaNVTd4tm9FbL7x5FjFtnDb6KP7Os4Tu/jfuvgF+L/zitfTp8ISf5HQtaO/H23NOB4Id/tNKummSG5+8BAfPJIKDYyUZX0yLxrdy72WYeuAvwLnJKE30iemzoAAAAASUVORK5CYII=\n";

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
                            quality={60}
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
                        <Button
                          size="lg"
                          variant="secondary"
                          className="lg:h-11 lg:px-5 lg:py-3 lg:text-lg"
                        >
                          <span className="font-medium">{product.price} &#8381;</span>
                        </Button>
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
