import { Suspense } from "react";
import { Banners } from "@/components/banners/banners";
import { Menu } from "@/components/menu/menu";
import { Button } from "@/components/ui/button";
import { ShoppingBasketIcon } from "lucide-react";
import { Products } from "@/components/products/products";
import { Container } from "@/components/ui/container";

export default function Page() {
  return (
    <>
      <Banners />

      <Container>
        <Menu.Root>
          <Suspense fallback={<Menu.ItemsSkeleton />}>
            <Menu.Items />
          </Suspense>
          <Button size="lg">
            <ShoppingBasketIcon /> Корзина
          </Button>
        </Menu.Root>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] pt-6">
          <Products.Root>
            <Suspense fallback={<Products.Skeleton />}>
              <Products.List />
            </Suspense>
          </Products.Root>
          <div>
            <aside className="sticky top-20">
              <div className="aspect-square bg-amber-300">123</div>
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}
