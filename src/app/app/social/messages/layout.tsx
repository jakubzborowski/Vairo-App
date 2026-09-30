import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadConversations } from "@/lib/messages";
import { MessagesShell } from "@/components/social/messages-shell";

export const metadata = { title: "Wiadomości — Vairo" };
export const dynamic = "force-dynamic";

/**
 * Lista rozmow żyje w layoucie, nie na stronie — dzięki temu przy przejściu
 * między wątkami lewy panel się NIE przeładowuje. To nie jest optymalizacja,
 * tylko warunek, żeby układ w ogóle czytał się jak komunikator: lista, która
 * mrugnęłaby przy każdym kliknięciu, jest znowu dwoma ekranami.
 */
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/messages");

  const { conversations, error } = await loadConversations(supabase, user.id);

  return (
    <MessagesShell conversations={conversations} error={error}>
      {children}
    </MessagesShell>
  );
}
