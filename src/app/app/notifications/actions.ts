"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  if (!user) return { error: "Musisz byc zalogowany." };

  const { error } = await supabase.rpc("mark_notifications_read");

  if (error) {
    if (error.message.includes("mark_notifications_read")) {
      return { error: "Brakuje migracji 013 — odpal ja w Supabase → SQL Editor." };
    }
    return { error: error.message };
  }

  revalidatePath("/app/notifications");
  revalidatePath("/app");
  return { error: null };
}
