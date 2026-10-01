import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { TasksView } from "@/components/goals/tasks-view";

export const metadata = { title: "Taski — Vairo" };
export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/register?next=/app/tasks");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const workspace = await loadGoalsWorkspace(supabase, active.id);
  if (!workspace.ready || workspace.loadError) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-heading text-[1.6rem] font-semibold text-white">Taski</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
          {workspace.ready
            ? "Nie udało się wczytać zadań. Odśwież stronę."
            : "Brakuje migracji 018. Odpal ją w Supabase → SQL Editor."}
        </p>
      </div>
    );
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
