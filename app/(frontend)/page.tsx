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
      <div className="py-4">
        <Banners />
      </div>

      <Menu.Root>
        <Suspense fallback={<Menu.ItemsSkeleton />}>
          <Menu.Items />
        </Suspense>
        <Button size="lg" className="h-11 px-5 py-4 text-base max-lg:hidden">
          <ShoppingBagIcon /> Корзина
        </Button>
      </Menu.Root>

      <div className="bg-white rounded-b-4xl xl:rounded-b-[60px] py-6">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Products.Root>
              <Suspense fallback={<Products.Skeleton />}>
                <Products.List />
              </Suspense>
            </Products.Root>
            <div>
              <aside className="sticky top-44">
                <Card className="aspect-square bg-fuchsia-700 text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      В мессенджерах <br />
                      выгоднее
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base">
                      Заказывай через макс или telegram и получайте бонусы
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
