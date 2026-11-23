import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { isExecutionUnlocked, loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { type GoalStatus, type TaskStatus } from "@/types/goals";
import { CalendarView, type DeadlineItem } from "@/components/calendar/calendar-view";
import { GoalsUnavailable } from "@/components/goals/goals-unavailable";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("goals");
  return { title: t("calendar.metaTitle") };
}
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
  const t = await getT("goals");
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/calendar");

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  // Równolegle: przed odblokowaniem Execution nikt tu nie trafia z menu,
  // więc zbędny odczyt celów zdarza się rzadko, a zwykłe wejście jest szybsze.
  const [unlocked, workspace] = await Promise.all([
    isExecutionUnlocked(supabase, active.id),
    loadGoalsWorkspace(supabase, active.id),
  ]);
  if (!unlocked) redirect("/app");
  if (!workspace.ready || workspace.loadError) {
    return <GoalsUnavailable missingMigration={!workspace.ready} title={t("calendar.title")} href="/app/calendar" />;
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
        what: t("calendar.goalWhat", { type: goal.goalTypeLabel }),
        due: goal.dueDate,
        ownerId: goal.ownerId,
        ownerName: goal.ownerName,
        statusLabel: t(`goalStatus.${goal.status}`),
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
          what: t("calendar.taskWhat", { title: goal.title }),
          due: task.dueDate as string,
          ownerId: task.ownerId,
          ownerName: task.ownerName,
          statusLabel: t(`taskStatus.${task.status}`),
          statusTone: TASK_TONE[task.status],
          open: task.status !== "done",
          href: `/app/tasks?task=${task.id}`,
        })),
    ])
    .sort((a, b) => a.due.localeCompare(b.due) || (a.kind === b.kind ? 0 : a.kind === "goal" ? -1 : 1));

  return <CalendarView items={items} userId={user.id} />;
}
