import { Suspense } from "react";

import { Banners, BannersSkeleton } from "@/modules/catalog/ui/banners/banners";
import { Products } from "@/modules/catalog/ui/products/products";
import { MiniCart } from "@/modules/cart/ui/mini-cart";
import { MiniCartTrigger } from "@/modules/cart/ui/mini-cart-trigger";
import { Container } from "@/common/ui/container";

export function HomeScreen() {
  return (
    <>
      <div className="py-4">
        <Suspense fallback={<BannersSkeleton />}>
          <Banners />
        </Suspense>
      </div>

      <div className="bg-sidebar-accent top-16 sticky z-10">
        <div className="w-full bg-white py-6 rounded-t-[48px] xl:rounded-t-[60px]">
          <Container>
            <div className="flex justify-between gap-4 items-center">
              <h1 className="text-2xl font-bold">Товары</h1>
              <MiniCart>
                <MiniCartTrigger />
              </MiniCart>
            </div>
          </Container>
        </div>
      </div>

      <div className="rounded-b-[48px] bg-white py-6 xl:rounded-b-[60px]">
        <Container>
          <div>
            <Products.Root>
              <Suspense fallback={<Products.Skeleton />}>
                <Products.List />
              </Suspense>
            </Products.Root>
          </div>
        </Container>
      </div>
    </>
  );
}
