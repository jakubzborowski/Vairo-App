"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { getT } from "@/i18n/server";

export type JumpResult =
  | { error: string; completed?: never; removed?: never }
  | { error: null; completed: number; removed: number };

/**
 * Ustawia wybrany etap jako bieżący w dowolnym startupie. Uprawnienie
 * sprawdza baza (`tester_jump_to_stage` → `is_platform_tester`), więc
 * wywołanie tej akcji przez kogoś spoza listy kończy się błędem, nawet
 * gdyby ominął stronę.
 */
export async function jumpToStage(startupId: string, stageKey: string): Promise<JumpResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tester_jump_to_stage", {
    p_startup_id: startupId,
    p_stage_key: stageKey,
  });

  if (error) {
    return {
      error:
        (await translateDbError(error.message)) ??
        (await getT("tester"))("errors.jumpFailed"),
    };
  }

  const result = (data ?? {}) as { completed?: number; removed?: number };
  revalidatePath("/app", "layout");
  return { error: null, completed: result.completed ?? 0, removed: result.removed ?? 0 };
}
