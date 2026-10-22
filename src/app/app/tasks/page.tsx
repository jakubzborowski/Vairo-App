import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { TasksView } from "@/components/goals/tasks-view";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";

export const metadata = { title: "Taski — Vairo" };
export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/tasks");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const workspace = await loadGoalsWorkspace(supabase, active.id);
  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} title="Taski" href="/app/tasks" />;
  }

  return (
    <TasksView
      startupId={active.id}
      userId={user.id}
      role={active.role}
      members={workspace.members}
      goals={workspace.goals}
      initialTaskId={task ?? null}
    />
  );
}
