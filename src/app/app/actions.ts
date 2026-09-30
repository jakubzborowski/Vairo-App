"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveStartupId } from "@/lib/active-team";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Przełączenie aktywnego teamu.
 *
 * Zapisuje wybór w ciasteczku, bo layout `/app` — który renderuje switcher —
 * nie ma dostępu do `searchParams`. Sprawdzamy członkostwo, żeby podmiana
 * ciasteczka w przeglądarce nie dała wglądu w cudzy workspace.
 */
export async function switchTeam(startupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany." };

  const { data: membership } = await supabase
    .from("startup_members")
    .select("startup_id")
    .eq("startup_id", startupId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!membership) return { error: "Nie należysz do tego teamu." };

  await setActiveStartupId(startupId);

  revalidatePath("/app", "layout");
  return { error: null };
}
