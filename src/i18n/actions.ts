"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";

/**
 * Zmiana języka interfejsu.
 *
 * Zapis w dwóch miejscach: ciasteczko (od tej chwili renderuje się w nowym
 * języku) i `profiles.locale` (to samo na innym urządzeniu po zalogowaniu,
 * a powiadomienia i maile do tej osoby idą w jej języku). Gość ma tylko
 * ciasteczko.
 */
export async function setLocale(next: string): Promise<{ error: string | null }> {
  if (!isLocale(next)) {
    const t = await getT("common");
    return { error: t("errors.unknownLanguage") };
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, next, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Bez migracji 049 kolumny nie ma — język i tak działa z ciasteczka,
    // więc błąd zapisu w profilu nie blokuje zmiany.
    await supabase.from("profiles").update({ locale: next }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
  return { error: null };
}
