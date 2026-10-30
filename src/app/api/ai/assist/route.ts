import Anthropic from "@anthropic-ai/sdk";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { loadStageTree } from "@/lib/stage";
import { takeToken } from "@/lib/rate-limit";
import { MENTOR_BASE, MODE_INSTRUCTIONS, type AiMode } from "@/lib/ai/prompts";
import {
  answerToText,
  clip,
  locateField,
  locatePoint,
  pointAnswers,
  stageAnswers,
  startupHeader,
} from "@/lib/ai/context";
import { SELECTABLE_CATEGORIES } from "@/types/startup";

/**
 * Mentor AI (Claude) w etapach. Cztery tryby — patrz src/lib/ai/prompts.ts.
 *
 * Bezpieczeństwo i koszty:
 *   • ANTHROPIC_API_KEY tylko na serwerze; bez klucza przyciski się nie
 *     pokazują (AiProvider), a ten endpoint odpowiada 503;
 *   • dostęp: etap czytamy klientem Supabase zalogowanej osoby — RLS
 *     wpuszcza wyłącznie członków teamu, więc cudzy startup = 404;
 *   • limity na osobę (w pamięci instancji, jak przy dyktowaniu);
 *   • szybki tani model do podpowiedzi i porządkowania, mocniejszy do oceny
 *     i przeglądu; stała część instrukcji z cache promptów.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FAST_MODEL = process.env.AI_MODEL_FAST || "claude-haiku-5-5";
const SMART_MODEL = process.env.AI_MODEL_SMART || "claude-sonnet-5-5";

const LIMITS: Record<AiMode, { perDay: number; maxTokens: number; model: string }> = {
  hint: { perDay: 60, maxTokens: 700, model: FAST_MODEL },
  organize: { perDay: 30, maxTokens: 1600, model: FAST_MODEL },
  review: { perDay: 30, maxTokens: 1000, model: SMART_MODEL },
  mentor: { perDay: 12, maxTokens: 1400, model: SMART_MODEL },
};

const UUID = /^[0-9a-f-]{36}$/i;
const LIST_KINDS = new Set(["list_short", "list_long"]);

type Body = {
  mode?: AiMode;
  startupStageId?: string;
  answerKey?: string;
  pointKey?: string;
  scope?: "point" | "stage";
  draft?: unknown;
  notes?: string;
};

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Zaloguj się, żeby korzystać z mentora.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fail(503, "Mentor AI nie jest jeszcze włączony.");

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail(400, "Nieprawidłowe zapytanie.");
  }
  const mode = body.mode;
  if (!mode || !(mode in LIMITS)) return fail(400, "Nieznany tryb mentora.");
  if (!body.startupStageId || !UUID.test(body.startupStageId)) return fail(400, "Brak etapu.");

  const limit = LIMITS[mode];
  if (
    !takeToken(`ai:minute:${user.id}`, 8, 60_000) ||
    !takeToken(`ai:${mode}:day:${user.id}`, limit.perDay, 24 * 60 * 60_000)
  ) {
    return fail(429, "Na dziś wykorzystano limit tej funkcji mentora. Spróbuj jutro albo za minutę.");
  }

  const supabase = await createClient();
  const { data: stageRow } = await supabase
    .from("startup_stages")
    .select("id, startup_id")
    .eq("id", body.startupStageId)
    .maybeSingle();
  if (!stageRow) return fail(404, "Nie znaleziono etapu.");

  const startups = await getUserStartups(supabase, user.id);
  const startup = startups.find((s) => s.id === stageRow.startup_id);
  if (!startup) return fail(404, "Nie znaleziono etapu.");

  const tree = await loadStageTree(supabase, {
    startupStageId: body.startupStageId,
    activeCategories: startup.categories,
    role: startup.role,
  });
  if (!tree) return fail(404, "Nie znaleziono etapu.");

  const categoryLabels = startup.categories.map((key) =>
    key === "general"
      ? "Ogólna walidacja"
      : (SELECTABLE_CATEGORIES.find((c) => c.key === key)?.label ?? key)
  );
  const header = startupHeader({ name: startup.name, categories: categoryLabels, tree });
  let task: string;
  let organizeAsList = false;

  if (mode === "mentor") {
    if (body.scope === "point") {
      const located = body.pointKey ? locatePoint(tree, body.pointKey) : null;
      if (!located) return fail(404, "Nie znaleziono punktu.");
      task = [
        `Przegląd punktu: ${located.category.title} → ${located.point.title}`,
        located.point.guideBody ? `Przewodnik programu do tego punktu:\n${clip(located.point.guideBody, 3500)}` : "",
        `Odpowiedzi zespołu w tym punkcie:\n${clip(pointAnswers(tree, located.point, tree.answers), 9000)}`,
        `Inne odpowiedzi z tego etapu (tło):\n${stageAnswers(tree, tree.answers, 5000) || "(brak)"}`,
      ].filter(Boolean).join("\n\n");
    } else {
      task = [
        "Przegląd całego etapu przed decyzją zespołu, czy iść dalej, zmienić kierunek, wstrzymać czy odrzucić pomysł.",
        `Odpowiedzi zespołu:\n${stageAnswers(tree, tree.answers) || "(brak odpowiedzi)"}`,
      ].join("\n\n");
    }
  } else {
    const located = body.answerKey ? locateField(tree, body.answerKey.slice(0, 200)) : null;
    if (!located) return fail(404, "Nie znaleziono pytania.");
    const { category, point, subpoint, field } = located;
    // Szkic z formularza (jeszcze niezapisany) ma pierwszeństwo przed zapisem.
    const current = body.draft !== undefined ? body.draft : tree.answers[field.answerKey];
    const currentText = answerToText(field, current);
    organizeAsList = LIST_KINDS.has(field.kind);
    const fieldBlock = [
      `Kategoria i punkt: ${category.title} → ${point.title}`,
      `Podpunkt: ${subpoint.title}${subpoint.description ? ` — ${subpoint.description}` : ""}`,
      `Pytanie: ${field.question}`,
      field.help ? `Podpowiedź programu: ${field.help}` : "",
      field.example ? `Przykład z programu (z innego pomysłu): ${field.example}` : "",
      field.config.min_items ? `Wymagane minimum: ${field.config.min_items} pozycji.` : "",
      field.config.max ? `Limit długości: ${field.config.max} znaków.` : "",
      point.guideBody ? `Przewodnik programu do tego punktu:\n${clip(point.guideBody, 3000)}` : "",
    ].filter(Boolean).join("\n");

    if (mode === "organize") {
      const notes = (body.notes ?? "").trim().slice(0, 8000);
      if (!notes) return fail(400, "Wpisz albo podyktuj notatki do uporządkowania.");
      task = [
        fieldBlock,
        `Format odpowiedzi: ${organizeAsList ? "lista" : "tekst"}`,
        `Notatki zespołu:\n"""\n${notes}\n"""`,
      ].join("\n\n");
    } else {
      task = [
        fieldBlock,
        mode === "review"
          ? `Odpowiedź zespołu do oceny:\n${currentText ?? "(pusta)"}`
          : currentText
            ? `Co zespół już wpisał (nie oceniaj, tylko wykorzystaj jako kontekst):\n${currentText}`
            : "",
        `Inne odpowiedzi zespołu z tego etapu (kontekst pomysłu):\n${stageAnswers(tree, tree.answers, 6000) || "(brak)"}`,
      ].filter(Boolean).join("\n\n");
    }
  }

  const client = new Anthropic({ apiKey });
  const system = [
    // Stała część — wspólna dla wszystkich zapytań, więc z cache promptów.
    { type: "text" as const, text: MENTOR_BASE, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: MODE_INSTRUCTIONS[mode] },
  ];
  const messages = [{ role: "user" as const, content: `${header}\n\n${task}` }];

  if (mode === "organize") {
    try {
      const response = await client.messages.create({
        model: limit.model,
        max_tokens: limit.maxTokens,
        system,
        messages,
      });
      const raw = response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("")
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(raw) as { items?: unknown; text?: unknown; missing?: unknown };
      const missing = typeof parsed.missing === "string" ? parsed.missing : "";
      if (organizeAsList) {
        const items = Array.isArray(parsed.items)
          ? parsed.items.filter((i): i is string => typeof i === "string" && i.trim().length > 0).slice(0, 30)
          : [];
        return Response.json({ items, missing }, { headers: { "Cache-Control": "no-store" } });
      }
      const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
      return Response.json({ text, missing }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return fail(502, describeAiError(error));
    }
  }

  const stream = client.messages.stream({ model: limit.model, max_tokens: limit.maxTokens, system, messages });
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (error) {
        controller.enqueue(encoder.encode(`\n\n[${describeAiError(error)}]`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function describeAiError(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 401 || status === 403) {
    console.error("Anthropic auth error", status);
    return "Mentor AI jest źle skonfigurowany (klucz API). Daj znać administratorowi.";
  }
  if (status === 429 || status === 529) return "Mentor jest teraz przeciążony. Spróbuj za minutę.";
  console.error("Anthropic error", status, error);
  return "Mentor nie odpowiedział. Spróbuj jeszcze raz.";
}
