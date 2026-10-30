"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, GraduationCap, HelpCircle, LogOut, Menu as MenuIcon, Settings } from "lucide-react";
import { signOut } from "@/app/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type StartupRole } from "@/types/startup";
import { isActivePath, navGroups, type NavItem } from "./nav-config";
import { AppBackdrop } from "./app-backdrop";
import { NavRow } from "./nav-item";
import { TeamSwitcher, type TeamSummary } from "./team-switcher";
import { BrandLogo } from "@/components/brand-logo";
import { OPEN_TOUR_EVENT, WelcomeTour } from "./welcome-tour";

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
  /** Rola w aktywnym teamie — podpis pod imieniem w stopce menu. */
  activeRole?: StartupRole | null;
  /**
   * Liczniki przy pozycjach nawigacji. Zawsze prawdziwe dane z bazy —
   * licznik, który kłamie, jest gorszy niż brak licznika.
   */
  badges?: Partial<Record<NonNullable<NavItem["badgeKey"]>, number>>;
  /** Po domknięciu Preparation. Wcześniej Cele, Taski i Rozpiska nie są w menu. */
  executionUnlocked?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  user,
  teams,
  activeTeamId,
  canManageActiveTeam,
  activeRole = null,
  badges,
  executionUnlocked = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, startSigningOut] = useTransition();
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
        <BrandLogo height={28} />
      </Link>

      <TeamSwitcher teams={teams} activeTeamId={activeTeamId} />

      {/* Maska u dołu mówi, że menu ciągnie się dalej — przy rozwiniętym
          Social na niższym ekranie ostatnie pozycje chowały się pod stopką
          bez żadnego śladu. */}
      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Wytyczne (ścieżka Joinera): ikona dashboardu zostaje widoczna
            także bez teamu. Kliknięcie prowadzi do „Dołącz do teamu albo
            stwórz własny startup" — nie do pustego ekranu. */}
        {!hasTeam ? (
          <ul className="flex flex-col gap-0.5">
            {renderItem(navGroups[0]!.items[0]!)}
          </ul>
        ) : null}

        {navGroups.map((group) => {
          const collapsed = group.collapsible && !socialOpen;

          // User bez teamu ma wyłącznie warstwę Social — grupa workspace'u
          // nie jest wyszarzona, tylko w ogóle się nie pojawia.
          if ((group.id === "team" || group.id === "work") && !hasTeam) return null;

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
                    .filter((item) => executionUnlocked || !item.requiresExecution)
                    .filter((item) => !item.requiresManage || canManageActiveTeam)
                    .map(renderItem)}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Stopka to OSOBA, nie lista linków. Trzy pozycje, które tu stały
          (Powiadomienia, Jak to działa, Ustawienia), zabierały miejsce
          menu, a używa się ich rzadko — poza dzwonkiem, który ma licznik
          i dlatego zostaje na wierzchu. */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-1">
          <Link
            href="/app/settings/profile"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.05]"
          >
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-white">
                {user.name}
              </span>
              <span className="block truncate text-[11.5px] text-[var(--text-subtle)]">
                {activeRole ? ROLE_LABELS[activeRole] : "Bez teamu"}
              </span>
            </span>
          </Link>

          <Link
            href="/app/notifications"
            aria-label={
              badges?.notifications
                ? `Powiadomienia, nowe: ${badges.notifications}`
                : "Powiadomienia"
            }
            aria-current={isActivePath(pathname, "/app/notifications") ? "page" : undefined}
            className={cn(
              "relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:size-8",
              isActivePath(pathname, "/app/notifications")
                ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
                : "text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <Bell className="size-4" strokeWidth={1.75} />
            {badges?.notifications ? (
              <span className="tabular absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--vairo-strong)] px-1 text-[10px] font-semibold text-white ring-2 ring-[var(--sidebar)]">
                {badges.notifications > 9 ? "9+" : badges.notifications}
              </span>
            ) : null}
          </Link>

          <Menu label="Konto i pomoc">
            {(close) => (
              <>
                <MenuItem
                  icon={HelpCircle}
                  onClick={() => {
                    close();
                    setMobileOpen(false);
                    router.push("/app/program");
                  }}
                >
                  Jak to działa
                </MenuItem>
                <MenuItem
                  icon={GraduationCap}
                  onClick={() => {
                    close();
                    setMobileOpen(false);
                    window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
                  }}
                >
                  Samouczek
                </MenuItem>
                <MenuItem
                  icon={Settings}
                  onClick={() => {
                    close();
                    setMobileOpen(false);
                    router.push("/app/settings/profile");
                  }}
                >
                  Ustawienia
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={LogOut}
                  disabled={signingOut}
                  onClick={() => startSigningOut(() => signOut())}
                >
                  {signingOut ? "Wylogowuję…" : "Wyloguj się"}
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-full flex-1 bg-[var(--bg)] text-white">
      <AppBackdrop />
      <WelcomeTour hasTeam={hasTeam} />

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
            <MenuIcon className="size-4" />
          </button>
          <Link href="/app" className="inline-flex items-center" aria-label="Vairo — dashboard">
            <BrandLogo height={24} />
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
