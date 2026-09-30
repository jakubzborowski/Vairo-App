import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getOpenRoles } from "@/lib/social";
import { loadStageProgram } from "@/lib/stage";
import { TeamProfileEditor } from "@/components/team/team-profile-editor";
import { ProfileNudge } from "@/components/social/profile-nudge";
import { scoreTeamProfile } from "@/lib/profile-completeness";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { canManageTeam, canTransferOwnership, type StartupStatus } from "@/types/startup";

export const metadata = { title: "Profil publiczny teamu — Vairo" };
export const dynamic = "force-dynamic";

export default async function TeamProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/team/profile");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);

  if (!active) redirect("/app/team");

  if (!canManageTeam(active.role)) {
    return (
      <div className="page">
        <EmptyState
          icon={Eye}
          title="Profil publiczny edytują Founder i Admin"
          description="Możesz go obejrzeć tak, jak widzą go osoby z zewnątrz."
          action={
            <>
              <Button href={`/app/social/teams/${active.id}`} variant="secondary">
                Zobacz profil publiczny
              </Button>
              <Button href="/app/team" variant="ghost">
                Wróć do teamu
              </Button>
            </>
          }
        />
      </div>
    );
  }

  type Row = {
    name: string;
    logo_url: string | null;
    public_tagline: string | null;
    public_description: string | null;
    location: string | null;
    website_url: string | null;
    is_discoverable: boolean;
    show_stage_publicly: boolean;
    status: StartupStatus;
  };

  // `show_stage_publicly` przychodzi z migracją 016. Dopóki ktoś jej nie
  // odpali, `select` z tą nazwą kończy się błędem — a błąd oznacza tu puste
  // `row`, czyli Founder zamiast edytora dostaje ciche przekierowanie i nie ma
  // jak się domyślić, dlaczego. Dlatego pytamy najpierw z kolumną, a przy
  // niepowodzeniu ponawiamy bez niej i przyjmujemy wartość domyślną.
  const BASE_COLUMNS =
    "name, logo_url, public_tagline, public_description, location, " +
    "website_url, is_discoverable, status";

  const withFlag = await supabase
    .from("startups")
    .select(`${BASE_COLUMNS}, show_stage_publicly`)
    .eq("id", active.id)
    .maybeSingle();

  let startup = withFlag.data as unknown as Row | null;

  // Czy w bazie w ogóle jest o co pytać. Jeśli nie, przełącznik etapu się nie
  // pokaże — kontrolka, która nic nie zapisuje, jest gorsza niż jej brak.
  const stageConsentAvailable = startup !== null;

  if (!startup) {
    const legacy = await supabase
      .from("startups")
      .select(BASE_COLUMNS)
      .eq("id", active.id)
      .maybeSingle();
    startup = legacy.data
      ? ({ ...(legacy.data as object), show_stage_publicly: false } as unknown as Row)
      : null;
  }

  if (!startup) redirect("/app/team");

  // Podgląd karty pokazuje to samo, co talia w Odkrywaj, więc potrzebuje tych
  // samych danych: składu, otwartych ról i etapu. Liczby są z bazy — panel
  // z wymyśloną metryką wyglądałby mądrze i nie znaczyłby nic.
  const [openRoles, { count: memberCount }, program] = await Promise.all([
    getOpenRoles(supabase, active.id),
    supabase
      .from("startup_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("startup_id", active.id),
    loadStageProgram(supabase, active.id),
  ]);

  const visibleRoles = openRoles.filter((role) => role.isOpen);
  const openRoleCount = visibleRoles.length;

  // Ten sam etap, który wystawia widok `public_startups`: NAJDALSZY
  // rozpoczęty, nie pierwszy otwarty. Gdyby podgląd liczył to inaczej,
  // pokazywałby coś, czego obcy nigdy nie zobaczą.
  const started = program.filter((entry) => entry.status !== "not_started");
  const stageLabel = started.at(-1)?.title ?? null;

  const completeness = scoreTeamProfile({
    logo_url: startup.logo_url,
    public_tagline: startup.public_tagline,
    public_description: startup.public_description,
    location: startup.location,
    openRoleCount,
  });

  return (
    <div className="page-wide">
      <Link
        href="/app/team"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wróć do teamu
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Profil publiczny teamu
          </h1>
          <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
            Tak widzą Was ludzie, którzy szukają projektu.
          </p>
        </div>
        <Button href={`/app/social/teams/${active.id}`} variant="secondary" size="sm">
          <Eye className="size-4" />
          Podgląd
        </Button>
      </header>

      {/* Team widoczny, ale bez logo, opisu i otwartych ról nie daje nikomu
          powodu, żeby się zgłosić — i nic mu tego nie mówiło. */}
      {startup.is_discoverable ? (
        <div className="mb-5">
          <ProfileNudge
            score={completeness.score}
            missing={completeness.missing}
            variant="panel"
            subject="team"
            showFix={false}
          />
          <p className="mt-2 px-1 text-[12.5px] text-[var(--text-subtle)]">
            {/* „Logo, opis i lokalizację uzupełnisz poniżej" opisywało pola,
                które są dwadzieścia pikseli niżej. Zostaje sama informacja
                nieoczywista: gdzie są otwarte role. */}
            Otwarte role dodajesz{" "}
            <Link
              href="/app/team"
              className="text-[var(--vairo)] underline-offset-2 hover:underline"
            >
              na stronie teamu
            </Link>
            .
          </p>
        </div>
      ) : null}

      <TeamProfileEditor
        startupId={active.id}
        name={startup.name}
        logoUrl={startup.logo_url}
        tagline={startup.public_tagline ?? ""}
        description={startup.public_description ?? ""}
        location={startup.location ?? ""}
        websiteUrl={startup.website_url ?? ""}
        isDiscoverable={startup.is_discoverable}
        showStagePublicly={startup.show_stage_publicly ?? false}
        stageConsentAvailable={stageConsentAvailable}
        status={startup.status}
        canArchive={canTransferOwnership(active.role)}
        canDelete={canTransferOwnership(active.role)}
        memberCount={memberCount ?? 0}
        stageLabel={stageLabel}
        openRoles={visibleRoles.map((role) => ({
          id: role.id,
          title: role.title,
          weeklyHours: role.weeklyHours,
          skills: role.skills,
        }))}
      />
    </div>
  );
}
