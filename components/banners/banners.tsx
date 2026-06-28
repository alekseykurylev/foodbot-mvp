import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  // CarouselNext,
  // CarouselPrevious,
} from "@/components/ui/carousel";

export function Banners() {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <CarouselContent className="-ml-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/2 lg:basis-1/6 pl-1">
            <div className="p-1">
              <Card className="bg-linear-65 from-purple-500 to-pink-500 text-white">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-2xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/*<CarouselPrevious />
      <CarouselNext />*/}
    </Carousel>
  );
}
