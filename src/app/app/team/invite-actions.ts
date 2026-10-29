"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";
import { toInviteLink, type InviteLink, type InviteRow } from "@/lib/invites";

type LinkResult = { link: InviteLink | null; error: string | null };

/** Nowy link zaproszenia. Poprzedni przestaje działać (pilnuje tego baza). */
export async function createInviteLink(startupId: string): Promise<LinkResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invite_link", { p_startup: startupId });
  if (error) {
    return { link: null, error: translateDbError(error.message) ?? "Nie udało się utworzyć linku." };
  }
  const row = (Array.isArray(data) ? data[0] : data) as InviteRow | undefined;
  revalidatePath("/app/team");
  return { link: toInviteLink(row), error: null };
}

/** Wyłącza aktywny link — ktoś, kto go ma, już nie dołączy. */
export async function revokeInviteLinks(startupId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite_links", { p_startup: startupId });
  if (error) {
    return { error: translateDbError(error.message) ?? "Nie udało się wyłączyć linku." };
  }
  revalidatePath("/app/team");
  return { error: null };
}
