import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Compass,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Square,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { discoverPeople, discoverTeams, loadPassedIds } from "@/lib/social";
import { loadConversationPartners } from "@/lib/messages";
import { scoreProfile } from "@/lib/profile-completeness";
import { ProfileNudge } from "@/components/social/profile-nudge";
import { ApplyButton } from "@/components/social/apply-button";
import { InviteButton } from "@/components/social/invite-button";
import { PeopleDeck } from "@/components/social/people-deck";
import { PersonCard } from "@/components/social/person-card";
import { TeamCard } from "@/components/social/team-card";
import { TeamsDeck } from "@/components/social/teams-deck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LOOKING_FOR_OPTIONS } from "@/types/social";
import {
  MAX_STARTUPS,
  SELECTABLE_CATEGORIES,
  canManageTeam,
} from "@/types/startup";

export const metadata = { title: "Odkrywaj — Vairo" };
export const dynamic = "force-dynamic";

type Params = {
  tab?: string;
  view?: string;
  q?: string;
  skill?: string;
  looking?: string;
  room?: string;
  category?: string;
  hiring?: string;
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const tab = params.tab === "people" ? "people" : "teams";
  // Talia jest trybem domyślnym: przy decyzji „czy chcę z kimś pracować"
  // jedna duża karta działa lepiej niż siatka trzydziestu miniatur.
  const view = params.view === "list" ? "list" : "deck";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/discover");

  const [startups, passed, conversationByProfile] = await Promise.all([
    getUserStartups(supabase, user.id),
    loadPassedIds(supabase, user.id),
    loadConversationPartners(supabase, user.id),
  ]);

  const myStartupIds = startups.map((s) => s.id);
  const invitableTeams = startups
    .filter((s) => canManageTeam(s.role))
    .map((s) => ({ id: s.id, name: s.name }));
  const atTeamLimit = startups.length >= MAX_STARTUPS;
  // W imieniu teamu może pisać każdy jego członek, nie tylko zarządzający.
  const contactContexts = startups.map((s) => ({ id: s.id, name: s.name }));

  // Otwarte rozmowy znikają z talii: karta z napisem „już wysłane" zamiast
  // akcji to tylko przeszkoda na drodze do następnej osoby.
  const { data: pendingRows } = await supabase
    .from("startup_join_requests")
    .select("startup_id, profile_id")
    .eq("status", "pending");

  const myPendingTeams = new Set(
    (pendingRows ?? [])
      .filter((row) => row.profile_id === user.id)
      .map((row) => row.startup_id as string)
  );
  const pendingInvitees = new Set(
    (pendingRows ?? [])
      .filter((row) => myStartupIds.includes(row.startup_id as string))
      .map((row) => row.profile_id as string)
  );

  const { data: skillRows } = await supabase
    .from("skills")
    .select("slug, label")
    .order("label", { ascending: true })
    .limit(200);

  // Karta jest tak dobra, jak profil za nią — a bez tego paska człowiek nie ma
  // jak się dowiedzieć, że sam wygląda w Odkrywaj jak pusty prostokąt.
  type MyProfile = {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    weekly_focus: string | null;
    looking_for: string | null;
  };

  const [{ data: myProfileRow }, { count: mySkillCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, headline, weekly_focus, looking_for")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id", { count: "exact", head: true })
      .eq("profile_id", user.id),
  ]);

  const myProfile = myProfileRow as unknown as MyProfile | null;
  const completeness = scoreProfile({
    full_name: myProfile?.full_name,
    avatar_url: myProfile?.avatar_url,
    headline: myProfile?.headline,
    weekly_focus: myProfile?.weekly_focus,
    looking_for: myProfile?.looking_for,
    skillCount: mySkillCount ?? 0,
  });

  const resetHref = `/app/social/discover?tab=${tab}&view=${view}`;

  return (
    <div className={cn("mx-auto w-full", view === "deck" ? "max-w-5xl" : "max-w-6xl")}>
      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Odkrywaj
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
          {tab === "people"
            ? "Jedna osoba na ekran. Pasuje — napisz. Nie pasuje — pomiń i już nie wróci."
            : "Jeden projekt na ekran. Zobacz, kogo szukają, i zgłoś się albo idź dalej."}
        </p>
      </header>

      <ProfileNudge
        score={completeness.score}
        missing={completeness.missing}
        className="mt-5"
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="inline-flex rounded-xl border border-white/10 bg-[var(--surface)] p-1">
          <TabLink
            href={`/app/social/discover?tab=teams&view=${view}`}
            active={tab === "teams"}
          >
            <Compass className="size-4" />
            Teamy
          </TabLink>
          <TabLink
            href={`/app/social/discover?tab=people&view=${view}`}
            active={tab === "people"}
          >
            <Users className="size-4" />
            Ludzie
          </TabLink>
        </nav>

        {/* Siatka zostaje dla tych, którzy wolą przejrzeć wszystko naraz. */}
        <nav className="inline-flex rounded-xl border border-white/10 bg-[var(--surface)] p-1">
          <TabLink
            href={`/app/social/discover?tab=${tab}&view=deck`}
            active={view === "deck"}
          >
            <Square className="size-4" />
            Pojedynczo
          </TabLink>
          <TabLink
            href={`/app/social/discover?tab=${tab}&view=list`}
            active={view === "list"}
          >
            <LayoutGrid className="size-4" />
            Lista
          </TabLink>
        </nav>
      </div>

      {/* Filtry zwinięte w <details>: w trybie talii mają nie odciągać uwagi
          od karty, ale muszą być pod ręką. Zwykły formularz GET, więc wynik
          da się odświeżyć, cofnąć i wysłać linkiem. */}
      <details
        open={hasActiveFilter(params) || view === "list"}
        className="group mt-4 rounded-2xl border border-white/[0.07] bg-[var(--surface)]"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-white">
          <SlidersHorizontal className="size-4" />
          Filtry
          {hasActiveFilter(params) ? (
            <span className="rounded-md bg-[var(--vairo)]/15 px-2 py-0.5 text-[11.5px] text-[var(--vairo)]">
              aktywne
            </span>
          ) : null}
        </summary>

        <form
          action="/app/social/discover"
          method="get"
          className="flex flex-wrap items-end gap-2.5 border-t border-white/[0.06] p-4"
        >
          <input type="hidden" name="tab" value={tab} />
          <input type="hidden" name="view" value={view} />

          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-muted)]">
              Szukaj
            </span>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder={
                tab === "people"
                  ? "Imię, rola, nad czym pracuje…"
                  : "Nazwa teamu albo czym się zajmuje…"
              }
            />
          </label>

          {tab === "people" ? (
            <>
              <Select
                name="skill"
                label="Umiejętność"
                defaultValue={params.skill ?? ""}
                options={(skillRows ?? []).map((row) => ({
                  value: row.slug as string,
                  label: row.label as string,
                }))}
              />
              <Select
                name="looking"
                label="Czego szuka"
                defaultValue={params.looking ?? ""}
                options={LOOKING_FOR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <Checkbox
                name="room"
                label="Ma miejsce na team"
                checked={params.room === "1"}
              />
            </>
          ) : (
            <>
              <Select
                name="category"
                label="Kategoria"
                defaultValue={params.category ?? ""}
                options={SELECTABLE_CATEGORIES.map((category) => ({
                  value: category.key,
                  label: category.label,
                }))}
              />
              <Checkbox
                name="hiring"
                label="Tylko szukające ludzi"
                checked={params.hiring === "1"}
              />
            </>
          )}

          <Button type="submit" variant="secondary">
            <Search className="size-4" />
            Filtruj
          </Button>
        </form>
      </details>

      <div className="mt-5">
        {tab === "people" ? (
          <PeopleResults
            supabase={supabase}
            userId={user.id}
            params={params}
            view={view}
            invitableTeams={invitableTeams}
            contactContexts={contactContexts}
            conversationByProfile={conversationByProfile}
            pendingInvitees={pendingInvitees}
            passedIds={passed.people}
            resetHref={resetHref}
          />
        ) : (
          <TeamResults
            supabase={supabase}
            params={params}
            view={view}
            myStartupIds={myStartupIds}
            myPendingTeams={myPendingTeams}
            passedIds={passed.teams}
            atTeamLimit={atTeamLimit}
            resetHref={resetHref}
          />
        )}
      </div>
    </div>
  );
}

async function PeopleResults({
  supabase,
  userId,
  params,
  view,
  invitableTeams,
  contactContexts,
  conversationByProfile,
  pendingInvitees,
  passedIds,
  resetHref,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  params: Params;
  view: "deck" | "list";
  invitableTeams: { id: string; name: string }[];
  contactContexts: { id: string; name: string }[];
  conversationByProfile: Record<string, string>;
  pendingInvitees: Set<string>;
  passedIds: string[];
  resetHref: string;
}) {
  const filters = {
    q: params.q,
    skillSlug: params.skill,
    lookingFor: params.looking,
    withRoom: params.room === "1",
  };

  // W talii pomijamy siebie, pominiętych i osoby, z którymi rozmowa już trwa.
  // W liście zostają — tam chodzi o przegląd, nie o decyzję.
  const exclude =
    view === "deck"
      ? [userId, ...passedIds, ...pendingInvitees]
      : [userId, ...passedIds];

  const { people, error } = await discoverPeople(supabase, filters, [
    ...new Set(exclude),
  ]);

  if (error) return <ErrorNote message={error} />;

  if (view === "deck") {
    return (
      <PeopleDeck
        people={people}
        invitableTeams={invitableTeams}
        contactContexts={contactContexts}
        conversationByProfile={conversationByProfile}
        passedCount={passedIds.length}
        resetHref={resetHref}
      />
    );
  }

  if (people.length === 0) {
    return (
      <EmptyNote
        title="Nikt nie pasuje do tych filtrów"
        description="Widoczni są tylko ci, którzy ukończyli rejestrację i zostawili siebie w wyszukiwarce."
        resetHref={resetHref}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          action={
            pendingInvitees.has(person.id) ? (
              <span className="text-[12px] text-[var(--text-faint)]">
                Zaproszenie wysłane
              </span>
            ) : (
              <InviteButton
                profileId={person.id}
                profileName={person.full_name ?? "tę osobę"}
                teams={invitableTeams}
                size="sm"
              />
            )
          }
        />
      ))}
    </div>
  );
}

async function TeamResults({
  supabase,
  params,
  view,
  myStartupIds,
  myPendingTeams,
  passedIds,
  atTeamLimit,
  resetHref,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  params: Params;
  view: "deck" | "list";
  myStartupIds: string[];
  myPendingTeams: Set<string>;
  passedIds: string[];
  atTeamLimit: boolean;
  resetHref: string;
}) {
  const filters = {
    q: params.q,
    category: params.category,
    hiringOnly: params.hiring === "1",
  };

  const exclude =
    view === "deck"
      ? [...myStartupIds, ...passedIds, ...myPendingTeams]
      : [...myStartupIds, ...passedIds];

  const { teams, error } = await discoverTeams(supabase, filters, [
    ...new Set(exclude),
  ]);

  if (error) return <ErrorNote message={error} />;

  if (view === "deck") {
    return (
      <TeamsDeck
        teams={teams}
        passedCount={passedIds.length}
        atTeamLimit={atTeamLimit}
        resetHref={resetHref}
      />
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyNote
        title="Żaden team nie pasuje do tych filtrów"
        description="Widoczne są tylko aktywne startupy, które włączyły profil publiczny."
        resetHref={resetHref}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          action={
            <ApplyButton
              startupId={team.id}
              startupName={team.name}
              openRoles={team.open_roles ?? []}
              size="sm"
              blockedReason={
                myPendingTeams.has(team.id)
                  ? "Zgłoszenie wysłane"
                  : atTeamLimit
                    ? `Masz już ${MAX_STARTUPS} teamy`
                    : null
              }
            />
          }
        />
      ))}
    </div>
  );
}

function hasActiveFilter(params: Params) {
  return Boolean(
    params.q || params.skill || params.looking || params.category ||
      params.room === "1" || params.hiring === "1"
  );
}

function EmptyNote({
  title,
  description,
  resetHref,
}: {
  title: string;
  description: string;
  resetHref: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      <p className="font-heading text-[17px] font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--text-subtle)]">
        {description}
      </p>
      <div className="mt-5 flex justify-center">
        <Button href={resetHref} variant="secondary">
          Wyczyść filtry
        </Button>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
      {message}
    </p>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
          : "text-[var(--text-subtle)] hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[160px]">
      <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-muted)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-white/10 bg-[var(--surface-2)] px-3 text-[14px] text-white outline-none transition-colors hover:border-white/16 focus:border-[var(--vairo)]/70"
      >
        <option value="">Wszystkie</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[var(--surface-2)] px-3.5 text-[13.5px] text-[var(--text-muted)] transition-colors hover:border-white/16">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={checked}
        className="size-4 accent-[var(--vairo)]"
      />
      {label}
    </label>
  );
}
