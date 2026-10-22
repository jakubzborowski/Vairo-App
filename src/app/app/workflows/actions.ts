"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { NOT_A_MEMBER, getStartupRole } from "@/lib/permissions";
import type { StartupRole } from "@/types/startup";

export type RozpiskaNode = { id: string; x: number; y: number; label: string };
export type RozpiskaEdge = { id: string; from: string; to: string };

type Result = { error: string | null; id?: string };

type Gate =
  | { ok: false; error: string }
  | { ok: true; supabase: SupabaseClient; user: User; role: StartupRole };

async function context(startupId: string): Promise<Gate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesja wygasła — zaloguj się ponownie." };
  const active = await getActiveStartupId();
  if (active && active !== startupId) {
    return { ok: false, error: "Przełącz team i spróbuj ponownie." };
  }
  const role = await getStartupRole(supabase, startupId, user.id);
  if (!role) return { ok: false, error: NOT_A_MEMBER };
  return { ok: true, supabase, user, role };
}

export async function saveWorkflow(input: {
  startupId: string;
  id?: string | null;
  title: string;
  goalId?: string | null;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };

  const title = input.title.trim();
  if (title.length < 2) return { error: "Nazwij rozpiskę, żeby dało się do niej wrócić." };

  const nodes = input.nodes
    .filter((node) => node.label.trim())
    .map((node) => ({
      id: node.id,
      x: Math.round(node.x),
      y: Math.round(node.y),
      label: node.label.trim().slice(0, 80),
    }));
  const ids = new Set(nodes.map((node) => node.id));
  const edges = input.edges.filter(
    (edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to
  );

  if (input.id) {
    const { error } = await ctx.supabase
      .from("workflows")
      .update({
        title,
        goal_id: input.goalId || null,
        nodes,
        edges,
      })
      .eq("id", input.id)
      .eq("startup_id", input.startupId);
    if (error) return { error: translateDbError(error.message) };
    revalidatePath("/app/workflows", "layout");
    revalidatePath("/app/goals", "layout");
    return { error: null, id: input.id };
  }

  const { data, error } = await ctx.supabase
    .from("workflows")
    .insert({
      startup_id: input.startupId,
      title,
      goal_id: input.goalId || null,
      nodes,
      edges,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: translateDbError(error?.message) };
  revalidatePath("/app/workflows", "layout");
  return { error: null, id: data.id };
}

/**
 * Usunięcie Rozpiski razem z jej wersjami (kaskada w 025). Dowody celów,
 * które jej użyły, zostają — trzymają kopię bloczków i strzałek.
 *
 * RLS (`workflows_all`) wpuszcza każdego członka teamu; aplikacja zawęża to
 * do autora, Foundera i Admina, żeby jedno kliknięcie nie kasowało cudzej
 * pracy.
 */
export async function deleteWorkflow(startupId: string, id: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };

  const { data: row } = await ctx.supabase
    .from("workflows")
    .select("id, created_by")
    .eq("id", id)
    .eq("startup_id", startupId)
    .maybeSingle();
  if (!row) return { error: "Nie ma takiej rozpiski." };
  if (ctx.role === "member" && row.created_by !== ctx.user.id) {
    return { error: "Usunąć cudzą rozpiskę może jej autor, Founder albo Admin." };
  }

  const { error } = await ctx.supabase.from("workflows").delete().eq("id", id);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/app/workflows", "layout");
  revalidatePath("/app/goals", "layout");
  return { error: null };
}
