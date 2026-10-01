import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { getActiveStartupId } from "@/lib/active-team";
import { countPendingSignals, countUnreadMessages } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";
import { isExecutionUnlocked } from "@/lib/goals";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/app");
  }

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
    unreadMessages,
    pendingContacts,
    unreadNotifications,
    executionUnlocked,
  ] = await Promise.all([
    supabase
      .from("startup_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .or(orFilter),
    countUnreadMessages(supabase, user.id),
    countPendingSignals(supabase, user.id),
    countUnreadNotifications(supabase, user.id),
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
      badges={{
        inbox: (pendingInvites ?? 0) + pendingContacts,
        messages: unreadMessages,
        notifications: unreadNotifications,
      }}
      executionUnlocked={executionUnlocked}
    >
      {children}
    </AppShell>
  );
}
