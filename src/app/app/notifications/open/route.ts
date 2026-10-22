import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId, setActiveStartupId } from "@/lib/active-team";

/**
 * Wejście w powiadomienie.
 *
 * Zdarzenie z celu albo zadania prowadzi pod `/app/goals/<id>`, a ta strona
 * szuka celu w AKTYWNYM teamie. Ktoś w dwóch teamach, kto klikał
 * powiadomienie z drugiego, trafiał na 404. Tu najpierw przełączamy team
 * (po sprawdzeniu członkostwa — tak jak `switchTeam`), oznaczamy zdarzenie
 * jako przeczytane i dopiero przekierowujemy.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const fallback = new URL("/app/notifications", request.url);
  if (!id) return NextResponse.redirect(fallback);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // RLS oddaje wyłącznie własne powiadomienia.
  const { data: row } = await supabase
    .from("notifications")
    .select("id, href, startup_id, read_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.redirect(fallback);

  if (row.startup_id && row.startup_id !== (await getActiveStartupId())) {
    const { data: membership } = await supabase
      .from("startup_members")
      .select("startup_id")
      .eq("startup_id", row.startup_id)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (membership) await setActiveStartupId(row.startup_id as string);
  }

  if (!row.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  // Tylko adresy wewnątrz aplikacji — `href` pochodzi z triggerów, ale
  // przekierowanie na zewnątrz z naszej domeny to otwarta furtka.
  const href = typeof row.href === "string" ? row.href : "";
  const target = href.startsWith("/app") && !href.startsWith("//") ? href : "/app/notifications";
  return NextResponse.redirect(new URL(target, request.url));
}
