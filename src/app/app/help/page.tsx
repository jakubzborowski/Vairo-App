import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/ui/module-header";
import { HelpFeedback } from "@/components/support/help-feedback";
import { OpenTourButton } from "@/components/support/open-tour-button";
import { isSupportKind, publicSupportEmail, safeErrorCode, safeFromPath } from "@/types/support";

export const metadata = { title: "Pomoc i opinie — Vairo" };
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
        title="Pomoc i opinie"
        subtitle="Coś nie działa, czegoś nie rozumiesz albo masz pomysł? Napisz swoimi słowami. Czyta to zespół Vairo, a odpowiedź przychodzi mailem."
      />

      <section className="mt-6 rounded-2xl bg-[var(--surface)] px-5 py-5 lift-1 sm:px-6">
        <h2 className="mb-4 font-heading text-[17px] font-semibold text-white">Napisz do nas</h2>
        <HelpFeedback from={from} initialKind={initialKind} errorCode={errorCode} />
      </section>

      {directEmail ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[13px] text-[var(--text-subtle)]">
          <Mail className="size-3.5" aria-hidden="true" />
          Wolisz zwykłego maila? Napisz na{" "}
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
          Szybkie odpowiedzi
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-1 open:pb-4"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-[var(--text-subtle)] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                {item.a}{" "}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-white underline underline-offset-2 hover:text-[var(--vairo)]"
                  >
                    {item.link}
                  </Link>
                ) : null}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <OpenTourButton />
          <Button href="/app/program" variant="ghost" size="sm">
            Jak działa Vairo
          </Button>
        </div>
      </section>
    </div>
  );
}

/**
 * Odpowiedzi na pytania, które padają najczęściej. Każda kończy się linkiem
 * do miejsca, w którym to się robi — opis bez drogi tylko odsyła dalej.
 */
const FAQ: { q: string; a: string; href?: string; link?: string }[] = [
  {
    q: "Od czego zacząć?",
    a: "Wejdź w „Etap startupu”. Widzisz tam zawsze jedno zadanie — odpowiadasz, zapisujesz, a kolejne otwiera się samo. Na pytanie, na które nie znasz odpowiedzi, można wrócić później.",
    href: "/app/stage",
    link: "Przejdź do etapu",
  },
  {
    q: "Czy coś przepada, gdy wyjdę w połowie?",
    a: "Nie. Każda odpowiedź zapisuje się osobno, w chwili kliknięcia „Zapisz”. Możesz zamknąć kartę i wrócić za tydzień.",
  },
  {
    q: "Jak zaprosić kogoś do zespołu?",
    a: "W zakładce Zespół Founder albo Admin tworzy link zaproszenia. Osoba z linkiem nie musi mieć konta — po rejestracji trafia prosto do Was jako Członek.",
    href: "/app/team#zaproszenie",
    link: "Otwórz Zespół",
  },
  {
    q: "Kto może zmieniać odpowiedzi w etapach?",
    a: "Founder i Admin. Członek widzi wszystko, ale tylko czyta. Rolę zmienia Founder albo Admin w składzie zespołu — stanowisko (np. CTO) nie daje żadnych uprawnień.",
    href: "/app/team",
    link: "Skład zespołu",
  },
  {
    q: "Czy obcy widzą odpowiedzi z etapów?",
    a: "Nie. Poza zespół wychodzi tylko to, co świadomie wpisujesz na profil publiczny. Etap walidacji widać na karcie zespołu wyłącznie za zgodą Foundera.",
    href: "/app/social/me",
    link: "Mój profil publiczny",
  },
  {
    q: "Jak usunąć konto albo startup?",
    a: "Konto usuwa się w Ustawieniach → Konto. Startup usuwa Founder na stronie profilu publicznego zespołu, w sekcji „Zaawansowane”. Oba kroki wymagają potwierdzenia — nic nie znika jednym kliknięciem.",
    href: "/app/settings/account",
    link: "Ustawienia konta",
  },
];
