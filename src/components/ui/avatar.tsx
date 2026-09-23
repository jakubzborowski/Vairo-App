import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[12px]",
  md: "size-10 text-[14px]",
  lg: "size-14 text-[18px]",
  xl: "size-20 text-[26px]",
} as const;

const pixels = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const;

export function initialsOf(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
};

/** Brak zdjęcia to normalny stan, nie błąd — fallback na inicjały. */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const px = pixels[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-[#f9a870] to-[#e8551a] font-semibold text-white",
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
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
