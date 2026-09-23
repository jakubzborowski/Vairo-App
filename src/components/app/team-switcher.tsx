"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Loader2, Plus, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { switchTeam } from "@/app/app/actions";
import { Avatar } from "@/components/ui/avatar";

export const MAX_TEAMS = 3;

export type TeamSummary = {
  id: string;
  name: string;
  logoUrl: string | null;
  stageLabel?: string | null;
  progressLabel?: string | null;
};

type Props = {
  teams: TeamSummary[];
  activeTeamId: string | null;
};

/**
 * Switcher teamów. Guidelines wymagają go wprost, gdy user należy do więcej
 * niż jednego startupu — wszystkie dane workspace'u są filtrowane po startup_id.
 *
 * Limit 3 członkostw jest egzekwowany w bazie (trigger na startup_members);
 * tutaj pokazujemy go zawczasu, żeby user nie klikał w ścianę.
 */
export function TeamSwitcher({ teams, activeTeamId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, startSwitching] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Wybór zapisuje ciasteczko po stronie serwera — inaczej layout
  // (który renderuje ten switcher) nie dowiedziałby się o zmianie.
  const onSelect = (id: string) => {
    if (id === activeTeamId) {
      setOpen(false);
      return;
    }
    startSwitching(async () => {
      await switchTeam(id);
      setOpen(false);
      router.push("/app");
      router.refresh();
    });
  };
  const active = teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null;
  const atLimit = teams.length >= MAX_TEAMS;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Brak teamu to normalny stan — taki user ma warstwę Social i nic więcej.
  if (!active) {
    return (
      <Link
        href="/app/startups/new"
        className="flex items-center gap-2.5 rounded-xl border border-dashed border-white/12 px-3 py-2.5 transition-colors hover:border-[var(--vairo)]/50 hover:bg-white/[0.03]"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-subtle)]">
          <Rocket className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-white">
            Brak teamu
          </span>
          <span className="block truncate text-[11px] text-[var(--text-subtle)]">
            Stwórz startup
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[var(--surface-2)] px-3 py-2.5 text-left transition-colors hover:border-white/16"
      >
        <Avatar src={active.logoUrl} name={active.name} size="sm" className="rounded-lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-white">
            {active.name}
          </span>
          {active.stageLabel ? (
            <span className="block truncate text-[11px] text-[var(--text-subtle)]">
              {active.stageLabel}
              {active.progressLabel ? ` · ${active.progressLabel}` : ""}
            </span>
          ) : null}
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-[var(--text-faint)]"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 shadow-[0_12px_40px_rgba(0,0,0,.6)]"
        >
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              role="menuitem"
              disabled={switching}
              onClick={() => onSelect(team.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
            >
              <Avatar src={team.logoUrl} name={team.name} size="xs" className="rounded-md" />
              <span className="min-w-0 flex-1 truncate">{team.name}</span>
              {switching && team.id !== active.id ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" />
              ) : team.id === active.id ? (
                <Check className="size-3.5 shrink-0 text-[var(--vairo)]" />
              ) : null}
            </button>
          ))}

          <div className="my-1 border-t border-white/[0.06]" />

          {atLimit ? (
            <span
              aria-disabled="true"
              title={`Limit ${MAX_TEAMS} teamów na konto`}
              className="flex cursor-not-allowed items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-faint)]"
            >
              <Plus className="size-3.5 shrink-0" />
              Limit {MAX_TEAMS} teamów
            </span>
          ) : (
            <Link
              href="/app/startups/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Plus className="size-3.5 shrink-0" />
              Nowy startup
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
