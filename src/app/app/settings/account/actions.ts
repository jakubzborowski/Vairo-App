"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TEAM_COOKIE } from "@/lib/active-team";

type Result = { error: string | null };

/**
 * Usunięcie własnego konta.
 *
 * Kasowanie idzie przez funkcję w bazie, bo `auth.users` nie jest dostępne
 * dla zwykłej roli. Funkcja bierze `auth.uid()` z tokenu, nie z parametru,
 * więc nie da się przez nią usunąć cudzego konta.
 *
 * Potwierdzeniem jest przepisanie adresu e-mail. To jedyna operacja, po której
 * nie ma czego przywrócić, więc potwierdzenie musi wymagać uwagi, a nie
 * jednego kliknięcia w odruchu.
 */
export async function deleteOwnAccount(confirmEmail: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany." };

  const expected = (user.email ?? "").trim().toLowerCase();
  if (!expected) {
    return { error: "Konto nie ma adresu e-mail — usuń je w panelu Supabase." };
  }
  if (confirmEmail.trim().toLowerCase() !== expected) {
    return { error: "Wpisany adres nie zgadza się z adresem tego konta." };
  }

  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    if (error.message.includes("delete_own_account")) {
      return {
        error: "Brakuje migracji 015 — odpal ją w Supabase → SQL Editor.",
      };
    }
    if (/permission denied/i.test(error.message)) {
      return {
        error:
          "Baza nie pozwala usunąć konta z aplikacji. Konto trzeba skasować w panelu: Supabase → Authentication → Users.",
      };
    }
    return { error: error.message };
  }

  // Token jeszcze chwilę żyje, więc czyścimy sesję od razu. Bez tego user
  // wędrowałby po aplikacji z ciasteczkiem konta, którego już nie ma.
  await supabase.auth.signOut();

  const store = await cookies();
  store.delete(ACTIVE_TEAM_COOKIE);

  return { error: null };
}
