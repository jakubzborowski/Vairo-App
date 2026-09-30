import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/8 text-[var(--text-muted)]",
  brand: "bg-[var(--vairo)]/15 text-[var(--vairo)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
  info: "bg-[var(--info)]/15 text-[var(--info)]",
} as const;

export type BadgeTone = keyof typeof tones;

/** Statusy Subpointów, tasków i zaproszeń. Nigdy jako przycisk. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

/** Licznik przy pozycji nawigacji. Powyżej 9 pokazuje 9+. */
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="tabular ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--vairo)] px-1.5 text-[11px] font-semibold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
