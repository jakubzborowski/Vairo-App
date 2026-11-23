import type { Metadata } from "next";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { TeamLogo } from "@/components/social/team-logo";
import { Button } from "@/components/ui/button";
import { INVITE_TOKEN_RE } from "@/lib/invites";
import { JoinActions } from "./join-actions";
import { dismissInvite } from "./actions";

import { getT } from "@/i18n/server";
// Link niesie sekret — strona nie może trafić do indeksu (patrz też robots.ts).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("join");
  return { title: t("page.metaTitle"), robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

type Info = {
  startup_id: string | null;
  startup_name: string | null;
  logo_url: string | null;
  member_count: number | null;
  status: "ok" | "expired" | "revoked" | "used_up" | "inactive" | "not_found";
};

// Tytuł i opis problemu z linkiem: słownik `join`, `problem.<status>.title|body`.

/**
 * Strona zaproszenia. Działa też bez logowania: gość widzi, do jakiego teamu
 * dołącza, zanim założy konto — „zaproszenie od kogoś” bez nazwy teamu
 * wyglądałoby jak spam.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT("join");
  const { token } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  let info: Info | null = null;
  if (INVITE_TOKEN_RE.test(token)) {
    const { data } = await supabase.rpc("invite_link_info", { p_token: token });
    info = ((Array.isArray(data) ? data[0] : data) as Info | undefined) ?? null;
  }
  const status = info?.status ?? "not_found";

  // Kto już jest w teamie (np. Founder sprawdzający własny link), nie
  // „dołącza jako Członek” — `accept_invite_link` i tak niczego mu nie zmieni.
  let alreadyMember = false;
  if (user && info?.startup_id) {
    const { data: membership } = await supabase
      .from("startup_members")
      .select("startup_id")
      .eq("startup_id", info.startup_id)
      .eq("profile_id", user.id)
      .maybeSingle();
    alreadyMember = Boolean(membership);
  }

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
                  <p className="text-[12.5px] text-[var(--text-subtle)]">{t("page.zaproszenieDoZespolu")}</p>
                  <h1 className="truncate font-heading text-[1.45rem] font-semibold text-white">
                    {info.startup_name}
                  </h1>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {t("page.memberCount", { count: info.member_count ?? 0 })}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {alreadyMember
                  ? t("page.juzNalezyszDoTego")
                  : user
                  ? t("page.dolaczyszJakoCzlonekZobaczysz")
                  : t("page.zalozKontoAlboZaloguj")}
              </p>
              <JoinActions
                token={token}
                mode={alreadyMember ? "already" : user ? "member" : "guest"}
              />
            </>
          ) : (
            <>
              <h1 className="font-heading text-[1.35rem] font-semibold text-white">
                {t(`problem.${status === "ok" ? "not_found" : status}.title`)}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {t(`problem.${status === "ok" ? "not_found" : status}.body`)}
              </p>
              <div className="mt-6">
                {user ? (
                  <form action={dismissInvite}>
                    <Button type="submit" variant="secondary">
                      {t("page.przejdzDoAplikacji")}
                    </Button>
                  </form>
                ) : (
                  <Button href="/" variant="secondary">
                    {t("page.stronaGlowna")}
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
