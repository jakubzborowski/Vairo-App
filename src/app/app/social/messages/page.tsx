import { NoConversationSelected } from "@/components/social/messages-shell";

/**
 * Prawy panel, gdy nie wybrano jeszcze rozmowy.
 *
 * Cała lista siedzi w layoucie, więc ta strona ma do powiedzenia jedno zdanie.
 * Na telefonie w ogóle jej nie widać — tam ten adres pokazuje samą listę,
 * a prawy panel pojawia się dopiero po wejściu w wątek.
 */
export default function MessagesIndexPage() {
  return <NoConversationSelected />;
}
