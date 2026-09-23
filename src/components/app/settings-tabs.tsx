import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Dwa ekrany ustawien, jedna pozycja w nawigacji.
 *
 * Bez tego paska „Ustawienia konta" bylyby dostepne tylko przez wpisanie
 * adresu — czyli praktycznie nie istnialyby. Trzecia pozycja w sidebarze byla
 * gorszym rozwiazaniem: to jeden temat, nie dwa.
 */
const TABS = [
  { href: "/app/settings/profile", label: "Profil" },
  { href: "/app/settings/account", label: "Konto" },
];

export function SettingsTabs({ active }: { active: "profile" | "account" }) {
  return (
    <nav className="mb-6 inline-flex rounded-xl border border-white/10 bg-[var(--surface)] p-1">
      {TABS.map((tab) => {
        const isActive = tab.href.endsWith(active);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-4 text-[13.5px] font-medium transition-colors",
              isActive
                ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
                : "text-[var(--text-subtle)] hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
