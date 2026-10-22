import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { loadGoalsWorkspace } from "@/lib/goals";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";

/**
 * Wspólny początek trzech ekranów celów (lista, szczegół, kreator):
 * zalogowany user, aktywny team i cały workspace celów.
 *
 * Uprawnienia sprawdza RLS przy odczycie i każda akcja przy zapisie — tu
 * nie ma żadnej decyzji, tylko pobranie.
 */
export async function loadGoalsContext(next: string) {
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
  return { supabase, user, active, workspace };
}
