"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  if (result.error) return { error: result.error.message, success: null };
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
