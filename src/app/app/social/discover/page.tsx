import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DISCOVER_PATHS } from "@/components/social/discover-screen";

export const dynamic = "force-dynamic";

/**
 * Stary adres Odkrywaj — **już tylko rozjazd.**
 *
 * Talie mieszkają teraz pod `/app/social/people` i `/app/social/teams`, bo
 * zakładka w parametrze była stanem udającym miejsce: nie dało się wysłać
 * komuś linka, który otworzy u niego to samo.
 *
 * Ten plik zostaje z dwóch powodów. Pierwszy: linki z wcześniejszych wersji
 * (`?tab=people`) mają dalej działać. Drugi: w aplikacji jest kilka wejść,
 * które znaczą po prostu „idź do Odkrywaj" — z dashboardu, z powiadomień, po
 * skończeniu kreatora profilu. Tam nie ma dobrej odpowiedzi z góry, więc
 * decyduje `looking_for` z własnego profilu: kto szuka ludzi, trafia do ludzi.
 */
export default async function DiscoverRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string }>;
}) {
  const params = await searchParams;
  const suffix = params.view === "list" ? "?view=list" : "";

  if (params.tab === "people" || params.tab === "teams") {
    redirect(`${DISCOVER_PATHS[params.tab]}${suffix}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/teams");

  const { data } = await supabase
    .from("profiles")
    .select("looking_for")
    .eq("id", user.id)
    .maybeSingle();

  const target =
    (data as { looking_for: string | null } | null)?.looking_for === "collaborators"
      ? DISCOVER_PATHS.people
      : DISCOVER_PATHS.teams;

  redirect(`${target}${suffix}`);
}
