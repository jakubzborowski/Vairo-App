"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/db-errors";

/**
 * Funkcje SCORE (044–046) rzucają gotowe zdania po polsku, które mówią, co
 * poprawić („minimum 80 znaków i 12 słów”…). `translateDbError` zamieniłby je
 * na ogólne „coś poszło nie tak”, więc przepuszczamy je — w słowniku UI
 * („zespół”, nie „team”). Techniczne błędy bazy idą przez tłumacza.
 */
function scoreError(error: { message: string; code?: string }) {
  const { message } = error;
  // P0001 = `raise exception` z funkcji SCORE. Zdanie (wielka litera, spacje)
  // to komunikat dla człowieka; kody w stylu `not_authenticated` idą do tłumacza.
  if (error.code === "P0001" && /^[A-ZĄĆĘŁŃÓŚŹŻ][^_]*\s/.test(message)) {
    return message
      .replace(/\bteamu\b/g, "zespołu")
      .replace(/\bteamie\b/g, "zespole")
      .replace(/\bteam\b/g, "zespół");
  }
  return await translateDbError(message) ?? "Coś poszło nie tak. Spróbuj jeszcze raz.";
}

export async function scoreAction(
  _state: { error: string | null; success: string | null },
  form: FormData,
): Promise<{ error: string | null; success: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Zaloguj się ponownie.", success: null };
  const action = form.get("action");
  const result =
    action === "assess"
      ? await supabase.rpc("score_assess", {
          p_kind: String(form.get("kind")),
          p_source: String(form.get("source")),
          p_weight: String(form.get("weight")),
        })
      : action === "thank"
        ? await supabase.rpc("score_thank_message", {
            p_message: String(form.get("source")),
            p_kind: String(form.get("kind")),
          })
        : action === "review-goal"
          ? await supabase.rpc("score_review_goal", {
              p_goal: String(form.get("source")),
              p_note: String(form.get("note")),
              p_expected: String(form.get("expected")),
            })
          : action === "review-program"
            ? await supabase.rpc("score_review_program", {
                p_claim: String(form.get("source")),
                p_note: String(form.get("note")),
                p_expected: String(form.get("expected")),
              })
            : { error: { message: "Nieznana akcja." } };
  if (result.error) return { error: scoreError(result.error), success: null };
  revalidatePath("/app/score");
  return {
    error: null,
    success:
      action === "assess"
        ? "Skala zapisana. SCORE wymaga jeszcze niezależnej akceptacji ukończonej pracy."
        : action === "thank"
          ? "Potwierdzenie zapisane. Nagroda autora jest naliczona lub czeka w kolejce dziennego limitu."
          : "Wynik zaakceptowany. Nagrody są naliczone lub widoczne w kolejce dziennego limitu.",
  };
}
