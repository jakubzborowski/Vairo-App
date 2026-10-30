"use client";

import Link, { useLinkStatus } from "next/link";
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
        "group relative inline-flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5",
        "text-[13px] font-medium transition-colors duration-150",
        // Spoczynek to `--text-muted`, nie `--text-subtle`: menu czyta się
        // kilka razy dziennie, a przygaszone pozycje wyglądały na wyłączone.
        active
          ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
          : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-white"
      )}
    >
      <NavPending />
      {/* Znacznik bieżącej pozycji: **pastylka wewnątrz kafelka**, nie kreska
          na jego krawędzi.

          Wcześniej pasek stał na `left-0` i ciągnął się prawie przez całą
          wysokość — czyli dokładnie tam, gdzie tło zaczyna się zaokrąglać.
          Prosta linia o pełnym kryciu położona na łuku zawsze wygląda na
          przyciętą: u góry i u dołu wychodziła poza pomarańczowe wypełnienie
          i wisiała w powietrzu. To ta sama pomyłka co przy `ridge` na
          krawędzi karty.

          Krótka, wyśrodkowana pastylka odsunięta od brzegu leży w płaskiej
          części kafelka, więc łuk jej nie dotyczy. Kolor tła sam nie
          wystarcza — znacznik widać kątem oka, bez czytania. */}
      {active ? (
        <span
          className="absolute left-0.5 top-[7px] h-[18px] w-[3px] rounded-full bg-[var(--vairo)]"
          aria-hidden="true"
        />
      ) : null}
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{item.label}</span>
      {count ? <CountBadge count={count} /> : null}
    </Link>
  );
}

/**
 * Natychmiastowy sygnał, że kliknięcie w menu zadziałało — uwaga z redesignu
 * o „czasach ładowania na sidebarze”. Każda strona ma już ekran ładowania,
 * ale między kliknięciem a jego pojawieniem się mija chwila (zwłaszcza
 * w `npm run dev`, gdzie strona kompiluje się przy pierwszym wejściu).
 * Pulsująca kreska przy pozycji mówi „już idę”, zanim cokolwiek się zmieni.
 */
function NavPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-white/70 transition-opacity",
        pending ? "animate-pulse opacity-100" : "opacity-0"
      )}
    />
  );
}
