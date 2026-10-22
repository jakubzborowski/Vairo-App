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

/**
 * Licznik przy pozycji nawigacji. Powyżej 9 pokazuje 9+.
 *
 * Neutralny, nie pomarańczowy: w menu stoją naraz dwa–trzy liczniki, a każdy
 * w kolorze marki odbierał akcentowi znaczenie „tu patrz". Pomarańcz dostaje
 * tylko dzwonek w stopce (`tone="brand"`) — jedno miejsce na całe menu.
 */
export function CountBadge({ count, tone = "neutral" }: { count: number; tone?: "neutral" | "brand" }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "tabular ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
        tone === "brand"
          ? "bg-[var(--vairo-strong)] text-white"
          : "bg-[var(--surface-3)] text-[var(--text-muted)]"
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
