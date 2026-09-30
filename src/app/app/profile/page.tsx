import { redirect } from "next/navigation";

/**
 * Edycja profilu przeniosła się do /app/settings/profile.
 * Redirect zostaje na stałe — ktoś z zespołu ma ten adres w zakładkach.
 */
export default function LegacyProfilePage() {
  redirect("/app/settings/profile");
}
