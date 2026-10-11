import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Kasowanie plików ze Storage przy usuwaniu startupu i konta.
 *
 * **To jest JEDYNE miejsce, które kasuje pliki.** SQL nie może: Supabase
 * blokuje każdy DELETE na tabelach Storage (`storage.protect_delete()`,
 * „Use the Storage API instead"). Pierwsza wersja migracji 020 próbowała
 * sprzątać triggerami i właśnie na tym się wywaliła — a gdyby triggery
 * weszły, blokowałyby usuwanie startupów i kont. Szczegóły w samej 020.
 *
 * **Gdzie aplikacja zapisuje pliki** — i każde z tych miejsc jest tu obsłużone:
 *
 *   avatars        <profile_id>/avatar.<ext>                   (profil)
 *   startup-logos  <startup_id>/logo.<ext>                     (team)
 *   stage-files    <startup_stage_id>/<answer_key>/<plik>      (odpowiedzi w etapie)
 *   stage-files    <startup_id>/library/<plik>                 (biblioteka, od Preparation)
 *
 * Nowe miejsce zapisu pliku = nowy wiersz w tej tabeli i nowa gałąź niżej.
 * Biblioteka była przez chwilę poza tą listą: leży w tym samym buckecie co
 * odpowiedzi, ale pod id startupu, więc sprzątanie po id etapów jej nie
 * widziało.
 *
 * Kolejność jest istotna: **najpierw pliki, potem wiersz startupu.** Póki
 * startup istnieje, Founder jest jego członkiem i RLS na buckecie go
 * przepuszcza. Po usunięciu wiersza `can_access_stage()` i
 * `is_startup_member()` nie mają już czego znaleźć — ten sam człowiek traci
 * prawo do własnych plików i zostają sieroty, których nikt nie skasuje
 * inaczej niż ręcznie w panelu.
 *
 * **Błąd tutaj nie przerywa usuwania.** Nieusunięty plik to koszt i wiersz
 * w liście sierot (`SPRAWDZ_MIGRACJE.sql`); nieusunięty startup po kliknięciu
 * „usuń" to złamana obietnica.
 */
export async function purgeStartupFiles(
  supabase: SupabaseClient,
  startupId: string
): Promise<void> {
  try {
    await Promise.all([
      purgeStageFiles(supabase, startupId),
      purgeFolder(supabase, "stage-files", `${startupId}/library`),
      purgeFolder(supabase, "startup-logos", startupId),
    ]);
  } catch (error) {
    console.error("[storage] sprzątanie plików startupu", startupId, error);
  }
}

/**
 * Załączniki z odpowiedzi w etapach.
 *
 * Ścieżek NIE szukamy przez `storage.list()`. Układ ma dwa poziomy
 * (`<etap>/<pytanie>/<plik>`), a lista jest jednopoziomowa, więc znaczyłoby to
 * osobne wywołanie na każde pytanie. Wszystkie ścieżki i tak leżą
 * w `stage_answers.value` — zapisał je formularz załączników.
 */
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

  const prefixes = stageIds.map((id) => `${id}/`);
  const paths = new Set<string>();
  for (const row of answers ?? []) {
    collectPaths((row as { value: unknown }).value, prefixes, paths);
  }

  await removeInChunks(supabase, "stage-files", [...paths]);
}

/**
 * Wszystkie `path` z odpowiedzi — na DOWOLNEJ głębokości.
 *
 * Zwykłe pole plikowe zapisuje tablicę `{ path, name, size }`, ale bloczki
 * z Preparation trzymają pole plikowe wewnątrz powtarzanej pozycji, więc
 * ścieżka siedzi poziom albo dwa niżej. Czytanie tylko najwyższego poziomu
 * gubiło takie pliki po cichu.
 *
 * Bierzemy wyłącznie ścieżki pod id etapów tego startupu. Tekst z polem
 * `path` w odpowiedzi, który akurat nie jest plikiem, nie trafi do `remove()`.
 */
function collectPaths(value: unknown, prefixes: string[], out: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) collectPaths(item, prefixes, out);
    return;
  }
  if (!value || typeof value !== "object") return;

  const path = (value as { path?: unknown }).path;
  if (typeof path === "string" && prefixes.some((prefix) => path.startsWith(prefix))) {
    out.add(path);
  }
  for (const nested of Object.values(value)) collectPaths(nested, prefixes, out);
}

/**
 * Wszystkie pliki z jednego folderu (bez podfolderów).
 *
 * `list()` oddaje domyślnie 100 pozycji, więc bez stronicowania biblioteka
 * ze 101 plikami zostawiałaby jeden w buckecie. Logo i avatar mają po kilka
 * plików (stare rozszerzenia po zmianie formatu), ale idą tą samą drogą —
 * jedno wylistowanie jest pewniejsze niż zgadywanie rozszerzenia z adresu.
 */
async function purgeFolder(supabase: SupabaseClient, bucket: string, folder: string) {
  const PAGE = 1000;
  const paths: string[] = [];

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: PAGE, offset });
    if (error) {
      console.error(`[storage] ${bucket}/${folder}`, error.message);
      break;
    }
    // Podfoldery wracają jako wpisy bez `id` — tu ich nie ma czego kasować.
    for (const entry of data ?? []) {
      if (entry.id) paths.push(`${folder}/${entry.name}`);
    }
    if (!data || data.length < PAGE) break;
  }

  await removeInChunks(supabase, bucket, paths);
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
 * ta osoba była jedynym Founderem. Po wywołaniu RPC ten człowiek nie ma już
 * ani sesji, ani praw do niczego — a SQL plików skasować nie może. Dlatego
 * kasujemy tutaj, ZANIM zniknie konto, i tylko to, co i tak zniknie razem
 * z nim: własny avatar oraz startupy z jedynym Founderem.
 */
export async function purgeOwnAccountFiles(
  supabase: SupabaseClient,
  userId: string,
  soloFounderStartupIds: string[]
): Promise<void> {
  try {
    await Promise.all([
      ...soloFounderStartupIds.map((id) => purgeStartupFiles(supabase, id)),
      purgeFolder(supabase, "avatars", userId),
    ]);
  } catch (error) {
    console.error("[storage] sprzątanie plików konta", userId, error);
  }
}
