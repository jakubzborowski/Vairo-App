import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { isExecutionUnlocked, loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { GOAL_STATUS_LABELS, TASK_STATUS_LABELS, type GoalStatus, type TaskStatus } from "@/types/goals";
import { CalendarView, type DeadlineItem } from "@/components/calendar/calendar-view";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";

export const metadata = { title: "Terminy — Vairo" };
export const dynamic = "force-dynamic";

const GOAL_TONE: Record<GoalStatus, DeadlineItem["statusTone"]> = {
  todo: "muted",
  in_progress: "info",
  blocked: "danger",
  awaiting_proof: "warning",
  completed: "success",
};
const TASK_TONE: Record<TaskStatus, DeadlineItem["statusTone"]> = {
  todo: "muted",
  in_progress: "info",
  blocked: "danger",
  done: "success",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/calendar");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  if (!(await isExecutionUnlocked(supabase, active.id))) {
    redirect("/app");
  }

  const workspace = await loadGoalsWorkspace(supabase, active.id);
  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} title="Terminy" href="/app/calendar" />;
  }

  // Terminy to daty z celów i zadań — nic więcej. Zarchiwizowane cele (i ich
  // zadania) nie mają już terminu, który by kogoś obowiązywał.
  const items: DeadlineItem[] = workspace.goals
    .filter((goal) => !goal.archivedAt)
    .flatMap((goal) => [
      {
        id: goal.id,
        kind: "goal" as const,
        title: goal.title,
        what: `Cel · ${goal.goalTypeLabel}`,
        due: goal.dueDate,
        ownerId: goal.ownerId,
        ownerName: goal.ownerName,
        statusLabel: GOAL_STATUS_LABELS[goal.status],
        statusTone: GOAL_TONE[goal.status],
        open: goal.status !== "completed",
        href: `/app/goals/${goal.id}`,
      },
      ...goal.tasks
        .filter((task) => task.dueDate)
        .map((task) => ({
          id: task.id,
          kind: "task" as const,
          title: task.title,
          what: `Zadanie w celu „${goal.title}”`,
          due: task.dueDate as string,
          ownerId: task.ownerId,
          ownerName: task.ownerName,
          statusLabel: TASK_STATUS_LABELS[task.status],
          statusTone: TASK_TONE[task.status],
          open: task.status !== "done",
          href: `/app/tasks?task=${task.id}`,
        })),
    ])
    .sort((a, b) => a.due.localeCompare(b.due) || (a.kind === b.kind ? 0 : a.kind === "goal" ? -1 : 1));

  return <CalendarView items={items} userId={user.id} />;
}
