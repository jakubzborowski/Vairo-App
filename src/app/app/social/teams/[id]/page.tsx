import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicStartup } from "@/lib/social";
import { getUserStartups } from "@/lib/startup";
import { ApplyButton } from "@/components/social/apply-button";
import { TeamLogo } from "@/components/social/team-logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  CATEGORY_LABELS,
  MAX_STARTUPS,
  type ValidationCategory,
} from "@/types/startup";

export const dynamic = "force-dynamic";

/**
 * Publiczna strona teamu — jedyne miejsce, w którym startup sprzedaje się
 * obcym. Kolejność sekcji jest kolejnością pytań, jakie zadaje sobie joiner:
 * czym to jest → kogo szukają → co już zrobili → kto tam jest.
 */
export default async function PublicTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/register?next=/app/social/teams/${id}`);

  const team = await getPublicStartup(supabase, id);
  if (!team) notFound();

  const startups = await getUserStartups(supabase, user.id);
  const isMember = startups.some((startup) => startup.id === id);

  const { data: pending } = await supabase
    .from("startup_join_requests")
    .select("id")
    .eq("startup_id", id)
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const openRoles = team.open_roles ?? [];
  const categories = (team.categories ?? []) as ValidationCategory[];
  const members = team.members ?? [];
  const hiddenMembers = Math.max(0, team.member_count - members.length);

  const blockedReason = isMember
    ? "Jesteś w tym teamie"
    : pending
      ? "Zgłoszenie wysłane"
      : startups.length >= MAX_STARTUPS
        ? `Masz już ${MAX_STARTUPS} teamy`
        : null;

  const cta = isMember ? (
    <Button href="/app/team" variant="secondary" size="lg">
      <Users className="size-4" />
      Otwórz swój team
    </Button>
  ) : (
    <ApplyButton
      startupId={team.id}
      startupName={team.name}
      openRoles={openRoles}
      size="lg"
      blockedReason={blockedReason}
    />
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/app/social/discover?tab=teams"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć do Odkrywaj
      </Link>

      {/* Nagłówek z pasem gradientu: strona teamu ma wyglądać jak wizytówka
          projektu, nie jak wiersz tabeli. */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[var(--surface)]">
        <div className="h-28 bg-gradient-to-br from-[#f9a870]/35 via-[#e8551a]/20 to-transparent sm:h-32" />

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <TeamLogo
              src={team.logo_url}
              name={team.name}
              size="lg"
              className="size-24 rounded-2xl text-[32px] ring-4 ring-[var(--surface)]"
            />
            {openRoles.length > 0 ? (
              <Badge tone="brand" className="mb-2">
                <UserPlus className="size-3" />
                Rekrutują
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-4 font-heading text-[1.6rem] font-semibold tracking-tight text-white">
            {team.name}
          </h1>
          {team.public_tagline ? (
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--text-muted)]">
              {team.public_tagline}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--text-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 shrink-0" />
              {team.member_count} {team.member_count === 1 ? "osoba" : "osób"}
              {" w zespole"}
            </span>
            {team.stage_label ? (
              <span className="inline-flex items-center gap-1.5">
                <Target className="size-4 shrink-0" />
                {team.stage_label}
              </span>
            ) : null}
            {team.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" />
                {team.location}
              </span>
            ) : null}
            {team.website_url ? (
              <a
                href={team.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--vairo)] underline-offset-2 hover:underline"
              >
                <ExternalLink className="size-4 shrink-0" />
                Strona projektu
              </a>
            ) : null}
          </div>

          {categories.length > 0 || (team.tags ?? []).length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <Pill key={category}>{CATEGORY_LABELS[category] ?? category}</Pill>
              ))}
              {(team.tags ?? []).map((tag) => (
                <Pill key={tag.id}>{tag.label}</Pill>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">{cta}</div>
        </div>
      </div>

      {/* Kogo szukają — pierwsza sekcja, bo to jedyna informacja, która
          decyduje, czy joiner w ogóle czyta dalej. */}
      <Card className="mt-4 border-[var(--vairo)]/25">
        <CardBody className="pt-5">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
            <UserPlus className="size-3.5" />
            Kogo szukają
          </p>

          {openRoles.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2.5">
              {openRoles.map((role) => (
                <li
                  key={role.id}
                  className="rounded-xl border border-white/[0.07] bg-[var(--surface-2)] px-4 py-3.5"
                >
                  <p className="text-[15px] font-medium text-white">
                    {role.title}
                    {role.weekly_hours ? (
                      <span className="ml-2 text-[12.5px] font-normal text-[var(--text-subtle)]">
                        około {role.weekly_hours} h tygodniowo
                      </span>
                    ) : null}
                  </p>
                  {role.description ? (
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                      {role.description}
                    </p>
                  ) : null}
                  {(role.skills ?? []).length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {(role.skills ?? []).map((skill) => (
                        <Pill key={skill}>{skill}</Pill>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
              Ten team nie ma teraz otwartych ról. Zgłoszenie i tak trafi do osób,
              które nim zarządzają — czasem to wystarczy.
            </p>
          )}
        </CardBody>
      </Card>

      {team.public_description ? (
        <Card className="mt-4">
          <CardBody className="pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              O projekcie
            </p>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-[var(--text-muted)]">
              {team.public_description}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Kto już jest w zespole
          </p>

          {members.length > 0 ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5"
                >
                  <Avatar src={member.avatar_url} name={member.full_name} size="md" />
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/app/social/people/${member.id}`}
                      className="block truncate text-[13.5px] font-medium text-white underline-offset-2 hover:underline"
                    >
                      {member.full_name ?? "Bez imienia"}
                    </Link>
                    {member.job_title ? (
                      <span className="block truncate text-[12px] text-[var(--text-subtle)]">
                        {member.job_title}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Osoby, które wyłączyły widoczność, liczą się do składu, ale nie
              pojawiają się z imienia — także na cudzej stronie teamu. */}
          {hiddenMembers > 0 ? (
            <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
              {members.length > 0 ? "oraz " : ""}
              {hiddenMembers}{" "}
              {hiddenMembers === 1 ? "osoba, która nie" : "osób, które nie"}{" "}
              {hiddenMembers === 1 ? "pokazuje" : "pokazują"} się w wyszukiwarce.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {!isMember ? (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
          <p className="text-[14px] font-medium text-white">
            Pasuje Ci ten projekt?
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
            Zgłoszenie to jedna wiadomość. Nic nie tracisz, jeśli odpowiedzą „nie”.
          </p>
          <div className="mt-4">{cta}</div>
        </div>
      ) : null}
    </div>
  );
}
