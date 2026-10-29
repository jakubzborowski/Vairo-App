import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Zaproszenia do teamu linkiem (migracja 035).
 *
 * Link zna tylko ten, komu go wysłano: token to 64 znaki szesnastkowe.
 * Nowa osoba po rejestracji zawsze trafia najpierw do onboardingu i adres
 * z `?next=` tam przepada — dlatego token czeka w ciasteczku, a layout
 * aplikacji odsyła z powrotem do zaproszenia, gdy onboarding się skończy.
 */
export const INVITE_COOKIE = "vairo_invite";
export const INVITE_TOKEN_RE = /^[0-9a-f]{64}$/;

export type InviteLink = {
  token: string;
  expiresAt: string;
  useCount: number;
  maxUses: number;
};

export type InviteRow = {
  token: string;
  expires_at: string;
  use_count: number;
  max_uses: number;
};

export function toInviteLink(row: InviteRow | null | undefined): InviteLink | null {
  if (!row) return null;
  return {
    token: row.token,
    expiresAt: row.expires_at,
    useCount: row.use_count,
    maxUses: row.max_uses,
  };
}

/** Aktywny link teamu — widoczny tylko dla Foundera i Admina (RLS). */
export async function getActiveInviteLink(
  supabase: SupabaseClient,
  startupId: string
): Promise<InviteLink | null> {
  const { data, error } = await supabase
    .from("startup_invite_links")
    .select("token, expires_at, use_count, max_uses")
    .eq("startup_id", startupId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Bez migracji 035 tabeli nie ma — karta pokaże wtedy „Utwórz link”,
  // a próba utworzenia powie wprost, której migracji brakuje.
  if (error || !data) return null;
  const row = data as InviteRow;
  return row.use_count < row.max_uses ? toInviteLink(row) : null;
}
