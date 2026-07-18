import Image from "next/image";

import { getMediaImage } from "@/common/helpers/media";
import { Carousel, CarouselContent, CarouselItem } from "@/common/ui/carousel";
import { getActiveBanners } from "@/modules/catalog/server/banners";

export async function Banners() {
  const banners = await getActiveBanners();

  if (!banners.length) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <CarouselContent className="-ml-1">
        {banners.map((banner) => {
          const image = getMediaImage(banner.image, { size: "wide" });

          if (!image) {
            return null;
          }

          const bannerImage = (
            <div className="relative aspect-35/44 w-full overflow-hidden rounded-xl">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 16vw"
                className="object-cover"
              />
            </div>
          );

          return (
            <CarouselItem key={banner.id} className="basis-1/2 pl-2 md:basis-1/4 lg:basis-1/6">
              {banner.link ? (
                <a href={banner.link} className="block">
                  {bannerImage}
                </a>
              ) : (
                bannerImage
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}

export function BannersSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-2 px-4 sm:px-6 md:grid-cols-4 lg:grid-cols-6 lg:px-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`aspect-35/44 w-full rounded-xl bg-white ${index < 2 ? "" : index < 4 ? "hidden md:block" : "hidden lg:block"}`}
        />
      ))}
    </div>
  );
}
