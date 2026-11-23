"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n/client";
import { LOCALE_TAGS } from "@/i18n/config";

/**
 * „Nagraj głosem” przy polu tekstowym. Rozpoznany tekst jest DOPISYWANY
 * (`onText`), nigdy nie nadpisuje tego, co już jest — sklejanie robi
 * `appendDictation()`.
 *
 * Dwa tryby, wybierane automatycznie:
 *   1. Web Speech API (Chrome, Edge, Safari) — rozpoznaje przeglądarka,
 *      bez serwera i kosztów. Do pola trafiają tylko wyniki `isFinal`.
 *   2. Nagranie (MediaRecorder) → /api/transcribe → Groq Whisper — dla
 *      Firefoksa i Brave. Brave ma obiekt SpeechRecognition, ale usługa
 *      Google jest w nim zablokowana (błąd `network`), więc od razu idzie
 *      tym trybem; ten sam błąd w innej przeglądarce też przełącza na nagranie.
 *
 * Mikrofon wymaga `Permissions-Policy: microphone=(self)` (next.config.ts).
 */

type Mode = "speech" | "recorder" | "none";
type Status = "idle" | "listening" | "recording" | "processing";

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

/** Najdłuższe nagranie w trybie serwerowym — chroni limit Groq i rozmiar pliku. */
const MAX_RECORDING_SECONDS = 120;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function detectMode(): Mode {
  const isBrave = typeof (navigator as unknown as { brave?: unknown }).brave !== "undefined";
  if (!isBrave && recognitionCtor()) return "speech";
  if (typeof window.MediaRecorder !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
    return "recorder";
  }
  return "none";
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(type: string): string {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "mp4";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  return "webm";
}


const subscribeNoop = () => () => {};

export function VoiceButton({
  onText,
  disabled,
  className,
}: {
  onText: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT("common");
  const locale = useLocale();
  const detected = useSyncExternalStore(subscribeNoop, detectMode, () => "none" as Mode);
  const [forceRecorder, setForceRecorder] = useState(false);
  const mode: Mode = forceRecorder && detected !== "none" ? "recorder" : detected;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const recognition = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Najświeższy callback bez restartu nagrywania przy każdej literze w polu.
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const releaseMic = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = null;
  };

  useEffect(
    () => () => {
      recognition.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      releaseMic();
    },
    []
  );

  if (mode === "none") return null;

  // --- tryb 1: Web Speech API -------------------------------------------
  const startSpeech = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = LOCALE_TAGS[locale];
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
      if (event.error === "network") {
        // Usługa rozpoznawania niedostępna (np. zablokowana) — od razu nagrywamy.
        setForceRecorder(true);
        void startRecorder();
        return;
      }
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? t("voice.micDenied")
          : event.error === "audio-capture"
            ? t("voice.noMic")
            : t("voice.interrupted")
      );
    };
    rec.onend = () => setStatus((s) => (s === "listening" ? "idle" : s));
    recognition.current = rec;
    try {
      rec.start();
      setStatus("listening");
    } catch {
      setError(t("voice.micFailed"));
    }
  };

  // --- tryb 2: nagranie i transkrypcja na serwerze -----------------------
  const upload = async (blob: Blob, type: string) => {
    setStatus("processing");
    const form = new FormData();
    form.append("file", blob, `recording.${extensionFor(type)}`);
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await response.json().catch(() => null)) as { text?: string; error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? t("voice.notRecognized"));
      } else if (data?.text) {
        onTextRef.current(data.text);
      } else {
        setError(t("voice.noSpeech"));
      }
    } catch {
      setError(t("voice.offline"));
    } finally {
      setStatus("idle");
    }
  };

  const startRecorder = async () => {
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? t("voice.micDenied")
          : name === "NotFoundError"
            ? t("voice.noMic")
            : t("voice.unsupported")
      );
      setStatus("idle");
      return;
    }
    stream.current = media;
    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(media, mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined);
    } catch {
      releaseMic();
      setError(t("voice.unsupported"));
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    rec.onstop = () => {
      // Najpierw mikrofon — żeby od razu zgasła ikonka nagrywania w przeglądarce.
      releaseMic();
      const type = rec.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size < 1000) {
        setStatus("idle");
        return;
      }
      if (blob.size > MAX_UPLOAD_BYTES) {
        setStatus("idle");
        setError(t("voice.tooLong"));
        return;
      }
      void upload(blob, type);
    };
    recorder.current = rec;
    rec.start(1000);
    setStatus("recording");
    capTimer.current = setTimeout(() => {
      if (rec.state === "recording") rec.stop();
    }, MAX_RECORDING_SECONDS * 1000);
  };

  const start = () => {
    setError(null);
    if (mode === "speech") startSpeech();
    else void startRecorder();
  };

  const stop = () => {
    if (status === "listening") recognition.current?.stop();
    if (status === "recording" && recorder.current?.state === "recording") recorder.current.stop();
  };

  const busy = status === "listening" || status === "recording";

  return (
    <div className={cn("mt-1.5 flex flex-wrap items-center justify-end gap-2", className)}>
      {error ? (
        <p role="alert" className="text-[12px] text-[var(--danger-text)]">
          {error}
        </p>
      ) : status === "recording" ? (
        <p className="text-[12px] text-[var(--text-subtle)]">
          {t("voice.recording", { minutes: MAX_RECORDING_SECONDS / 60 })}
        </p>
      ) : null}
      <button
        type="button"
        onClick={busy ? stop : start}
        disabled={disabled || status === "processing"}
        aria-pressed={busy}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] transition-colors disabled:opacity-60",
          busy
            ? "bg-[var(--danger)]/15 text-[var(--danger-text)]"
            : "text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        {status === "processing" ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t("voice.processing")}
          </>
        ) : busy ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-[var(--danger)]" aria-hidden="true" />
            <Square className="size-3" aria-hidden="true" />
            {t("voice.stop")}
          </>
        ) : (
          <>
            <Mic className="size-3.5" aria-hidden="true" />
            {t("voice.start")}
          </>
        )}
      </button>
    </div>
  );
}

/** Dokleja podyktowany tekst do odpowiedzi — ze spacją i z limitem pola. */
export function appendDictation(current: unknown, text: string, max?: number) {
  const base = typeof current === "string" ? current : "";
  const glue = base && !/\s$/.test(base) ? " " : "";
  const next = base + glue + text;
  return max ? next.slice(0, max) : next;
}
