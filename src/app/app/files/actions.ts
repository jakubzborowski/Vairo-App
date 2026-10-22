"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { NOT_A_MEMBER, getStartupRole } from "@/lib/permissions";

type Result = { error: string | null; id?: string };

const NEEDS_030 = "Foldery i zmiana nazwy potrzebują migracji 030. Odpal ją w Supabase → SQL Editor.";

async function context(startupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesja wygasła — zaloguj się ponownie." };
  const active = await getActiveStartupId();
  if (active && active !== startupId) return { ok: false as const, error: "Przełącz team i spróbuj ponownie." };
  const role = await getStartupRole(supabase, startupId, user.id);
  if (!role) return { ok: false as const, error: NOT_A_MEMBER };
  return { ok: true as const, supabase, user, role };
}

function explain(message: string | undefined) {
  if (message && (message.includes("startup_file_folders") || message.includes("folder_id"))) {
    return NEEDS_030;
  }
  return translateDbError(message);
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function createFolder(input: {
  startupId: string;
  name: string;
  parentId?: string | null;
}): Promise<Result> {
  const ctx = await context(input.startupId);
  if (!ctx.ok) return { error: ctx.error };
  const name = cleanName(input.name);
  if (!name) return { error: "Nazwij folder." };

  const { data, error } = await ctx.supabase
    .from("startup_file_folders")
    .insert({
      startup_id: input.startupId,
      name,
      parent_id: input.parentId ?? null,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: explain(error?.message) };
  revalidatePath("/app/files");
  return { error: null, id: data.id as string };
}

export async function renameFolder(startupId: string, folderId: string, name: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const clean = cleanName(name);
  if (!clean) return { error: "Nazwa nie może być pusta." };
  const { data, error } = await ctx.supabase
    .from("startup_file_folders")
    .update({ name: clean })
    .eq("id", folderId)
    .eq("startup_id", startupId)
    .select("id");
  if (error) return { error: explain(error.message) };
  if (!data || data.length === 0) return { error: "Ten folder zmienia osoba, która go założyła, albo Founder lub Admin." };
  revalidatePath("/app/files");
  return { error: null };
}

/** Usunięcie folderu nie kasuje plików — wracają do „Od zespołu" (030). */
export async function deleteFolder(startupId: string, folderId: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { data, error } = await ctx.supabase
    .from("startup_file_folders")
    .delete()
    .eq("id", folderId)
    .eq("startup_id", startupId)
    .select("id");
  if (error) return { error: explain(error.message) };
  if (!data || data.length === 0) return { error: "Ten folder zmienia osoba, która go założyła, albo Founder lub Admin." };
  revalidatePath("/app/files");
  return { error: null };
}

export async function renameFile(startupId: string, fileId: string, name: string): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const clean = name.trim().slice(0, 200);
  if (!clean) return { error: "Nazwa nie może być pusta." };
  const { data, error } = await ctx.supabase
    .from("startup_files")
    .update({ name: clean })
    .eq("id", fileId)
    .eq("startup_id", startupId)
    .select("id");
  if (error) return { error: explain(error.message) };
  // RLS bez prawa do zmiany nie zwraca błędu, tylko zero wierszy.
  if (!data || data.length === 0) {
    return { error: "Zmienić nazwę cudzego pliku może Founder albo Admin." };
  }
  revalidatePath("/app/files");
  return { error: null };
}

export async function moveFile(startupId: string, fileId: string, folderId: string | null): Promise<Result> {
  const ctx = await context(startupId);
  if (!ctx.ok) return { error: ctx.error };
  const { data, error } = await ctx.supabase
    .from("startup_files")
    .update({ folder_id: folderId })
    .eq("id", fileId)
    .eq("startup_id", startupId)
    .select("id");
  if (error) return { error: explain(error.message) };
  if (!data || data.length === 0) {
    return { error: "Przenieść cudzy plik może Founder albo Admin." };
  }
  revalidatePath("/app/files");
  return { error: null };
}
