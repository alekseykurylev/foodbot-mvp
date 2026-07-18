import { Suspense } from "react";

import { AsideBanner } from "@/modules/catalog/ui/aside-banner";
import { Banners } from "@/modules/catalog/ui/banners/banners";
import { Menu } from "@/modules/catalog/ui/menu/menu";
import { Products } from "@/modules/catalog/ui/products/products";
import { MiniCart } from "@/modules/cart/ui/mini-cart";
import { MiniCartTrigger } from "@/modules/cart/ui/mini-cart-trigger";
import { Container } from "@/common/ui/container";

export function HomeScreen() {
  return (
    <>
      <div className="py-4">
        <Suspense fallback={null}>
          <Banners />
        </Suspense>
      </div>

      <Menu.Root>
        <Suspense fallback={<Menu.ItemsSkeleton />}>
          <Menu.Items />
        </Suspense>
        <MiniCart>
          <MiniCartTrigger />
        </MiniCart>
      </Menu.Root>

      <div className="rounded-b-[48px] bg-white py-6 xl:rounded-b-[60px]">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Products.Root>
              <Suspense fallback={<Products.Skeleton />}>
                <Products.List />
              </Suspense>
            </Products.Root>
            <div>
              <aside className="sticky top-44">
                <AsideBanner />
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
