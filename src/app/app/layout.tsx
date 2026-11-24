import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INVITE_COOKIE, INVITE_TOKEN_RE } from "@/lib/invites";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";
import { isPlatformTester } from "@/lib/tester";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { countPendingSignals, countUnreadMessages } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";
import { isExecutionUnlocked } from "@/lib/goals";
import { canManageTeam } from "@/types/startup";
import { ToastProvider } from "@/components/ui/toast";
import { LiveNotifications } from "@/components/app/live-notifications";
import type { TeamSummary } from "@/components/app/team-switcher";
import { PosthogIdentify } from "@/components/analytics/posthog-identify";
import { LocaleSync } from "@/components/app/locale-sync";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Wspólna powłoka dla całego /app: user, lista teamów i aktywny kontekst.
 * Robimy to raz tutaj, zamiast powtarzać w każdej stronie.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const t = await getT("common");

  if (!user) {
    redirect("/register?next=/app");
  }

  // Zaproszenie linkiem zapamiętane przed rejestracją (migracja 035). Nowa
  // osoba przechodzi najpierw onboarding — proxy nie wpuści jej tu wcześniej —
  // a pierwsze wejście do aplikacji wraca prosto do zaproszenia. Ciasteczko
  // znika przy „Dołącz” albo „Nie teraz”.
  const pendingInvite = (await cookies()).get(INVITE_COOKIE)?.value;
  if (pendingInvite && INVITE_TOKEN_RE.test(pendingInvite)) {
    redirect(`/join/${pendingInvite}`);
  }

  // Liczniki nie zależą od listy teamów, więc ruszają od razu — zamiast czekać,
  // aż `getUserStartups` przejdzie swoje trzy kroki.
  const countersPromise = Promise.all([
    countUnreadMessages(supabase, user.id),
    countPendingSignals(supabase, user.id),
    countUnreadNotifications(supabase, user.id),
  ]);

  const [{ data: profile }, startups, activeTeamId, localeRow] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
    // Osobno od reszty profilu: bez migracji 049 kolumny nie ma, a błąd tego
    // zapytania nie może zabrać imienia i avatara z menu.
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
  ]);
  const profileLocale = localeRow.error
    ? undefined
    : ((localeRow.data?.locale as string | null | undefined) ?? null);

  const active = resolveActiveStartup(startups, activeTeamId);

  const teams: TeamSummary[] = startups.map((startup) => ({
    id: startup.id,
    name: startup.name,
    logoUrl: startup.logoUrl,
    stageLabel: startup.stage?.title ?? null,
    stageKey: startup.stage?.key ?? null,
    // Bez „3/13” całego etapu: w menu, widocznym na każdym ekranie, ta
    // liczba straszyła najbardziej. Miejsce w programie pokazują kreski pod
    // nazwą, a postęp w etapie — ekran etapu, tam, gdzie się nad nim pracuje.
    progressLabel: null,
  }));

  const name =
    profile?.full_name?.trim() || user.email?.split("@")[0] || t("fallbackName");

  // Jeden licznik skrzynki: wszystko, co czeka na decyzje tego uzytkownika —
  // zgloszenia do teamow, ktorymi zarzadza, zaproszenia skierowane do niego
  // i zaczepki od ludzi. RLS i tak nie pokaze mu niczego wiecej.
  const manageableIds = startups
    .filter((startup) => startup.role === "founder" || startup.role === "admin")
    .map((startup) => startup.id);

  const orFilter = [
    `and(direction.eq.invite,profile_id.eq.${user.id})`,
    manageableIds.length > 0
      ? `and(direction.eq.application,startup_id.in.(${manageableIds.join(",")}))`
      : null,
  ]
    .filter(Boolean)
    .join(",");

  const [
    { count: pendingInvites },
    [unreadMessages, pendingContacts, unreadNotifications],
    executionUnlocked,
    isTester,
  ] = await Promise.all([
    supabase
      .from("startup_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .or(orFilter),
    countersPromise,
    active ? isExecutionUnlocked(supabase, active.id) : Promise.resolve(false),
    isPlatformTester(supabase),
  ]);

  return (
    <AppShell
      user={{
        id: user.id,
        name,
        email: user.email ?? profile?.email ?? "",
        avatarUrl: profile?.avatar_url ?? null,
      }}
      teams={teams}
      activeTeamId={active?.id ?? null}
      canManageActiveTeam={active ? canManageTeam(active.role) : false}
      activeRole={active?.role ?? null}
      badges={{
        inbox: (pendingInvites ?? 0) + pendingContacts,
        messages: unreadMessages,
        notifications: unreadNotifications,
      }}
      executionUnlocked={executionUnlocked}
      isTester={isTester}
    >
      <ToastProvider>
        <PosthogIdentify userId={user.id} />
        <LocaleSync profileLocale={profileLocale} />
        <LiveNotifications profileId={user.id} />
        {children}
      </ToastProvider>
    </AppShell>
  );
}
