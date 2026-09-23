"use client";

import Link from "next/link";
import { CountBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

type Props = {
  item: NavItem;
  active: boolean;
  count?: number;
};

/**
 * Pozycja nawigacji.
 *
 * Zawsze jest linkiem do działającego ekranu — stan „wyszarzone, bo jeszcze
 * nie powstało" nie istnieje, bo takie pozycje w ogóle nie trafiają do menu.
 * Decyduje o tym `nav-config.ts`; tutaj nie ma żadnej logiki dostępu.
 */
export function NavRow({ item, active, count }: Props) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2",
        "text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
          : "text-[var(--text-subtle)] hover:bg-white/[0.05] hover:text-white"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{item.label}</span>
      {count ? <CountBadge count={count} /> : null}
    </Link>
  );
}
