import Image from "next/image";

export function AsideBanner() {
  return (
    <a
      href="#"
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl"
    >
      <Image
        src="/019ea6dc.webp"
        alt="AsideBanner"
        width={900}
        height={1165}
        loading="eager"
        className="h-auto w-full"
      />
    </a>
  );
}
