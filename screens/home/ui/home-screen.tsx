import { Suspense } from "react";

import { Banners, BannersSkeleton } from "@/modules/catalog/ui/banners/banners";
import { Menu, MenuSkeleton } from "@/modules/catalog/ui/menu/menu";
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
              <Suspense fallback={<MenuSkeleton />}>
                <Menu />
              </Suspense>
              <MiniCart>
                <MiniCartTrigger />
              </MiniCart>
            </div>
          </Container>
        </div>
      </div>

      <div className="rounded-b-[48px] bg-white py-6 xl:rounded-b-[60px]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Products.Root>
              <Suspense fallback={<Products.Skeleton />}>
                <Products.List />
              </Suspense>
            </Products.Root>
            <div>
              <aside className="sticky top-44">Banner</aside>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
