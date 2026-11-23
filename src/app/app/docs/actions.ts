"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { titleFromBody } from "@/lib/markdown";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import { DOC_TEMPLATES } from "@/types/docs";

import { getT } from "@/i18n/server";
async function context() {
  const t = await getT("docs");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("actions.zalogujSiePonownie") };
  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return { error: t("actions.wybierzStartup") };
  return { supabase, user, active };
}

/** Pusty tytuł nie blokuje zapisu — dokument dostaje nazwę z pierwszej linijki. */
function cleanTitle(title: string, body: string) {
  const trimmed = title.trim();
  return (trimmed || titleFromBody(body)).slice(0, 140);
}

/**
 * Nowy dokument. Zapis rusza od pierwszego znaku, więc dokument powstaje
 * w tle, zanim ktoś pomyśli o „Zapisz" — i od razu ma swój adres.
 */
export async function createDocument(input: {
  title: string;
  body: string;
}): Promise<{ error: string | null; id?: string }> {
  const ctx = await context();
  if ("error" in ctx) return { error: String(ctx.error) };

  const { data, error } = await ctx.supabase
    .from("startup_documents")
    .insert({
      startup_id: ctx.active.id,
      title: cleanTitle(input.title, input.body),
      body: input.body ?? "",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: await translateDbError(error?.message) };

  revalidatePath("/app/docs", "layout");
  return { error: null, id: data.id as string };
}

/** Dokument z gotowego początku — od razu z nagłówkami do uzupełnienia. */
export async function createFromTemplate(
  templateId: string
): Promise<{ error: string | null; id?: string }> {
  const template = DOC_TEMPLATES.find((item) => item.id === templateId);
  if (!template || template.id === "blank") return { error: null };
  const t = await getT("docs");
  return createDocument({
    title: t.maybe(`template.${template.id}.title`, ""),
    body: t.maybe(`template.${template.id}.body`, ""),
  });
}

export async function saveDocument(input: {
  id?: string;
  title: string;
  body: string;
}): Promise<{ error: string | null; id?: string }> {
  const t = await getT("docs");
  if (!input.id) return createDocument(input);

  const ctx = await context();
  if ("error" in ctx) return { error: String(ctx.error) };
  const body = input.body ?? "";

  const { data, error } = await ctx.supabase
    .from("startup_documents")
    .update({ title: cleanTitle(input.title, body), body, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("startup_id", ctx.active.id)
    .select("id");
  if (error) return { error: await translateDbError(error.message) };
  // RLS nie zwraca błędu przy cudzym dokumencie — tylko zero wierszy. Bez tej
  // kontroli autozapis pokazywał „Zapisano", a tekst przepadał.
  if (!data || data.length === 0) return { error: t("actions.tenDokumentZmieniaJego") };

  // Autozapis leci co kilka sekund pisania — odświeżamy tylko półkę,
  // nie stronę dokumentu, na której ktoś właśnie pisze.
  revalidatePath("/app/docs");
  return { error: null, id: input.id };
}

export async function deleteDocument(id: string): Promise<{ error: string | null }> {
  const t = await getT("docs");
  const ctx = await context();
  if ("error" in ctx) return { error: String(ctx.error) };
  const { data, error } = await ctx.supabase
    .from("startup_documents")
    .delete()
    .eq("id", id)
    .eq("startup_id", ctx.active.id)
    .select("id");
  if (error) return { error: await translateDbError(error.message) };
  if (!data || data.length === 0) return { error: t("actions.tenDokumentZmieniaJego") };
  revalidatePath("/app/docs", "layout");
  return { error: null };
}
