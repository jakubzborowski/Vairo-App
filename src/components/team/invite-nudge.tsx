"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { UserPlus, Users, X } from "lucide-react";
import { plural } from "@/lib/utils";

export type TeamNudgeData = {
  /** Founder albo Admin — tylko oni tworzą link zaproszenia. */
  canInvite: boolean;
  members: number;
  /** Czy jest aktywny link, z którego nikt jeszcze nie dołączył. */
  hasLink: boolean;
};

const subscribeNoop = () => () => {};
const DISMISS_KEY = "vairo:invite-nudge:start";

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Zachęta do zaproszenia znajomego — w dwóch momentach z „Vairo rozwój
 * socialu”: na początku Idea Stage (`start`) i przy punkcie o zespole
 * i potrzebnej pomocy w Preparation (`help`).
 *
 * Mówi o tym, co jest teraz: kto buduje sam, dostaje link; kto ma już
 * aktywny link, słyszy, że czeka na wysłanie; kto ma zespół — przy pomocy
 * dostaje otwarte role i „Szukam ludzi”, a na starcie Idei nic.
 * Celowo bez pomarańczu: akcją główną ekranu jest odpowiedź w etapie.
 */
export function InviteNudge({ data, variant }: { data: TeamNudgeData; variant: "start" | "help" }) {
  const dismissedStored = useSyncExternalStore(subscribeNoop, readDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);

  if (!data.canInvite) return null;
  const alone = data.members <= 1;
  if (variant === "start" && (!alone || dismissed || dismissedStored)) return null;

  const text =
    variant === "help" && !alone
      ? `W teamie ${plural(data.members, "jest", "są", "jest")} ${data.members} ${plural(data.members, "osoba", "osoby", "osób")}. Brakuje kogoś z konkretną umiejętnością? Dodaj otwartą rolę — team pojawi się w Odkrywaj — albo poszukaj w „Szukam ludzi”.`
      : data.hasLink
        ? "Link zaproszenia jest gotowy, ale nikt jeszcze z niego nie dołączył. Wyślij go komuś, z kim chcesz to budować — np. na Messengerze."
        : variant === "help"
          ? "Pomoc często jest bliżej, niż się wydaje. Zaproś znajomego linkiem — nie musi mieć jeszcze konta w Vairo."
          : "Walidację łatwiej przejść w kilka osób: ktoś zada pytanie, którego nie widać od środka. Zaproś znajomego linkiem — nie musi mieć jeszcze konta w Vairo.";

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Bez localStorage zachęta wróci przy następnym wejściu — to nie szkodzi.
    }
  };

  return (
    <div className="mt-4 flex max-w-3xl items-start gap-3 rounded-xl border border-white/10 bg-[var(--surface)] px-4 py-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--text-muted)]">
        {variant === "help" && !alone ? <Users className="size-4" /> : <UserPlus className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">{text}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-medium">
          {variant === "help" && !alone ? (
            <>
              <Link href="/app/team#otwarte-role" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Dodaj otwartą rolę
              </Link>
              <Link href="/app/social/people" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Szukam ludzi
              </Link>
            </>
          ) : (
            <Link href="/app/team#zaproszenie" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              {data.hasLink ? "Skopiuj link zaproszenia" : "Zaproś znajomego"}
            </Link>
          )}
        </div>
      </div>
      {variant === "start" ? (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ukryj zachętę"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
