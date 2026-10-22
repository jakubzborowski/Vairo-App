import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { countPendingSignals, countUnreadMessages } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";
import { isExecutionUnlocked } from "@/lib/goals";
import { canManageTeam } from "@/types/startup";
import { ToastProvider } from "@/components/ui/toast";
import { LiveNotifications } from "@/components/app/live-notifications";
import type { TeamSummary } from "@/components/app/team-switcher";

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

  if (!user) {
    redirect("/register?next=/app");
  }

  // Liczniki nie zależą od listy teamów, więc ruszają od razu — zamiast czekać,
  // aż `getUserStartups` przejdzie swoje trzy kroki.
  const countersPromise = Promise.all([
    countUnreadMessages(supabase, user.id),
    countPendingSignals(supabase, user.id),
    countUnreadNotifications(supabase, user.id),
  ]);

  const [{ data: profile }, startups, activeTeamId] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);

  const active = resolveActiveStartup(startups, activeTeamId);

  const teams: TeamSummary[] = startups.map((startup) => ({
    id: startup.id,
    name: startup.name,
    logoUrl: startup.logoUrl,
    stageLabel: startup.stage?.title ?? null,
    stageKey: startup.stage?.key ?? null,
    progressLabel: startup.stage
      ? `${startup.stage.done}/${startup.stage.total}`
      : null,
  }));

  const name =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Użytkownik";

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
  ] = await Promise.all([
    supabase
      .from("startup_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .or(orFilter),
    countersPromise,
    active ? isExecutionUnlocked(supabase, active.id) : Promise.resolve(false),
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
    >
      <ToastProvider>
        <LiveNotifications profileId={user.id} />
        {children}
      </ToastProvider>
    </AppShell>
  );
}
