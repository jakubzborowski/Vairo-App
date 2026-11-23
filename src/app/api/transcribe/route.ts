import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { takeToken } from "@/lib/rate-limit";
import { getLocale, getT } from "@/i18n/server";

/**
 * Transkrypcja nagrania dla przeglądarek bez Web Speech API (Firefox, Brave).
 * Plik idzie dalej do Groq (Whisper). Klucz GROQ_API_KEY zostaje na serwerze —
 * nie ma prefiksu NEXT_PUBLIC_, więc nie trafia do kodu przeglądarki.
 *
 * Ochrona darmowego limitu Groq:
 *   • tylko zalogowani (dyktowanie jest w aplikacji, nie na stronie publicznej);
 *   • do 10 nagrań na minutę i 100 na dobę na osobę (src/lib/rate-limit.ts);
 *   • do 4 MB na plik — poniżej limitu ciała zapytania na Vercelu (~4,5 MB);
 *   • tylko typy audio, które nagrywają przeglądarki.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  // Część wersji Chrome oznacza nagranie z MediaRecorder jako video/webm.
  "video/webm",
]);

function fail(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: Request) {
  const t = await getT("common");
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) return fail(401, t("voice.loginRequired"));

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fail(503, t("voice.notEnabled"));
  }

  if (
    !takeToken(`transcribe:minute:${user.id}`, 10, 60_000) ||
    !takeToken(`transcribe:day:${user.id}`, 100, 24 * 60 * 60_000)
  ) {
    return fail(429, t("voice.tooMany"), { "Retry-After": "60" });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES + 64 * 1024) {
    return fail(413, t("voice.tooLong"));
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, t("voice.unreadable"));
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail(400, t("voice.empty"));
  }
  if (file.size > MAX_BYTES) {
    return fail(413, t("voice.tooLong"));
  }
  const type = file.type.split(";")[0]!.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return fail(415, t("voice.badFormat"));
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "recording.webm");
  upstream.append("model", "whisper-large-v3-turbo");
  upstream.append("language", locale);
  upstream.append("response_format", "json");

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return fail(502, t("voice.serviceDown"));
  }

  if (response.status === 429) {
    return fail(429, t("voice.quota"), { "Retry-After": "60" });
  }
  if (!response.ok) {
    // Szczegóły tylko w logach Vercela — użytkownik dostaje zrozumiały komunikat.
    console.error("Groq transcription failed", response.status, await response.text().catch(() => ""));
    return fail(502, t("voice.notRecognized"));
  }

  const data = (await response.json().catch(() => null)) as { text?: string } | null;
  return NextResponse.json({ text: (data?.text ?? "").trim() }, { headers: { "Cache-Control": "no-store" } });
}
