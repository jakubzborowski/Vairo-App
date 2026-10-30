"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, FolderOpen, Rocket, Target, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/**
 * Samouczek przy pierwszym wejściu — uwaga z redesignu: „musimy koniecznie
 * dodać onboarding, tutorial, który przechodzi z użytkownikiem przez
 * wszystkie rzeczy i tłumaczy”. Maskotka i „asystent” przyjdą później;
 * karty są pisane tak, żeby dało się je potem włożyć w jej usta.
 *
 * Widoczność pamięta przeglądarka (localStorage). Ponownie otwiera go
 * „Samouczek” w menu konta — zdarzeniem, bez przeładowania strony.
 */

export const OPEN_TOUR_EVENT = "vairo:open-tour";
const SEEN_KEY = "vairo:welcome-tour:v1";

type Step = { icon: LucideIcon; title: string; body: string; teamOnly?: boolean };

const STEPS: Step[] = [
  {
    icon: Rocket,
    title: "Witaj w Vairo",
    body: "Vairo prowadzi Cię od pomysłu do pierwszych klientów — etap po etapie. W minutę pokażemy, co gdzie jest.",
  },
  {
    icon: Target,
    title: "Etap startupu",
    body: "Tu pracujesz nad pomysłem. Widzisz jedno zadanie naraz: odpowiadasz, zapisujesz, a kolejne otwiera się samo. Pytanie, na które nie znasz odpowiedzi, możesz pominąć i wrócić do niego później.",
    teamOnly: true,
  },
  {
    icon: Users,
    title: "Team",
    body: "Startupy buduje się w kilka osób. Zaproś znajomych linkiem — nie muszą mieć jeszcze konta w Vairo.",
    teamOnly: true,
  },
  {
    icon: FolderOpen,
    title: "Praca zespołu",
    body: "Dokumenty i pliki zespołu w jednym miejscu. Gdy przejdziecie dalej w programie, dojdą tu cele i zadania.",
    teamOnly: true,
  },
  {
    icon: Compass,
    title: "Social",
    body: "„Szukam projektu” i „Szukam ludzi” to karty, które przeglądasz jedna po drugiej. Na swojej karcie możesz używać pseudonimu — imię z konta widzi tylko Twój team.",
  },
];

const subscribeNoop = () => () => {};
function readSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Bez localStorage nie pokazujemy samouczka na siłę przy każdym wejściu.
    return true;
  }
}

export function WelcomeTour({ hasTeam }: { hasTeam: boolean }) {
  const router = useRouter();
  const seen = useSyncExternalStore(subscribeNoop, readSeen, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const open = () => {
      setIndex(0);
      setReopened(true);
    };
    window.addEventListener(OPEN_TOUR_EVENT, open);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, open);
  }, []);

  const open = reopened || (!seen && !dismissed);
  if (!open) return null;

  const steps = STEPS.filter((step) => hasTeam || !step.teamOnly);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const last = index >= steps.length - 1;
  const Icon = step.icon;

  const close = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // jw.
    }
    setDismissed(true);
    setReopened(false);
  };

  const finish = () => {
    close();
    router.push(hasTeam ? "/app/stage" : "/app/social/teams");
  };

  return (
    <Modal
      title={step.title}
      onClose={close}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            Pomiń
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft className="size-3.5" />
                Wstecz
              </Button>
            ) : null}
            {last ? (
              <Button size="sm" onClick={finish}>
                Zaczynam
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
                Dalej
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-start gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.06] text-white">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">{step.body}</p>
        {/* Kropki zamiast „2 z 5” — jak w uwagach: nie liczymy, ile zostało. */}
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/20"
              )}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
