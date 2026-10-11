import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { isExecutionUnlocked } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { GOAL_STATUS_LABELS, type GoalStatus } from "@/types/goals";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Terminy — Vairo" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const [{ data: goals }, { data: tasks }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, due_date, status")
      .eq("startup_id", active.id)
      .is("archived_at", null)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, due_date, status, goal_id")
      .eq("startup_id", active.id)
      .not("due_date", "is", null)
      .order("due_date", { ascending: true }),
  ]);

  const rows = [
    ...(goals ?? []).map((goal) => ({
      id: goal.id as string,
      title: goal.title as string,
      due: goal.due_date as string,
      kind: "Cel",
      status: GOAL_STATUS_LABELS[(goal.status as GoalStatus) ?? "todo"] ?? goal.status,
      href: `/app/goals?goal=${goal.id}`,
    })),
    ...(tasks ?? []).map((task) => ({
      id: task.id as string,
      title: task.title as string,
      due: task.due_date as string,
      kind: "Zadanie",
      status: task.status as string,
      href: `/app/tasks?task=${task.id}`,
    })),
  ].sort((a, b) => a.due.localeCompare(b.due));

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = groups.get(row.due) ?? [];
    list.push(row);
    groups.set(row.due, list);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-heading text-[1.6rem] font-semibold text-white">Terminy</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
        Daty z celów i zadań. Przekroczenie terminu nie odrzuca później dodanego wyniku.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-[14px] text-[var(--text-subtle)]">Nie ma jeszcze terminów.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[13px] font-semibold text-[var(--text-subtle)]">{day}</h2>
              <Card className="mt-2">
                <CardBody className="flex flex-col gap-3 py-4">
                  {items.map((item) => (
                    <a key={item.id} href={item.href} className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] text-white">{item.title}</span>
                      <span className="shrink-0 text-[12px] text-[var(--text-subtle)]">
                        {item.kind} · {item.status}
                      </span>
                    </a>
                  ))}
                </CardBody>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
