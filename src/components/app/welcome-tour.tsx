"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, FolderOpen, LifeBuoy, Rocket, Route, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

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

type Step = { icon: LucideIcon; key: "welcome" | "stage" | "team" | "work" | "social" | "help"; teamOnly?: boolean };

// Treść kart: słownik `nav`, klucze `tour.<key>.title` i `tour.<key>.body`.
const STEPS: Step[] = [
  { icon: Rocket, key: "welcome" },
  { icon: Route, key: "stage", teamOnly: true },
  { icon: Users, key: "team", teamOnly: true },
  { icon: FolderOpen, key: "work", teamOnly: true },
  { icon: Compass, key: "social" },
  { icon: LifeBuoy, key: "help" },
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
  const t = useT("nav");
  const tc = useT("common");
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
      title={t(`tour.${step.key}.title`)}
      onClose={close}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            {t("tour.skip")}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft className="size-3.5" />
                {tc("actions.back")}
              </Button>
            ) : null}
            {last ? (
              <Button size="sm" onClick={finish}>
                {t("tour.start")}
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
                {tc("actions.next")}
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
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">{t(`tour.${step.key}.body`)}</p>
        {/* Kropki zamiast „2 z 5” — jak w uwagach: nie liczymy, ile zostało. */}
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.key}
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
