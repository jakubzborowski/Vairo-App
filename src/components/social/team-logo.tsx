import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-9 text-[13px] rounded-lg",
  md: "size-12 text-[16px] rounded-xl",
  lg: "size-16 text-[22px] rounded-2xl",
} as const;

const pixels = { sm: 36, md: 48, lg: 64 } as const;

/**
 * Logo teamu. Kwadrat z zaokrąglonym rogiem, nie kółko — kółko w całej
 * aplikacji znaczy „człowiek", a tu chodzi o organizację.
 */
export function TeamLogo({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const px = pixels[size];
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        "bg-[var(--surface-2)] font-semibold text-[var(--vairo)] ring-1 ring-inset ring-white/8",
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
