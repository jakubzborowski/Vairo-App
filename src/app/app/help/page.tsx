import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/ui/module-header";
import { HelpFeedback } from "@/components/support/help-feedback";
import { OpenTourButton } from "@/components/support/open-tour-button";
import { isSupportKind, publicSupportEmail, safeErrorCode, safeFromPath } from "@/types/support";

import { getT } from "@/i18n/server";
export async function generateMetadata() {
  const t = await getT("help");
  return { title: t("page.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Pomoc i opinie — droga kontaktu z zespołem Vairo z wnętrza aplikacji.
 *
 * Wejście jest zawsze na wierzchu menu (nie w menu ⋮), w samouczku, na
 * ekranie błędu i w onboardingu. Kto tu trafia, zwykle ma problem TERAZ —
 * więc formularz stoi pierwszy, a szybkie odpowiedzi pod nim.
 *
 * Aplikacja nie prowadzi ticketów: zgłoszenie idzie mailem do skrzynki
 * zespołu, odpowiedź wraca mailem do autora (migracja 043, `help/actions.ts`).
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; kind?: string; code?: string }>;
}) {
  const t = await getT("help");
  const user = await getCurrentUser();
  if (!user) redirect("/register?next=/app/help");

  const params = await searchParams;
  const from = safeFromPath(params.from);
  const initialKind = isSupportKind(params.kind) ? params.kind : null;
  const errorCode = safeErrorCode(params.code);
  const directEmail = publicSupportEmail();

  return (
    <div className="page">
      <ModuleHeader
        title={t("page.pomocIOpinie")}
        subtitle={t("page.cosNieDzialaCzegos")}
      />

      <section className="mt-6 rounded-2xl bg-[var(--surface)] px-5 py-5 lift-1 sm:px-6">
        <h2 className="mb-4 font-heading text-[17px] font-semibold text-white">{t("page.napiszDoNas")}</h2>
        <HelpFeedback from={from} initialKind={initialKind} errorCode={errorCode} />
      </section>

      {directEmail ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[13px] text-[var(--text-subtle)]">
          <Mail className="size-3.5" aria-hidden="true" />
          {t("page.woliszZwyklegoMailaNapisz")}
          <a
            href={`mailto:${directEmail}`}
            className="text-[var(--text-muted)] underline underline-offset-2 hover:text-white"
          >
            {directEmail}
          </a>
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          {t("page.szybkieOdpowiedzi")}
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((item) => (
            <details
              key={item.id}
              className="group rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-1 open:pb-4"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {t(`faq.${item.id}.q`)}
                <ChevronDown
                  className="size-4 shrink-0 text-[var(--text-subtle)] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                {t(`faq.${item.id}.a`)}{" "}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-white underline underline-offset-2 hover:text-[var(--vairo)]"
                  >
                    {t.maybe(`faq.${item.id}.link`, "")}
                  </Link>
                ) : null}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <OpenTourButton />
          <Button href="/app/program" variant="ghost" size="sm">
            {t("page.jakDzialaVairo")}
          </Button>
        </div>
      </section>
    </div>
  );
}

/**
 * Teksty: słownik `help`, `faq.<id>.q|a|link`.
 *
 * Odpowiedzi na pytania, które padają najczęściej. Każda kończy się linkiem
 * do miejsca, w którym to się robi — opis bez drogi tylko odsyła dalej.
 */
const FAQ: { id: "start" | "leave" | "invite" | "edit" | "privacy" | "delete"; href?: string }[] = [
  { id: "start", href: "/app/stage" },
  { id: "leave" },
  { id: "invite", href: "/app/team#zaproszenie" },
  { id: "edit", href: "/app/team" },
  { id: "privacy", href: "/app/social/me" },
  { id: "delete", href: "/app/settings/account" },
];
