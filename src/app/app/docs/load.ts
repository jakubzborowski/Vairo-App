import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";

export async function loadDocsContext(next: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/register?next=${encodeURIComponent(next)}`);

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) redirect("/app");
  return { supabase, user, active };
}

/**
 * Dokumenty z `updated_by` (031), a bez migracji — bez tej kolumny. „Kto
 * pisze" spada wtedy na autora.
 */
export async function selectDocuments(
  supabase: Awaited<ReturnType<typeof loadDocsContext>>["supabase"],
  startupId: string,
  id?: string
) {
  const base = "id, title, body, created_by, updated_at";
  const build = (columns: string) => {
    const query = supabase.from("startup_documents").select(columns).eq("startup_id", startupId);
    return id ? query.eq("id", id) : query.order("updated_at", { ascending: false });
  };
  const first = await build(`${base}, updated_by`);
  const result = first.error && first.error.message.includes("updated_by") ? await build(base) : first;
  type Row = {
    id: string;
    title: string;
    body: string | null;
    created_by: string | null;
    updated_at: string;
    updated_by?: string | null;
  };
  return { error: result.error, rows: (result.data ?? []) as unknown as Row[] };
}
