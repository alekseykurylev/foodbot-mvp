import { Suspense } from "react";
import { Banners } from "@/components/banners/banners";
import { Menu } from "@/components/menu/menu";
import { Button } from "@/components/ui/button";
import { ShoppingBasketIcon } from "lucide-react";
import { Products } from "@/components/products/products";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <Banners />

      <Container>
        <Menu.Root>
          <Suspense fallback={<Menu.ItemsSkeleton />}>
            <Menu.Items />
          </Suspense>
          <Button size="lg" className="h-11 px-5 py-3 text-base max-lg:hidden">
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
              <Card className="aspect-square">
                <CardContent>
                  <p>
                    The card component supports a size prop that can be set to &quot;sm&quot; for a
                    more compact appearance.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}
