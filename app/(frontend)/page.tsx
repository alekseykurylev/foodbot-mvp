import { Suspense } from "react";
import { Banners } from "@/components/banners/banners";
import { Menu } from "@/components/menu/menu";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon } from "lucide-react";
import { Products } from "@/components/products/products";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            <ShoppingBagIcon /> Корзина
          </Button>
        </Menu.Root>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] pt-6">
          <Products.Root>
            <Suspense fallback={<Products.Skeleton />}>
              <Products.List />
            </Suspense>
          </Products.Root>
          <div>
            <aside className="sticky top-36">
              <Card className="aspect-square bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    В мессенджерах <br />
                    выгоднее
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base">Заказывай через макс или telegram и получайте бонусы</p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </Container>
    </>
  );
}
