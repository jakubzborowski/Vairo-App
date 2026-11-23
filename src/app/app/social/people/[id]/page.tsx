import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, MapPin, UserRound, Users } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getPublicProfile } from "@/lib/social";
import { getUserStartups } from "@/lib/startup";
import { loadConversationPartners } from "@/lib/messages";
import { InviteButton } from "@/components/social/invite-button";
import { MessageButton } from "@/components/social/message-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { MAX_STARTUPS, canManageTeam } from "@/types/startup";
import { getLocale, getT } from "@/i18n/server";
import { LOCALE_TAGS } from "@/i18n/config";
import { skillLabel } from "@/lib/localized";

export const dynamic = "force-dynamic";

/**
 * Tytuł karty przeglądarki.
 *
 * Bez tego wszystkie strony dynamiczne dziedziczyły tytuł z layoutu głównego,
 * czyli „Vairo — Zbuduj swój startup od podstaw". Przy kilku otwartych
 * zakładkach z różnymi profilami nie dało się ich odróżnić, a wysłany komuś
 * link zapowiadał landing page zamiast konkretnej osoby.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getPublicProfile(supabase, id);
  const t = await getT("social");
  return { title: profile?.full_name ? `${profile.full_name} — Vairo` : t("person.metaTitle") };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT("social");
  const tl = await getT("labels");
  const locale = await getLocale();
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect(`/register?next=/app/social/people/${id}`);
  if (id === user.id) redirect("/app/social/me");

  const person = await getPublicProfile(supabase, id);
  if (!person) notFound();

  const [startups, conversationByProfile] = await Promise.all([
    getUserStartups(supabase, user.id),
    loadConversationPartners(supabase, user.id),
  ]);

  // Zapraszać można tylko tam, gdzie się zarządza i gdzie tej osoby jeszcze
  // nie ma — inaczej trigger w bazie i tak odrzuciłby zaproszenie.
  const { data: memberships } = await supabase
    .from("startup_members")
    .select("startup_id")
    .eq("profile_id", id);

  const alreadyIn = new Set(
    (memberships ?? []).map((row) => row.startup_id as string)
  );

  const { data: pending } = await supabase
    .from("startup_join_requests")
    .select("startup_id")
    .eq("profile_id", id)
    .eq("status", "pending");

  const pendingIn = new Set((pending ?? []).map((row) => row.startup_id as string));

  const invitable = startups
    .filter(
      (startup) =>
        canManageTeam(startup.role) &&
        !alreadyIn.has(startup.id) &&
        !pendingIn.has(startup.id)
    )
    .map((startup) => ({ id: startup.id, name: startup.name }));

  const sharedTeams = startups.filter((startup) => alreadyIn.has(startup.id));
  const atLimit = person.team_count >= MAX_STARTUPS;
  const skills = person.skills ?? [];

  return (
    <div className="page">
      <Link
        href="/app/social/people"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        {t("person.back")}
      </Link>

      <Card>
        <CardBody className="pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar
              src={person.avatar_url}
              name={person.full_name}
              size="xl"
              className="size-28 rounded-2xl text-[34px] sm:size-32"
            />

            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-[1.5rem] font-semibold tracking-tight text-white">
                {person.full_name ?? t("card.noName")}
              </h1>
              {person.headline ? (
                <p className="mt-1 text-[14.5px] text-[var(--text-muted)]">
                  {person.headline}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--text-subtle)]">
                {person.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" />
                    {person.location}
                  </span>
                ) : null}
                {person.weekly_hours ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 shrink-0" />
                    {t("person.hoursPerWeek", { hours: person.weekly_hours })}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 shrink-0" />
                  {person.team_count === 0
                    ? t("person.noTeam")
                    : t("card.teamCount", { count: person.team_count, max: MAX_STARTUPS })}
                </span>
              </div>

              {person.looking_for ? (
                <div className="mt-3">
                  <Badge
                    tone={person.looking_for === "not_looking" ? "neutral" : "brand"}
                  >
                    {t(`lookingFor.${person.looking_for}`)}
                  </Badge>
                </div>
              ) : null}
            </div>
          </div>

          {/* „Napisz" jest dostępne dla każdego — bez tego osoba bez teamu
              mogła tu wyłącznie czytać. Zaproszenie to osobna możliwość
              Foundera i Admina. */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <MessageButton
              recipientId={person.id}
              recipientName={person.full_name?.trim().split(/\s+/)[0] ?? t("person.thisPersonGen")}
              contexts={startups.map((startup) => ({
                id: startup.id,
                name: startup.name,
              }))}
              existingConversationId={conversationByProfile[person.id] ?? null}
            />

            {invitable.length > 0 ? (
              <InviteButton
                profileId={person.id}
                profileName={person.full_name ?? t("person.thisPersonAcc")}
                teams={invitable}
              />
            ) : null}
          </div>

          <p className="mt-3 text-[12.5px] text-[var(--text-subtle)]">
            {sharedTeams.length > 0
              ? t("person.sharedTeams", { list: sharedTeams.map((team) => team.name).join(", ") })
              : atLimit
                ? t("person.atLimit", { max: MAX_STARTUPS })
                : pendingIn.size > 0 && invitable.length === 0
                  ? t("person.invitePending")
                  : invitable.length === 0
                    ? t("person.onlyManagersInvite")
                    : ""}
          </p>
        </CardBody>
      </Card>

      {person.weekly_focus ? (
        <Card className="mt-4">
          <CardBody className="pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
              {t("person.focus")}
            </p>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
              {person.weekly_focus}
            </p>
            {person.weekly_focus_updated_at ? (
              <p className="mt-3 text-[12px] text-[var(--text-subtle)]">
                {t("person.updated", {
                  date: new Date(person.weekly_focus_updated_at).toLocaleDateString(LOCALE_TAGS[locale], {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            {t("person.skills")}
          </p>
          {skills.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Pill key={skill.id}>{skillLabel(tl, skill)}</Pill>
              ))}
            </div>
          ) : (
            <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
              <UserRound className="size-4" />
              {t("person.noSkills")}
            </p>
          )}
        </CardBody>
      </Card>

      <p className="mt-4 text-[12px] text-[var(--text-subtle)]">
        {t("person.privacyNote")}
      </p>
    </div>
  );
}
