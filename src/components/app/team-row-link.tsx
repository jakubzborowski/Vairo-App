"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { switchTeam } from "@/app/app/actions";
import { TeamLogo } from "@/components/social/team-logo";

/**
 * Wiersz teamu w Ustawieniach. Kliknięcie przełącza aktywny team i otwiera
 * jego skład — sam link do /app/team pokazałby aktywny team, nie ten.
 */
export function TeamRowLink({
  id,
  name,
  logoUrl,
  detail,
}: {
  id: string;
  name: string;
  logoUrl: string | null;
  detail: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await switchTeam(id);
          router.push("/app/team");
          router.refresh();
        })
      }
      className="flex min-h-16 w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-70"
    >
      <TeamLogo src={logoUrl} name={name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-white">{name}</span>
        <span className="mt-0.5 block truncate text-[13px] text-[var(--text-muted)]">{detail}</span>
      </span>
      {pending ? (
        <Loader2 className="size-4 animate-spin text-[var(--text-muted)]" />
      ) : (
        <ChevronRight className="size-4 text-[var(--text-muted)]" />
      )}
    </button>
  );
}
