"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";

async function context() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Zaloguj się ponownie." as const };
  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return { error: "Wybierz startup." as const };
  return { supabase, user, active };
}

export async function saveDocument(input: { id?: string; title: string; body: string }) {
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error };
  const title = input.title.trim();
  if (title.length < 1) return { error: "Dokument potrzebuje tytułu." };
  const body = input.body ?? "";

  if (input.id) {
    const { error } = await ctx.supabase
      .from("startup_documents")
      .update({ title, body, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("startup_id", ctx.active.id);
    if (error) return { error: translateDbError(error.message) };
  } else {
    const { error } = await ctx.supabase.from("startup_documents").insert({
      startup_id: ctx.active.id,
      title,
      body,
      created_by: ctx.user.id,
    });
    if (error) return { error: translateDbError(error.message) };
  }

  revalidatePath("/app/docs");
  return { error: null };
}

export async function deleteDocument(id: string) {
  const ctx = await context();
  if ("error" in ctx) return { error: ctx.error };
  const { error } = await ctx.supabase
    .from("startup_documents")
    .delete()
    .eq("id", id)
    .eq("startup_id", ctx.active.id);
  if (error) return { error: translateDbError(error.message) };
  revalidatePath("/app/docs");
  return { error: null };
}
