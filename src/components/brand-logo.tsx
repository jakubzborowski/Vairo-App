import Image from "next/image";
import { cn } from "@/lib/utils";

/** Proporcje pliku `public/brand/logo-full.webp` (256 × 81). */
const RATIO = 256 / 81;

/**
 * Znak i napis Vairo z pliku marki.
 *
 * Wcześniej w sześciu miejscach stał sam znak, a obok słowo „vairo” złożone
 * Poppinsem — wyglądało jak logo, ale nim nie było: inne litery, inny
 * odstęp, inna waga niż w identyfikacji. Teraz wszędzie jest ten sam plik.
 *
 * `height` to wysokość całości. Znak zajmuje ją w pełni, więc dawne
 * `size-7` przy samym znaku odpowiada tu `height={28}`.
 *
 * Plik ma 256 × 81 px — ostry do ok. 40 px wysokości na ekranach 2×.
 * Przy większym użyciu potrzebna jest wersja SVG.
 */
export function BrandLogo({
  height = 28,
  priority = false,
  className,
}: {
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-full.webp"
      alt="Vairo"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      // Plik jest już małym WebP — optymalizator nie ma tu czego poprawić.
      unoptimized
      className={cn("block shrink-0 object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );
}
