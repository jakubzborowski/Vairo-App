import Link from "next/link";
import { MapPin, Sparkles, Target, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import type { ValidationCategory } from "@/types/startup";
import { industryLabel } from "@/lib/localized";
import type { PublicStartup } from "@/types/social";
import { TeamLogo } from "./team-logo";
import type { MatchReason } from "@/lib/match";
import { getLocale, getT } from "@/i18n/server";

/**
 * Karta teamu w Discover.
 *
 * Pokazuje wyłącznie to, co founder świadomie opublikował — pełny opis
 * pomysłu zostaje prywatny. Najważniejsza informacja dla joinera to otwarte
 * role, więc idą na wierzch, a nie do stopki.
 */
export async function TeamCard({
  team,
  action,
  highlight,
}: {
  team: PublicStartup;
  action?: React.ReactNode;
  /** Jedno zdanie o pokryciu ich otwartych ról z moimi umiejętnościami. */
  highlight?: MatchReason | null;
}) {
  const t = await getT("social");
  const tl = await getT("labels");
  const openRoles = team.open_roles ?? [];
  const categories = (team.categories ?? []) as ValidationCategory[];

  return (
    <article className="flex flex-col rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5 transition-colors hover:border-white/15">
      <div className="flex items-start gap-4">
        <TeamLogo src={team.logo_url} name={team.name} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/social/teams/${team.id}`}
            className="font-heading text-[17px] font-semibold text-white underline-offset-2 hover:underline"
          >
            {team.name}
          </Link>
          {team.public_tagline ? (
            <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-[var(--text-muted)]">
              {team.public_tagline}
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] italic text-[var(--text-subtle)]">
              {t("card.noDescription")}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-subtle)]">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 shrink-0" />
              {t("card.members", { count: team.member_count })}
            </span>
            {team.stage_label ? (
              <span className="inline-flex items-center gap-1">
                <Target className="size-3.5 shrink-0" />
                {team.stage_label}
              </span>
            ) : null}
            {team.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {team.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {highlight ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--vairo)]/18 bg-[var(--vairo)]/[0.06] px-3.5 py-2 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
          <Sparkles className="mt-[3px] size-3.5 shrink-0 text-[var(--vairo)]" aria-hidden="true" />
          <span>
            <span className="sr-only">Dlaczego to widzisz: </span>
            {highlight.text}
          </span>
        </p>
      ) : null}

      {openRoles.length > 0 ? (
        <div className="mt-3.5 rounded-xl border border-[var(--vairo)]/20 bg-[var(--vairo)]/6 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--vairo)]">
            <UserPlus className="size-3.5" />
            {t("card.seekingFor", { count: openRoles.length })}
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {openRoles.slice(0, 3).map((role) => (
              <li key={role.id} className="text-[13px] text-white">
                {role.title}
                {role.weekly_hours ? (
                  <span className="text-[var(--text-subtle)]">
                    {" "}
                    · {t("card.hoursShort", { hours: role.weekly_hours })}
                  </span>
                ) : null}
              </li>
            ))}
            {openRoles.length > 3 ? (
              <li className="text-[12px] text-[var(--text-subtle)]">
                {t("card.andMore", { count: openRoles.length - 3 })}
              </li>
            ) : null}
          </ul>
        </div>
      ) : (
        <div className="mt-3.5">
          <Badge>{t("card.notHiring")}</Badge>
        </div>
      )}

      {categories.length > 0 || (team.tags ?? []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Pill key={category}>{tl.maybe(`category.${category}`, category)}</Pill>
          ))}
          {(team.tags ?? []).slice(0, 3).map((tag) => (
            <Pill key={tag.id}>{industryLabel(tl, tag)}</Pill>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link
          href={`/app/social/teams/${team.id}`}
          className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:border-white/22 hover:text-white"
        >
          {t("card.viewTeam")}
        </Link>
        {action}
      </div>
    </article>
  );
}
