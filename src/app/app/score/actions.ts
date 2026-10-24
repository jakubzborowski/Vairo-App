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
        : { error: { message: "Nieznana akcja." } };
  if (result.error) return { error: result.error.message, success: null };
  revalidatePath("/app/score");
  return {
    error: null,
    success:
      action === "assess"
        ? "Skala zapisana. Punkty po ukończeniu celu z dowodem."
        : "Potwierdzenie zapisane. Autor otrzymał reputację.",
  };
}
