import { Suspense } from "react";
import { Banners } from "@/components/banners/banners";
import { Menu } from "@/components/menu/menu";
import { Button } from "@/components/ui/button";
import { ShoppingBasketIcon } from "lucide-react";
import { Products } from "@/components/products/products";

export default function Page() {
  return (
    <>
      <Banners />

      <Menu.Root>
        <Suspense fallback={<Menu.ItemsSkeleton />}>
          <Menu.Items />
        </Suspense>
        <Button size="lg">
          <ShoppingBasketIcon /> Корзина
        </Button>
      </Menu.Root>

      <Products.Root>
        <Suspense fallback={<Products.Skeleton />}>
          <Products.List />
        </Suspense>
      </Products.Root>
    </>
  );
}
