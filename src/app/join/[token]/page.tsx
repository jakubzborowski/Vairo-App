import type { Metadata } from "next";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { TeamLogo } from "@/components/social/team-logo";
import { Button } from "@/components/ui/button";
import { INVITE_TOKEN_RE } from "@/lib/invites";
import { plural } from "@/lib/utils";
import { JoinActions } from "./join-actions";
import { dismissInvite } from "./actions";

export const metadata: Metadata = { title: "Zaproszenie do teamu — Vairo" };
export const dynamic = "force-dynamic";

type Info = {
  startup_id: string | null;
  startup_name: string | null;
  logo_url: string | null;
  member_count: number | null;
  status: "ok" | "expired" | "revoked" | "used_up" | "inactive" | "not_found";
};

const PROBLEMS: Record<Exclude<Info["status"], "ok">, { title: string; body: string }> = {
  expired: {
    title: "Ten link wygasł",
    body: "Linki zaproszeń działają 7 dni. Poproś osobę, która go wysłała, o nowy.",
  },
  revoked: {
    title: "Ten link został wyłączony",
    body: "Osoba z teamu utworzyła nowy link albo wyłączyła ten. Poproś o aktualny.",
  },
  used_up: {
    title: "Ten link został już wykorzystany",
    body: "Przez jeden link może dołączyć do 10 osób. Poproś o nowy.",
  },
  inactive: {
    title: "Ten team jest teraz nieaktywny",
    body: "Startup został wstrzymany albo zarchiwizowany, więc nie przyjmuje nowych osób.",
  },
  not_found: {
    title: "Nie ma takiego zaproszenia",
    body: "Sprawdź, czy link skopiował się w całości — ma na końcu 64 znaki.",
  },
};

/**
 * Strona zaproszenia. Działa też bez logowania: gość widzi, do jakiego teamu
 * dołącza, zanim założy konto — „zaproszenie od kogoś” bez nazwy teamu
 * wyglądałoby jak spam.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  let info: Info | null = null;
  if (INVITE_TOKEN_RE.test(token)) {
    const { data } = await supabase.rpc("invite_link_info", { p_token: token });
    info = ((Array.isArray(data) ? data[0] : data) as Info | undefined) ?? null;
  }
  const status = info?.status ?? "not_found";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <BrandLogo height={30} priority />
        </div>

        <section className="rounded-[24px] bg-[var(--surface)] px-6 py-7 lift-1">
          {status === "ok" && info ? (
            <>
              <div className="flex items-center gap-3.5">
                <TeamLogo src={info.logo_url} name={info.startup_name} size="lg" />
                <div className="min-w-0">
                  <p className="text-[12.5px] text-[var(--text-subtle)]">Zaproszenie do teamu</p>
                  <h1 className="truncate font-heading text-[1.45rem] font-semibold text-white">
                    {info.startup_name}
                  </h1>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {info.member_count ?? 0}{" "}
                    {plural(info.member_count ?? 0, "osoba", "osoby", "osób")} w teamie
                  </p>
                </div>
              </div>
              <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {user
                  ? "Dołączysz jako Członek: zobaczysz etapy, cele i pliki teamu i będziesz mógł pracować razem z resztą."
                  : "Załóż konto albo zaloguj się — zaraz potem wrócisz tutaj i dołączysz do teamu."}
              </p>
              <JoinActions token={token} mode={user ? "member" : "guest"} />
            </>
          ) : (
            <>
              <h1 className="font-heading text-[1.35rem] font-semibold text-white">
                {PROBLEMS[status === "ok" ? "not_found" : status].title}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {PROBLEMS[status === "ok" ? "not_found" : status].body}
              </p>
              <div className="mt-6">
                {user ? (
                  <form action={dismissInvite}>
                    <Button type="submit" variant="secondary">
                      Przejdź do aplikacji
                    </Button>
                  </form>
                ) : (
                  <Button href="/" variant="secondary">
                    Strona główna
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
