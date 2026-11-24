import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerCard = {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

/**
 * Wizytówki osób z drugiej strony rozmowy.
 *
 * Polityka RLS na `profiles` wpuszcza do pełnego wiersza wyłącznie siebie,
 * kolegów z teamu i kandydatów do własnego teamu — bo w tym wierszu jest
 * e-mail. Cała warstwa Social działa POZA teamem, więc przy rozmowie z kimś
 * poznanym w Odkrywaj embed `profiles(...)` zwracał NULL i czat pokazywał
 * „Bez imienia" mimo że obie osoby miały uzupełnione profile.
 *
 * Widok `contact_profiles` (migracja 019) wystawia cztery kolumny i tylko tym,
 * z którymi łączy Cię zaczepka albo rozmowa. Braku migracji nie traktujemy
 * jak błędu: wtedy zostaje to, co dał embed, czyli dotychczasowe zachowanie.
 */
export async function loadPartnerCards(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, PartnerCard>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from("contact_profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", unique);

  if (error) return new Map();

  return new Map(
    ((data ?? []) as unknown as ({ id: string } & PartnerCard)[]).map((row) => [
      row.id,
      { full_name: row.full_name, avatar_url: row.avatar_url, headline: row.headline },
    ])
  );
}
