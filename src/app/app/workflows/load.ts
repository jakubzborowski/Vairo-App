import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";

/** Wspólny początek edytora: user, aktywny team i cele (do „Dla celu" i dowodu). */
export async function loadWorkflowContext(next: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/register?next=${encodeURIComponent(next)}`);

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");

  const workspace = await loadGoalsWorkspace(supabase, active.id);
  return { supabase, user, active, goals: workspace.goals };
}
