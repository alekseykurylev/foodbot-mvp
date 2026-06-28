import { Suspense } from "react";
import { Banners } from "@/components/banners/banners";
import { Menu } from "@/components/menu/menu";
import { Button } from "@/components/ui/button";
import { ShoppingBasketIcon } from "lucide-react";

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
    </>
  );
}
