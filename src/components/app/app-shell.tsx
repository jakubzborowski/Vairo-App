"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { signOut } from "@/app/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { footerNav, isActivePath, navGroups, type NavItem } from "./nav-config";
import { AppBackdrop } from "./app-backdrop";
import { NavRow } from "./nav-item";
import { TeamSwitcher, type TeamSummary } from "./team-switcher";

const SOCIAL_OPEN_KEY = "vairo:nav:social-open";

const subscribeNoop = () => () => {};

function readSocialOpen() {
  try {
    return window.localStorage.getItem(SOCIAL_OPEN_KEY) !== "0";
  } catch {
    return true;
  }
}

export type AppUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type AppShellProps = {
  user: AppUser;
  teams: TeamSummary[];
  activeTeamId: string | null;
  /** Czy w aktywnym teamie user jest Founderem albo Adminem. */
  canManageActiveTeam: boolean;
  /**
   * Liczniki przy pozycjach nawigacji. Zawsze prawdziwe dane z bazy —
   * licznik, który kłamie, jest gorszy niż brak licznika.
   */
  badges?: Partial<Record<NonNullable<NavItem["badgeKey"]>, number>>;
  children: React.ReactNode;
};

export function AppShell({
  user,
  teams,
  activeTeamId,
  canManageActiveTeam,
  badges,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const hasTeam = teams.length > 0;
  // Nagłówek grupy nosi NAZWĘ startupu, nie słowo „team".
  //
  // Vairo pozwala należeć do trzech zespołów naraz, a cały workspace — etapy,
  // skład, otwarte role, odpowiedzi — jest za każdym razem inny. Napis
  // „Twój team" nad menu sugerował, że jest jeden i że to po prostu sekcja
  // aplikacji. Nazwa startupu mówi wprost: **to, co widzisz niżej, dotyczy
  // TEGO projektu**, a przełącznik nad nim zmienia wszystko naraz.
  const activeTeamName =
    teams.find((team) => team.id === activeTeamId)?.name ?? teams[0]?.name ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Stan rozwinięcia grupy Social przeżywa przeładowanie strony.
  // localStorage to zewnętrzne źródło, więc czytamy je przez subskrypcję —
  // serwer dostaje własny snapshot i nie ma niezgodności przy hydracji.
  const persistedSocialOpen = useSyncExternalStore(
    subscribeNoop,
    readSocialOpen,
    () => true
  );
  const [socialOverride, setSocialOverride] = useState<boolean | null>(null);
  const socialOpen = socialOverride ?? persistedSocialOpen;

  const toggleSocial = () => {
    const next = !socialOpen;
    setSocialOverride(next);
    try {
      window.localStorage.setItem(SOCIAL_OPEN_KEY, next ? "1" : "0");
    } catch {
      // prywatne okno / zablokowane storage — panel i tak działa, po prostu
      // nie zapamięta stanu między wizytami
    }
  };

  // Panel mobilny zamyka się po kliknięciu w link — w handlerze, nie w efekcie
  // na zmianę ścieżki. Klik w rozwijanie grupy Social ma go zostawić otwartym.
  const closeOnNavigate = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
  };

  const renderItem = (item: NavItem) => (
    <li key={item.href}>
      <NavRow
        item={item}
        active={isActivePath(pathname, item.href)}
        count={item.badgeKey ? badges?.[item.badgeKey] : undefined}
      />
    </li>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-5 px-3 py-5">
      <Link
        href="/app"
        className="inline-flex items-center gap-2 px-2"
        aria-label="Vairo — dashboard"
      >
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={28}
          height={28}
          className="size-7 object-contain"
        />
        <span className="font-heading text-[1.2rem] font-bold lowercase tracking-tight">
          vairo
        </span>
      </Link>

      <TeamSwitcher teams={teams} activeTeamId={activeTeamId} />

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {navGroups.map((group) => {
          const collapsed = group.collapsible && !socialOpen;

          // User bez teamu ma wyłącznie warstwę Social — grupa workspace'u
          // nie jest wyszarzona, tylko w ogóle się nie pojawia.
          if (group.id === "team" && !hasTeam) return null;

          return (
            <div key={group.id}>
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={toggleSocial}
                  aria-expanded={socialOpen}
                  className="mb-1 inline-flex w-full items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-subtle)] transition-colors hover:text-white"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform",
                      !socialOpen && "-rotate-90"
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <p className="mb-1 truncate px-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                  {group.id === "team" && activeTeamName
                    ? activeTeamName
                    : group.label}
                </p>
              )}

              {collapsed ? null : (
                <ul className="flex flex-col gap-0.5">
                  {group.items
                    .filter((item) => !item.requiresManage || canManageActiveTeam)
                    .map(renderItem)}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] pt-3">
        <ul className="mb-2 flex flex-col gap-0.5">
          {footerNav.map(renderItem)}
        </ul>

        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-[var(--text-subtle)]">
              {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Wyloguj się"
              title="Wyloguj się"
              className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-full flex-1 bg-[var(--bg)] text-white">
      <AppBackdrop />

      {/* Sidebar jest lekko przezroczysty, żeby światło z tła pod nim
          przechodziło — bez tego byłby płaskim czarnym pasem doklejonym
          do reszty. */}
      <aside className="sticky top-0 z-10 hidden h-svh w-[248px] shrink-0 border-r border-white/[0.06] bg-[var(--sidebar)]/80 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile: panel wysuwany zamiast ukrywania połowy aplikacji */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div
            onClick={closeOnNavigate}
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-white/[0.06] bg-[var(--sidebar)]"
          >
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[var(--bg)]/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Otwórz menu"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-[var(--text-muted)]"
          >
            <Menu className="size-4" />
          </button>
          <Link href="/app" className="inline-flex items-center gap-2">
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={24}
              height={24}
              className="size-6 object-contain"
            />
            <span className="font-heading text-[1.05rem] font-bold lowercase">
              vairo
            </span>
          </Link>
          <Link href="/app/settings/profile" className="ml-auto">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          </Link>
        </header>

        <main className="app-enter flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
