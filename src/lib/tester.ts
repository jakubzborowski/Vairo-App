import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Panel testowy (migracja 053): przeskakiwanie etapów bez wypełniania pytań.
 *
 * Dostęp ma wyłącznie osoba, której e-mail jest w `platform_testers`. To NIE
 * jest rola w zespole — Founder, Admin i Member dotyczą jednego startupu,
 * a tester działa na całej platformie. Dlatego w interfejsie nazywa się
 * „Panel testowy”, nigdy „admin”.
 *
 * Bez migracji 053 funkcji nie ma, a błąd znaczy po prostu „nie tester”.
 */
export async function isPlatformTester(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_tester");
  if (error) return false;
  return data === true;
}

export type TesterStartupRow = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  created_at: string;
  member_count: number;
  is_member: boolean;
  /** klucz etapu → status instancji (tylko najnowsza wersja treści) */
  stages: Record<string, "in_progress" | "completed">;
};

/** Specjalna wartość dla „domknij wszystkie etapy” — ekran końca programu. */
export const TESTER_COMPLETE_KEY = "__complete__";
