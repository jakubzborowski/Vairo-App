"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dyktowanie do pola tekstowego — rozpoznawanie mowy wbudowane w przeglądarkę
 * (Web Speech API, język polski).
 *
 * Dlaczego nie Handy (handy.computer): to program na komputer, który wkleja
 * tekst w dowolne pole przez skrót klawiszowy — nie da się go wbudować
 * w stronę na Vercelu. Kto go ma, może z niego korzystać w Vairo bez niczego.
 *
 * Działa w Chrome, Edge i Safari. Firefox tego API nie ma — wtedy przycisku
 * po prostu nie ma, zamiast przycisku, który nic nie robi. Uwaga: Chrome
 * wysyła dźwięk do rozpoznania na serwery Google, Safari — Apple.
 */

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const subscribeNoop = () => () => {};

export function DictationButton({
  onText,
  disabled,
}: {
  onText: (text: string) => void;
  disabled?: boolean;
}) {
  const supported = useSyncExternalStore(subscribeNoop, () => Boolean(recognitionCtor()), () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  // Najświeższy callback bez restartu nasłuchu przy każdej literze.
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => recognition.current?.abort(), []);

  if (!supported) return null;

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pl-PL";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) text += result[0].transcript;
      }
      if (text.trim()) onTextRef.current(text.trim());
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Przeglądarka nie ma dostępu do mikrofonu. Zezwól na niego w ustawieniach strony (ikona kłódki obok adresu)."
          : "Dyktowanie się przerwało. Spróbuj jeszcze raz."
      );
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Nie udało się włączyć mikrofonu. Spróbuj jeszcze raz.");
    }
  };

  const stop = () => recognition.current?.stop();

  return (
    <div className="mt-1.5 flex flex-wrap items-center justify-end gap-2">
      {error ? <p className="text-[12px] text-[var(--danger-text)]">{error}</p> : null}
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-pressed={listening}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] transition-colors disabled:opacity-50",
          listening
            ? "bg-[var(--danger)]/15 text-[var(--danger-text)]"
            : "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        {listening ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-[var(--danger)]" aria-hidden="true" />
            <Square className="size-3" aria-hidden="true" />
            Zatrzymaj
          </>
        ) : (
          <>
            <Mic className="size-3.5" aria-hidden="true" />
            Dyktuj
          </>
        )}
      </button>
    </div>
  );
}

/** Dokleja podyktowany tekst do odpowiedzi, z odstępem i z limitem pola. */
export function appendDictation(current: unknown, text: string, max?: number) {
  const base = typeof current === "string" ? current : "";
  const glue = base && !/\s$/.test(base) ? " " : "";
  const next = base + glue + text;
  return max ? next.slice(0, max) : next;
}
