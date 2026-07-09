import type { Media } from "@/payload-types";

type MediaImageSize = keyof NonNullable<Media["sizes"]>;

type MediaImage = {
  src: string;
  alt: string;
};

export function getMediaImage(
  value: unknown,
  options: {
    fallbackAlt?: string;
    size?: MediaImageSize;
  } = {},
): MediaImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const media = value as Media;
  const src = media.sizes?.[options.size ?? "card"]?.url ?? media.url;

  if (typeof src !== "string" || !src) {
    return null;
  }

  return {
    src,
    alt: typeof media.alt === "string" && media.alt ? media.alt : options.fallbackAlt || "",
  };
}
