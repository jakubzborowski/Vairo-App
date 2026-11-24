import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { loadContactSignals, loadConversations } from "@/lib/messages";
import { MessagesShell } from "@/components/social/messages-shell";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("social");
  return { title: t("messages.metaTitle") };
}
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
  const user = await getCurrentUser();

  if (!user) redirect("/register?next=/app/social/messages");

  // Wysłane zaczepki, na które nikt jeszcze nie odpowiedział. To pierwsza
  // wiadomość do kogoś, więc jej miejsce jest tutaj, a nie w Zaproszeniach —
  // tam szukało się jej jak zaproszenia, którym nie jest.
  const [{ conversations, error }, { signals }] = await Promise.all([
    loadConversations(supabase, user.id),
    loadContactSignals(supabase, user.id),
  ]);
  const pending = signals.filter((signal) => signal.canWithdraw);

  return (
    <MessagesShell conversations={conversations} pending={pending} error={error}>
      {children}
    </MessagesShell>
  );
}
