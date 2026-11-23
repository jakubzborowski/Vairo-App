import { getT } from "@/i18n/server";
import { dbErrorText } from "@/lib/db-error-keys";

export { dbErrorKey, dbErrorText } from "@/lib/db-error-keys";

/**
 * Tłumacz błędów bazy po stronie serwera — akcje i route handlery.
 * Dopasowania i opis całości: `db-error-keys.ts`. Komponenty klienckie
 * używają `useDbError()` z `use-db-error.ts` (ten plik czyta ciasteczka).
 */
export async function translateDbError(message: string | null | undefined) {
  if (!message) return null;
  return dbErrorText(await getT("errors"), message);
}
