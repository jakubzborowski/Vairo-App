import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { loadRozpiski } from "@/lib/workflows";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { RozpiskaList } from "@/components/workflows/rozpiska-list";

export const metadata = { title: "Rozpiska — Vairo" };
export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/workflows");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const [list, goalsResult] = await Promise.all([
    loadRozpiski(supabase, active.id),
    supabase.from("goals").select("id, title").eq("startup_id", active.id),
  ]);

  if (list.missing || list.error) {
    return (
      <GoalsUnavailable missingMigration={list.missing} title="Rozpiska" href="/app/workflows" />
    );
  }

  const goalTitles = Object.fromEntries(
    (goalsResult.data ?? []).map((goal) => [goal.id as string, goal.title as string])
  );

  return <RozpiskaList records={list.records} goalTitles={goalTitles} />;
}
