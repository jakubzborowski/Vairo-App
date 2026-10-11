"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { NotificationKind } from "@/lib/notifications";

/**
 * Powiadomienia na żywo.
 *
 * Do tej pory o zaproszeniu albo odpowiedzi można się było dowiedzieć dopiero
 * po przeładowaniu strony. W aplikacji, której cała wartość polega na tym, że
 * ktoś się odezwie, to jest najgorsze możliwe miejsce na ciszę — człowiek
 * wysyła zaczepkę, siedzi na ekranie i nie wie, czy coś się dzieje.
 *
 * Komponent nasłuchuje wstawień do `notifications` **dla własnego wiersza**
 * i robi dwie rzeczy: pokazuje toast i odświeża trasę, żeby licznik przy
 * dzwonku się przeliczył.
 *
 * Trzy rzeczy warte zapisania:
 *
 *   • **Filtr `profile_id=eq.<ja>` nie jest zabezpieczeniem, tylko
 *     oszczędnością.** Realtime respektuje RLS, więc polityka
 *     `notifications_select_own` i tak nie przepuści cudzych wierszy. Filtr
 *     zmniejsza tylko ruch.
 *   • **Treść składamy z `kind`, nie dociągamy nazwiska.** Wiersz nie niesie
 *     imienia nadawcy (celowo — patrz `notifications.ts`), a dodatkowe
 *     zapytanie przy każdym zdarzeniu to koszt bez pokrycia. „Ktoś chce się
 *     z Tobą skontaktować" jest prawdziwe; pełne zdanie z imieniem czeka na
 *     liście powiadomień.
 *   • **Kanał sprzątamy w `return`.** Bez tego każda nawigacja zostawia
 *     otwarte połączenie i po kilku przejściach ten sam toast pojawia się
 *     kilka razy.
 */
export function LiveNotifications({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  // `toast` i `router` w tablicy zależności restartowałyby subskrypcję przy
  // każdym renderze. Trzymamy je w refie i **aktualizujemy w efekcie**, nie
  // w trakcie renderu — zapis do refa podczas renderowania jest w Reakcie
  // błędem, bo render musi być czysty.
  const handlers = useRef({ toast, router });

  useEffect(() => {
    handlers.current = { toast, router };
  }, [toast, router]);

  useEffect(() => {
    if (!profileId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            kind: NotificationKind;
            preview: string | null;
          };

          handlers.current.toast({
            tone: "info",
            title: liveTitle(row.kind),
            description: row.preview ?? undefined,
          });
          handlers.current.router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profileId]);

  return null;
}

/**
 * Zdanie bez imienia nadawcy — wiersz powiadomienia go nie niesie.
 *
 * Świadomie NIE pytamy bazy o nazwisko przy każdym zdarzeniu: pełne zdanie
 * („Kuba chce się z Tobą skontaktować") czeka na liście powiadomień, a toast
 * ma powiedzieć, że coś przyszło i czego dotyczy.
 */
function liveTitle(kind: NotificationKind) {
  switch (kind) {
    case "contact_received":
      return "Ktoś chce się z Tobą skontaktować";
    case "contact_accepted":
      return "Kontakt przyjęty — możecie rozmawiać";
    case "message_received":
      return "Nowa wiadomość";
    case "join_application":
      return "Nowe zgłoszenie do teamu";
    case "join_invite":
      return "Zaproszenie do teamu";
    case "join_accepted":
      return "Zgłoszenie przyjęte";
    case "join_declined":
      return "Zgłoszenie odrzucone";
    default:
      return "Nowe zdarzenie";
  }
}
