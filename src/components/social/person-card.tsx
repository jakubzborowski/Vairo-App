import Link from "next/link";
import { Clock, MapPin, Sparkles, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import type { MatchReason } from "@/lib/match";
import { MAX_STARTUPS } from "@/types/startup";
import { LOOKING_FOR_LABELS, type PublicProfile } from "@/types/social";

const MAX_VISIBLE_SKILLS = 5;

/**
 * Karta osoby w Discover.
 *
 * Zdjęcie jest duże, bo w warstwie Social to pierwsza rzecz, po której ludzie
 * decydują, czy kliknąć. Pod nim idzie to, co naprawdę pomaga dobrać się
 * w zespół: czego szuka, ile ma czasu i co potrafi — a nie sucha lista pól.
 */
export function PersonCard({
  person,
  action,
  highlight,
}: {
  person: PublicProfile;
  action?: React.ReactNode;
  /** Jedno zdanie o pokryciu z moimi rolami albo umiejętnościami. */
  highlight?: MatchReason | null;
}) {
  const full = person.team_count >= MAX_STARTUPS;
  const skills = person.skills ?? [];

  return (
    <article className="flex flex-col rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5 transition-colors hover:border-white/15">
      <div className="flex items-start gap-4">
        <Avatar src={person.avatar_url} name={person.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/social/people/${person.id}`}
            className="font-heading text-[17px] font-semibold text-white underline-offset-2 hover:underline"
          >
            {person.full_name ?? "Bez imienia"}
          </Link>
          {person.headline ? (
            <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-[var(--text-muted)]">
              {person.headline}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-subtle)]">
            {person.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {person.location}
              </span>
            ) : null}
            {person.weekly_hours ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {person.weekly_hours} h/tydz.
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 shrink-0" />
              {person.team_count === 0
                ? "Bez teamu"
                : `${person.team_count} z ${MAX_STARTUPS} teamów`}
            </span>
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

      {person.looking_for ? (
        <div className="mt-3">
          <Badge tone={person.looking_for === "not_looking" ? "neutral" : "brand"}>
            {LOOKING_FOR_LABELS[person.looking_for]}
          </Badge>
        </div>
      ) : null}

      {person.weekly_focus ? (
        <p className="mt-3 line-clamp-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
          {person.weekly_focus}
        </p>
      ) : null}

      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, MAX_VISIBLE_SKILLS).map((skill) => (
            <Pill key={skill.id}>{skill.label}</Pill>
          ))}
          {skills.length > MAX_VISIBLE_SKILLS ? (
            <span className="inline-flex h-8 items-center text-[12.5px] text-[var(--text-faint)]">
              +{skills.length - MAX_VISIBLE_SKILLS}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link
          href={`/app/social/people/${person.id}`}
          className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3.5 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:border-white/22 hover:text-white"
        >
          Zobacz profil
        </Link>
        {/* Limit 3 teamów pokazujemy zawczasu, żeby nikt nie wysyłał
            zaproszenia, które baza i tak odrzuci. */}
        {full ? (
          <span className="text-[12px] text-[var(--text-faint)]">
            Komplet teamów
          </span>
        ) : (
          action
        )}
      </div>
    </article>
  );
}
