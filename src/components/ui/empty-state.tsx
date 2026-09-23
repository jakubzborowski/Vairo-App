import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Pusty stan to miejsce, w którym aplikacja uczy — nie dziura w layoucie.
 * Mówi trzy rzeczy: co to jest, dlaczego warto, jeden przycisk.
 * Używamy go wszędzie tam, gdzie kusi wstawienie zmyślonych danych.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-subtle)]">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>
      ) : null}
      <p className="font-heading text-[17px] font-semibold text-white">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--text-subtle)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex gap-2">{action}</div> : null}
    </div>
  );
}
