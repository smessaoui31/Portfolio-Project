import Image from "next/image";

/** Round product photo; a warm disc when there is no image. */
export function ProductImage({
  src,
  alt,
  size,
  className = "",
  priority = false,
}: {
  src: string | null;
  alt: string;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a2e25,#1a1410)] ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
