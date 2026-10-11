import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Kasowanie plików ze Storage przy usuwaniu startupu.
 *
 * **Dlaczego to jest w aplikacji, skoro migracja 020 ma triggery.**
 * Trigger w SQL-u kasuje wiersz w `storage.objects` — czyli to, co widzi
 * aplikacja, RLS i przeglądarka plików. Fizyczne bajty z backendu Storage
 * usuwa dopiero API Storage. Żeby zwolnić miejsce w projekcie, trzeba więc
 * wywołać `remove()`, a nie tylko skasować wiersz.
 *
 * Kolejność jest istotna: **najpierw pliki, potem wiersz startupu.** Póki
 * startup istnieje, Founder jest jego członkiem i RLS na buckecie go
 * przepuszcza. Po usunięciu wiersza `can_access_stage()` nie ma już czego
 * znaleźć i ten sam człowiek nie ma prawa dotknąć własnych plików. Po
 * odwrotnej kolejności zostałyby sieroty, których nikt nigdy nie skasuje.
 *
 * Ścieżek NIE szukamy przez `storage.list()`. Lista jest jednopoziomowa, więc
 * dla układu `<etap>/<pytanie>/<plik>` znaczyłaby kilkadziesiąt wywołań.
 * Wszystkie ścieżki i tak leżą w `stage_answers.value` — to je zapisał
 * formularz załączników.
 *
 * **Błąd tutaj nie przerywa usuwania.** Nieusunięty plik to koszt; nieusunięty
 * startup po kliknięciu „usuń" to złamana obietnica. Trigger z migracji 020
 * i tak posprząta wiersze, więc najgorsze, co zostaje, to bajty bez żadnego
 * odwołania.
 */
export async function purgeStartupFiles(
  supabase: SupabaseClient,
  startupId: string
): Promise<void> {
  try {
    await Promise.all([
      purgeStageFiles(supabase, startupId),
      purgeLogo(supabase, startupId),
    ]);
  } catch (error) {
    console.error("[storage] sprzątanie plików startupu", startupId, error);
  }
}

async function purgeStageFiles(supabase: SupabaseClient, startupId: string) {
  const { data: stages } = await supabase
    .from("startup_stages")
    .select("id")
    .eq("startup_id", startupId);

  const stageIds = (stages ?? []).map((row) => row.id as string);
  if (stageIds.length === 0) return;

  const { data: answers } = await supabase
    .from("stage_answers")
    .select("value")
    .in("startup_stage_id", stageIds);

  const paths: string[] = [];
  for (const row of answers ?? []) {
    // Pole plikowe zapisuje tablicę `{ path, name, size }`. Każdy inny typ
    // odpowiedzi ma w `value` cokolwiek innego, więc filtrujemy po kształcie,
    // a nie po nazwie pytania.
    const value = (row as { value: unknown }).value;
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { path?: unknown }).path === "string"
      ) {
        paths.push((item as { path: string }).path);
      }
    }
  }

  await removeInChunks(supabase, "stage-files", paths);
}

async function purgeLogo(supabase: SupabaseClient, startupId: string) {
  // Logo to jeden plik o stałej nazwie, ale rozszerzenie zależy od formatu,
  // a po zmianie formatu w buckecie zostaje też stary. Jedno wylistowanie
  // folderu jest tu tańsze i pewniejsze niż zgadywanie z `logo_url`.
  const { data } = await supabase.storage.from("startup-logos").list(startupId);
  const paths = (data ?? []).map((file) => `${startupId}/${file.name}`);
  await removeInChunks(supabase, "startup-logos", paths);
}

/** API Storage przyjmuje ograniczoną listę naraz — stąd porcje po 100. */
async function removeInChunks(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
) {
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) console.error(`[storage] ${bucket}`, error.message);
  }
}

/**
 * To samo przy usuwaniu konta.
 *
 * `delete_own_account()` kasuje profil, a kaskada zabiera startupy, w których
 * ta osoba była jedynym Founderem. Triggery z migracji 020 posprzątają wiersze
 * w `storage.objects`, ale bajty zwalnia dopiero API — a po wywołaniu RPC ten
 * człowiek nie ma już ani sesji, ani praw do niczego. Dlatego kasujemy tutaj,
 * ZANIM zniknie konto, i tylko to, co i tak zniknie razem z nim: własny
 * avatar oraz startupy z jedynym Founderem.
 */
export async function purgeOwnAccountFiles(
  supabase: SupabaseClient,
  userId: string,
  soloFounderStartupIds: string[]
): Promise<void> {
  try {
    await Promise.all([
      ...soloFounderStartupIds.map((id) => purgeStartupFiles(supabase, id)),
      (async () => {
        const { data } = await supabase.storage.from("avatars").list(userId);
        await removeInChunks(
          supabase,
          "avatars",
          (data ?? []).map((file) => `${userId}/${file.name}`)
        );
      })(),
    ]);
  } catch (error) {
    console.error("[storage] sprzątanie plików konta", userId, error);
  }
}
