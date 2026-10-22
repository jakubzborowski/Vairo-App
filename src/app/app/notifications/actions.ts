"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";

/**
 * Oznaczenie wszystkiego jako przeczytane.
 *
 * Idzie przez funkcje w bazie, zeby jeden UPDATE objal wszystkie wiersze
 * uzytkownika niezaleznie od tego, ile ich jest.
 */
export async function markAllNotificationsRead(): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };

  const { error } = await supabase.rpc("mark_notifications_read");

  if (error) {
    if (error.message.includes("mark_notifications_read")) {
      return { error: "Brakuje migracji 013 — odpal ją w Supabase → SQL Editor." };
    }
    return { error: translateDbError(error.message) };
  }

  // Licznik dzwonka siedzi w menu bocznym, czyli w layoucie.
  revalidatePath("/app", "layout");
  return { error: null };
}
