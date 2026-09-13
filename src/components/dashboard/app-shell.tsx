"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
  UserRound,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/app/actions";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
  { label: "Profil", icon: UserRound, href: "/app/profile" },
  { label: "Projekty", icon: FolderKanban, href: "/app" },
  { label: "Taski", icon: ListChecks, href: "/app" },
  { label: "Zespół", icon: Users, href: "/app/profile" },
  { label: "Możliwości", icon: Sparkles, href: "/app" },
  { label: "Wiadomości", icon: MessageSquare, href: "/app" },
  { label: "Analityka", icon: BarChart3, href: "/app" },
  { label: "Ustawienia", icon: Settings, href: "/app" },
];

type AppShellProps = {
  email: string;
  displayName: string;
  children: React.ReactNode;
};

export function AppShell({ email, displayName, children }: AppShellProps) {
  const pathname = usePathname();
  const initial = displayName.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="flex min-h-full flex-1 bg-[#07080b] text-white">
      <aside className="sticky top-0 hidden h-svh w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0c0f] px-3 py-5 md:flex">
        <Link href="/app" className="mb-8 inline-flex items-center gap-2 px-2">
          <Image
            src="/brand/logo-blob.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="font-heading text-[1.2rem] font-bold tracking-tight lowercase">
            vairo
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map(({ label, icon: Icon, href }) => {
            const active =
              href === "/app"
                ? pathname === "/app"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                  active
                    ? "bg-vairo/15 text-vairo"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <Link
            href="/app/profile"
            className="mb-3 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03]"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9a870] to-[#e8551a] text-[12px] font-semibold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-white/40">{email}</p>
            </div>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/80"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              Wyloguj się
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0b0c0f]/80 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="inline-flex items-center gap-2">
            <Image
              src="/brand/logo-blob.png"
              alt=""
              width={26}
              height={26}
              className="size-[26px] object-contain"
            />
            <span className="font-heading text-[1.1rem] font-bold lowercase">
              vairo
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/app/profile"
              className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] text-white/70"
            >
              Profil
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] text-white/70"
              >
                Wyloguj
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
