"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { missingMigration, sessionExpired } from "@/lib/server-errors";

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

  if (!user) return { error: await sessionExpired() };

  const { error } = await supabase.rpc("mark_notifications_read");

  if (error) {
    if (error.message.includes("mark_notifications_read")) {
      return { error: await missingMigration("013") };
    }
    return { error: await translateDbError(error.message) };
  }

  // Licznik dzwonka siedzi w menu bocznym, czyli w layoucie.
  revalidatePath("/app", "layout");
  return { error: null };
}
