import { redirect } from "next/navigation";

/**
 * Kontakty i zaproszenia mieszkaja teraz w jednej skrzynce.
 *
 * Redirect zostaje na stale: adres mogl juz gdzies trafic, a dwa osobne
 * wejscia do tej samej decyzji byly dla nowej osoby nie do odroznienia.
 */
export default function LegacyConnectionsPage() {
  redirect("/app/social/invites");
}
