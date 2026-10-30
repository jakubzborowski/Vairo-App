import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { takeToken } from "@/lib/rate-limit";

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
  const user = await getCurrentUser();
  if (!user) return fail(401, "Zaloguj się, żeby korzystać z dyktowania.");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fail(503, "Dyktowanie w tej przeglądarce nie jest jeszcze włączone. Spróbuj w Chrome albo Edge.");
  }

  if (
    !takeToken(`transcribe:minute:${user.id}`, 10, 60_000) ||
    !takeToken(`transcribe:day:${user.id}`, 100, 24 * 60 * 60_000)
  ) {
    return fail(429, "Za dużo nagrań w krótkim czasie. Spróbuj za minutę.", { "Retry-After": "60" });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES + 64 * 1024) {
    return fail(413, "Nagranie jest za długie. Nagraj krótszy fragment.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Nie udało się odczytać nagrania. Spróbuj jeszcze raz.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail(400, "Nagranie jest puste. Spróbuj jeszcze raz.");
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "Nagranie jest za długie. Nagraj krótszy fragment.");
  }
  const type = file.type.split(";")[0]!.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return fail(415, "Ten format nagrania nie jest obsługiwany.");
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "nagranie.webm");
  upstream.append("model", "whisper-large-v3-turbo");
  upstream.append("language", "pl");
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
    return fail(502, "Usługa rozpoznawania mowy nie odpowiada. Spróbuj za chwilę.");
  }

  if (response.status === 429) {
    return fail(429, "Wyczerpał się chwilowy limit dyktowania. Spróbuj za minutę.", { "Retry-After": "60" });
  }
  if (!response.ok) {
    // Szczegóły tylko w logach Vercela — użytkownik dostaje zrozumiały komunikat.
    console.error("Groq transcription failed", response.status, await response.text().catch(() => ""));
    return fail(502, "Nie udało się rozpoznać nagrania. Spróbuj jeszcze raz.");
  }

  const data = (await response.json().catch(() => null)) as { text?: string } | null;
  return NextResponse.json({ text: (data?.text ?? "").trim() }, { headers: { "Cache-Control": "no-store" } });
}
