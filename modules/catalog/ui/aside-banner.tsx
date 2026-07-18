import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";

export function AsideBanner() {
  return (
    <Card className="aspect-square bg-fuchsia-700 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          В мессенджерах <br />
          выгоднее
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base">Заказывай через макс или telegram со скидкой!</p>
      </CardContent>
    </Card>
  );
}
