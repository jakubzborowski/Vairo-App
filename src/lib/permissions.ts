import type { SupabaseClient } from "@supabase/supabase-js";
import { canEditStageData, canManageTeam, type StartupRole } from "@/types/startup";

/**
 * Sprawdzanie uprawnień po stronie serwera.
 *
 * Baza egzekwuje te same reguły przez RLS (migracja 008) — to jest warstwa
 * ostateczna. Tutejsze funkcje istnieją po to, żeby zamiast surowego
 * „new row violates row-level security policy" pokazać człowiekowi zdanie,
 * które coś znaczy, i żeby nie wysyłać zapytań skazanych na odrzucenie.
 *
 * Ukrycie przycisku w interfejsie nie jest zabezpieczeniem — każda mutacja
 * przechodzi przez jedną z tych funkcji.
 */

export async function getStartupRole(
  supabase: SupabaseClient,
  startupId: string,
  userId: string
): Promise<StartupRole | null> {
  const { data } = await supabase
    .from("startup_members")
    .select("role")
    .eq("startup_id", startupId)
    .eq("profile_id", userId)
    .maybeSingle();

  return (data?.role as StartupRole | undefined) ?? null;
}

/** Rola w teamie, do którego należy dany wiersz `startup_stages`. */
export async function getStageRole(
  supabase: SupabaseClient,
  startupStageId: string,
  userId: string
): Promise<{ role: StartupRole | null; startupId: string | null }> {
  const { data: stage } = await supabase
    .from("startup_stages")
    .select("startup_id")
    .eq("id", startupStageId)
    .maybeSingle();

  if (!stage) return { role: null, startupId: null };

  const role = await getStartupRole(supabase, stage.startup_id, userId);
  return { role, startupId: stage.startup_id };
}

export const NOT_A_MEMBER = "Nie należysz do tego teamu.";
export const READ_ONLY_STAGE =
  "Tylko Founder i Admin mogą zmieniać odpowiedzi w etapach. Poproś o zmianę roli albo o podniesienie uprawnień.";
export const READ_ONLY_TEAM =
  "Tylko Founder i Admin mogą zarządzać składem teamu.";

/** Zwraca komunikat błędu albo null, gdy operacja jest dozwolona. */
export function stageWriteError(role: StartupRole | null) {
  if (!role) return NOT_A_MEMBER;
  if (!canEditStageData(role)) return READ_ONLY_STAGE;
  return null;
}

export function teamManageError(role: StartupRole | null) {
  if (!role) return NOT_A_MEMBER;
  if (!canManageTeam(role)) return READ_ONLY_TEAM;
  return null;
}
