"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureStartupStage } from "@/lib/stage";
import { getActiveStartupId } from "@/lib/active-team";
import { getUserStartups, resolveActiveStartup } from "@/lib/startup";
import {
  getStageRole,
  getStartupRole,
  stageWriteError,
} from "@/lib/permissions";
import { translateDbError } from "@/lib/db-errors";
import { fieldAnswered, hasAnswer, type FieldConfig, type FieldKind, type StageDecision } from "@/types/stage";
import { VALIDATION_CATEGORIES, type ValidationCategory } from "@/types/startup";

type Result = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Bramka zapisu dla wszystkiego, co dotyka treści etapu.
 *
 * Zwykły członek teamu czyta odpowiedzi, ale ich nie zmienia — tak samo mówi
 * RLS. Sprawdzamy to również tutaj, żeby zamiast błędu bazy wrócił komunikat,
 * z którego człowiek zrozumie, o co chodzi.
 */
async function guardStageWrite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupStageId: string,
  userId: string
) {
  const { role } = await getStageRole(supabase, startupStageId, userId);
  return stageWriteError(role);
}

/**
 * Zapisuje odpowiedzi jednego podpunktu.
 *
 * Klucz to `answer_key`, nie `field_id` — dzięki temu pytanie powtórzone
 * w kilku kategoriach ma jedną wspólną odpowiedź, a nie kopie.
 * Pustą odpowiedź kasujemy, żeby trigger cofnął status podpunktu.
 */
export async function saveSubpointAnswers(input: {
  startupStageId: string;
  subpointId: string;
  answers: Record<string, unknown>;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const denied = await guardStageWrite(supabase, input.startupStageId, user.id);
  if (denied) return { error: denied };

  const { data: fieldRows } = await supabase
    .from("stage_fields")
    .select("answer_key, kind, config")
    .eq("subpoint_id", input.subpointId);

  const byKey = new Map(
    (fieldRows ?? []).map((row) => [
      row.answer_key as string,
      {
        kind: row.kind as FieldKind,
        config: (row.config ?? {}) as FieldConfig,
      },
    ])
  );

  const isFilled = (key: string, value: unknown) => {
    const field = byKey.get(key);
    return field ? fieldAnswered(field, value) : hasAnswer(value);
  };

  const entries = Object.entries(input.answers);
  const toUpsert = entries.filter(([key, value]) => isFilled(key, value));
  const toDelete = entries
    .filter(([key, value]) => !isFilled(key, value))
    .map(([key]) => key);

  if (toUpsert.length > 0) {
    const { error } = await supabase.from("stage_answers").upsert(
      toUpsert.map(([answer_key, value]) => ({
        startup_stage_id: input.startupStageId,
        answer_key,
        value,
        answered_by: user.id,
      })),
      { onConflict: "startup_stage_id,answer_key" }
    );
    if (error) return { error: translateDbError(error.message) };
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("stage_answers")
      .delete()
      .eq("startup_stage_id", input.startupStageId)
      .in("answer_key", toDelete);
    if (error) return { error: translateDbError(error.message) };
  }

  // Zapamiętujemy, gdzie user skończył — wejście w /app wraca dokładnie tutaj.
  await supabase
    .from("startup_stages")
    .update({ last_subpoint_id: input.subpointId })
    .eq("id", input.startupStageId);

  await syncStartupName(supabase, input.startupStageId, input.answers);

  revalidatePath("/app/stage");
  revalidatePath("/app");
  return { error: null };
}

/**
 * Pole z `syncs_startup_name` nadaje nazwę startupowi — w Ambition Stage
 * robi to punkt „Nadaj projektowi roboczą nazwę".
 */
async function syncStartupName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupStageId: string,
  answers: Record<string, unknown>
) {
  const keys = Object.keys(answers);
  if (keys.length === 0) return;

  const { data: fields } = await supabase
    .from("stage_fields")
    .select("answer_key, config")
    .in("answer_key", keys);

  const syncField = (fields ?? []).find(
    (f) => (f.config as { syncs_startup_name?: boolean })?.syncs_startup_name
  );
  if (!syncField) return;

  const value = answers[syncField.answer_key];
  if (typeof value !== "string" || value.trim().length < 2) return;

  const { data: stage } = await supabase
    .from("startup_stages")
    .select("startup_id")
    .eq("id", startupStageId)
    .maybeSingle();

  if (!stage) return;

  await supabase
    .from("startups")
    .update({ name: value.trim().slice(0, 80) })
    .eq("id", stage.startup_id);
}

/** Zapamiętuje ostatnio otwarty podpunkt (bez zapisu odpowiedzi). */
export async function rememberSubpoint(startupStageId: string, subpointId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  if (await guardStageWrite(supabase, startupStageId, user.id)) return;
  await supabase
    .from("startup_stages")
    .update({ last_subpoint_id: subpointId })
    .eq("id", startupStageId);
}

/**
 * Domyka etap wraz z decyzją.
 *
 * Guidelines (10.5): zamknięcie zapisuje snapshot odpowiedzi i decyzję, a
 * dopiero potem odblokowuje kolejny etap. Cztery warianty:
 *   • continue — idziemy dalej,
 *   • pivot    — zmieniamy kierunek, etap zostaje otwarty, wskazane podpunkty
 *                wracają do wypełnienia (poprzednie odpowiedzi zostają
 *                w snapshocie),
 *   • pause    — startup na pauzie,
 *   • archive  — startup do archiwum.
 *
 * Cała zmiana dzieje się w jednej transakcji w bazie (`close_stage`), więc nie
 * ma stanu, w którym etap jest zamknięty, a decyzja nie została zapisana.
 */
export async function closeStage(input: {
  startupStageId: string;
  decision: StageDecision;
  note?: string;
  reopenSubpointIds?: string[];
}): Promise<Result & { next?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const denied = await guardStageWrite(supabase, input.startupStageId, user.id);
  if (denied) return { error: denied };

  const { data: stage } = await supabase
    .from("startup_stages")
    .select("id, startup_id, stage_templates(key)")
    .eq("id", input.startupStageId)
    .maybeSingle();

  if (!stage) return { error: "Nie znaleziono etapu." };

  const templateKey =
    (stage.stage_templates as unknown as { key: string } | null)?.key ?? "";

  const { error } = await supabase.rpc("close_stage", {
    p_startup_stage_id: input.startupStageId,
    p_decision: input.decision,
    p_note: input.note?.trim() || null,
    p_reopen_subpoints:
      input.decision === "pivot" ? (input.reopenSubpointIds ?? []) : null,
  });

  if (error) return { error: translateStageError(error.message) };

  revalidatePath("/app/stage");
  revalidatePath("/app");
  revalidatePath("/app/team");

  if (input.decision !== "continue") {
    // Pivot zostawia etap otwarty, pauza i archiwum nie otwierają kolejnego.
    return { error: null, next: "/app/stage" };
  }

  // Ambition prowadzi przez podsumowanie, a nie prosto do wyboru kategorii.
  // Bez tego nikt nie pokazywał człowiekowi, co właśnie ustalił przez pół godziny.
  if (templateKey === "ambition") {
    return {
      error: null,
      next: "/app/stage/summary?stage=ambition&next=categories",
    };
  }

  // MVP Stage kończy program ekranem z wynikami i prostą ofertą dalszej współpracy (§1C).
  if (templateKey === "mvp") {
    revalidatePath("/app/stage/complete");
    return { error: null, next: "/app/stage/complete" };
  }

  return { error: null, next: "/app" };
}

/**
 * Domknięcie bez pytania o decyzję — dla etapów, które jej nie mają
 * (Ambition kończy się wyborem kategorii, nie oceną pomysłu).
 */
export async function finishStage(startupStageId: string) {
  return closeStage({ startupStageId, decision: "continue" });
}

function translateStageError(message: string) {
  if (message.includes("not_allowed")) {
    return "Tylko Founder i Admin mogą zamknąć etap.";
  }
  if (message.includes("stage_not_found")) return "Nie znaleziono etapu.";
  if (message.includes("close_stage") && message.includes("does not exist")) {
    return "Brakuje migracji 010 — odpal ją w Supabase → SQL Editor.";
  }
  return message;
}

/** Ponowne otwarcie domkniętego etapu — user może wrócić i poprawić. */
export async function reopenStage(startupStageId: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const denied = await guardStageWrite(supabase, startupStageId, user.id);
  if (denied) return { error: denied };

  const { error } = await supabase
    .from("startup_stages")
    .update({ status: "in_progress", completed_at: null })
    .eq("id", startupStageId);

  if (error) return { error: error.message };

  revalidatePath("/app/stage");
  return { error: null };
}

/**
 * Wybór kategorii po Ambition Stage.
 *
 * Na starcie Ambition człowiek nie wie jeszcze, czy buduje SaaS, czy
 * urządzenie — dowiaduje się tego dopiero, wypełniając etap. Dlatego
 * kategorie wybiera dopiero tutaj, wchodząc w Idea Stage.
 */
export async function chooseCategoriesAfterAmbition(
  formData: FormData
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const startupId = String(formData.get("startup_id") ?? "");
  if (!startupId) return { error: "Brak kontekstu teamu." };

  const role = await getStartupRole(supabase, startupId, user.id);
  const denied = stageWriteError(role);
  if (denied) return { error: denied };

  const categories = String(formData.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ValidationCategory =>
      (VALIDATION_CATEGORIES as readonly string[]).includes(c) && c !== "general"
    );

  const tagIds = String(formData.get("tag_ids") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  await supabase
    .from("startup_categories")
    .delete()
    .eq("startup_id", startupId)
    .neq("category", "general");

  if (categories.length > 0) {
    const { error } = await supabase
      .from("startup_categories")
      .insert(categories.map((category) => ({ startup_id: startupId, category })));
    if (error) return { error: translateDbError(error.message) };
  }

  await supabase.from("startup_tags").delete().eq("startup_id", startupId);
  if (tagIds.length > 0) {
    await supabase
      .from("startup_tags")
      .insert(tagIds.map((tag_id) => ({ startup_id: startupId, tag_id })));
  }

  const stageId = await ensureStartupStage(supabase, startupId, "idea");
  if (!stageId) {
    return { error: "Treść Idea Stage nie jest jeszcze wgrana do bazy." };
  }

  revalidatePath("/app/stage");
  revalidatePath("/app");
  return { error: null };
}

/**
 * Domknięcie szkieletu etapu bez treści (np. Execution zanim wjedzie JSON).
 * Zakłada instancję i od razu zamyka ją decyzją „continue”, żeby program
 * mógł przejść dalej — jawnie, przyciskiem Foundera/Admina.
 */
export async function advanceSkeletonStage(formData: FormData) {
  const stageKey = String(formData.get("stage_key") ?? "").trim();
  if (!stageKey) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return;

  const denied = stageWriteError(active.role);
  if (denied) return;

  const { data: template } = await supabase
    .from("stage_templates")
    .select("id, published_at")
    .eq("key", stageKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tylko szkielet — gdy treść już jest, domknięcie idzie normalną ścieżką etapu.
  if (!template || template.published_at) return;

  const stageId = await ensureStartupStage(supabase, active.id, stageKey);
  if (!stageId) return;

  await closeStage({
    startupStageId: stageId,
    decision: "continue",
  });

  revalidatePath("/app/stage");
  revalidatePath("/app");
  // Po szkielecie zawsze wracamy do etapu — bieżący program powinien wskazać
  // kolejny z treścią (np. MVP), a nie dashboard.
  redirect("/app/stage");
}

/**
 * Jawne otwarcie pominiętego etapu.
 *
 * Wcześniej wystarczyło kliknąć w pominięty etap na pasku, żeby aplikacja
 * po cichu założyła jego instancję — a wtedy program „cofał się" i kazał
 * uzupełniać coś, czego user nigdy nie wybrał. Założenie etapu jest decyzją,
 * więc musi być osobnym kliknięciem, a nie skutkiem ubocznym oglądania.
 */
export async function openStage(formData: FormData) {
  const stageKey = String(formData.get("stage_key") ?? "").trim();
  if (!stageKey) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const [startups, activeTeamId] = await Promise.all([
    getUserStartups(supabase, user.id),
    getActiveStartupId(),
  ]);
  const active = resolveActiveStartup(startups, activeTeamId);
  if (!active) return;

  const denied = stageWriteError(active.role);
  if (denied) return;

  await ensureStartupStage(supabase, active.id, stageKey);

  revalidatePath("/app/stage");
  revalidatePath("/app");
  redirect(`/app/stage?stage=${stageKey}`);
}
