import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, MapPin, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfile } from "@/lib/social";
import { getUserStartups } from "@/lib/startup";
import { loadConversationPartners } from "@/lib/messages";
import { InviteButton } from "@/components/social/invite-button";
import { MessageButton } from "@/components/social/message-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LOOKING_FOR_LABELS } from "@/types/social";
import { MAX_STARTUPS, canManageTeam } from "@/types/startup";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/app/social/discover?tab=people"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć do Odkrywaj
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
                {person.full_name ?? "Bez imienia"}
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
                    {person.weekly_hours} h tygodniowo
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 shrink-0" />
                  {person.team_count === 0
                    ? "Nie należy do żadnego teamu"
                    : `W ${person.team_count} z ${MAX_STARTUPS} teamów`}
                </span>
              </div>

              {person.looking_for ? (
                <div className="mt-3">
                  <Badge
                    tone={person.looking_for === "not_looking" ? "neutral" : "brand"}
                  >
                    {LOOKING_FOR_LABELS[person.looking_for]}
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
              recipientName={person.full_name?.trim().split(/\s+/)[0] ?? "tej osoby"}
              contexts={startups.map((startup) => ({
                id: startup.id,
                name: startup.name,
              }))}
              existingConversationId={conversationByProfile[person.id] ?? null}
            />

            {invitable.length > 0 ? (
              <InviteButton
                profileId={person.id}
                profileName={person.full_name ?? "tę osobę"}
                teams={invitable}
              />
            ) : null}
          </div>

          <p className="mt-3 text-[12.5px] text-[var(--text-subtle)]">
            {sharedTeams.length > 0
              ? `Jesteście razem w: ${sharedTeams.map((t) => t.name).join(", ")}.`
              : atLimit
                ? `Ta osoba jest już w ${MAX_STARTUPS} teamach — to maksimum na konto, więc zaproszenie nie przejdzie.`
                : pendingIn.size > 0 && invitable.length === 0
                  ? "Zaproszenie do tej osoby już czeka na odpowiedź — sprawdź Zaproszenia."
                  : invitable.length === 0
                    ? "Do teamu zapraszają Founder i Admin. Napisać możesz zawsze."
                    : ""}
          </p>
        </CardBody>
      </Card>

      {person.weekly_focus ? (
        <Card className="mt-4">
          <CardBody className="pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Nad czym teraz pracuje
            </p>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
              {person.weekly_focus}
            </p>
            {person.weekly_focus_updated_at ? (
              <p className="mt-3 text-[12px] text-[var(--text-faint)]">
                Zaktualizowane{" "}
                {new Date(person.weekly_focus_updated_at).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Umiejętności
          </p>
          {skills.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Pill key={skill.id}>{skill.label}</Pill>
              ))}
            </div>
          ) : (
            <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-[var(--text-faint)]">
              <UserRound className="size-4" />
              Ta osoba nie dodała jeszcze umiejętności.
            </p>
          )}
        </CardBody>
      </Card>

      <p className="mt-4 text-[12px] text-[var(--text-faint)]">
        Widzisz tylko to, co ta osoba świadomie udostępniła. Adres e-mail
        pojawia się dopiero wtedy, gdy jesteście w jednym teamie.
      </p>
    </div>
  );
}
