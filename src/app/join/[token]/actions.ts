"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveStartupId } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import { INVITE_COOKIE, INVITE_TOKEN_RE } from "@/lib/invites";

export async function acceptInvite(token: string): Promise<{ error: string | null }> {
  if (!INVITE_TOKEN_RE.test(token)) {
    return { error: "Ten link zaproszenia jest nieaktualny. Poproś osobę, która go wysłała, o nowy." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite_link", { p_token: token });
  if (error) {
    return { error: translateDbError(error.message) ?? "Nie udało się dołączyć do teamu." };
  }

  const jar = await cookies();
  jar.delete(INVITE_COOKIE);
  // Nowy team od razu staje się aktywny — inaczej po dołączeniu człowiek
  // widziałby dashboard swojego poprzedniego startupu i szukał, gdzie jest.
  if (typeof data === "string") await setActiveStartupId(data);
  revalidatePath("/app", "layout");
  redirect("/app/team");
}

export async function dismissInvite() {
  const jar = await cookies();
  jar.delete(INVITE_COOKIE);
  redirect("/app");
}

/** Zapamiętuje zaproszenie na czas rejestracji i onboardingu. */
export async function rememberInviteAndGo(token: string, target: "register" | "login") {
  if (INVITE_TOKEN_RE.test(token)) {
    const jar = await cookies();
    jar.set(INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  redirect(`/${target}?next=${encodeURIComponent(`/join/${token}`)}`);
}
