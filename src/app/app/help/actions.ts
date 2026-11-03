"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveStartupId } from "@/lib/active-team";
import { getSiteUrl } from "@/lib/supabase/config";
import { translateDbError } from "@/lib/db-errors";
import { sendMail } from "@/lib/mailer";
import {
  SUPPORT_KIND_LABELS,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_MESSAGE_MIN,
  isSupportKind,
  safeErrorCode,
  safeFromPath,
  type SupportKind,
} from "@/types/support";

type SubmitRow = {
  id: string;
  reference: string;
  contact_email: string;
  contact_name: string | null;
  startup_name: string | null;
  created_at: string;
};

/**
 * Zgłoszenie do zespołu Vairo: błąd, pomysł, pytanie.
 *
 * Kolejność ma znaczenie: najpierw zapis w bazie, potem mail. Gdy dostawca
 * poczty leży, zgłoszenie i tak zostaje (`delivery_status = failed`) i da się
 * je odczytać z SUPPORT_zgloszenia.sql — człowiek nie musi pisać drugi raz.
 *
 * Mail idzie do skrzynki zespołu z `Reply-To` = autor, więc odpowiedź to
 * zwykłe „Odpowiedz” w poczcie. Adres autora bierze baza z konta, nie
 * formularz (patrz migracja 043).
 */
export async function sendFeedback(input: {
  kind: string;
  message: string;
  from?: string | null;
  errorCode?: string | null;
}): Promise<{ error: string | null; reference?: string; email?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesja wygasła. Zaloguj się ponownie." };

  if (!isSupportKind(input.kind)) return { error: "Wybierz, czego dotyczy zgłoszenie." };
  const kind: SupportKind = input.kind;
  const message = (input.message ?? "").trim();
  if (message.length < SUPPORT_MESSAGE_MIN) {
    return { error: `Napisz trochę więcej — co najmniej ${SUPPORT_MESSAGE_MIN} znaków.` };
  }
  if (message.length > SUPPORT_MESSAGE_MAX) {
    return { error: `Zgłoszenie może mieć najwyżej ${SUPPORT_MESSAGE_MAX} znaków.` };
  }

  const pagePath = safeFromPath(input.from);
  const errorCode = safeErrorCode(input.errorCode);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 400) ?? null;

  const { data, error } = await supabase.rpc("submit_support_request", {
    p_kind: kind,
    p_message: message,
    p_page_path: pagePath,
    p_user_agent: userAgent,
    // Członkostwo sprawdza funkcja; nieaktualne ciasteczko daje po prostu
    // zgłoszenie bez zespołu.
    p_startup_id: await getActiveStartupId(),
  });

  if (error) return { error: translateDbError(error.message) };
  const row = (Array.isArray(data) ? data[0] : data) as SubmitRow | undefined;
  if (!row) {
    return { error: "Nie udało się wysłać zgłoszenia. Odśwież stronę i spróbuj jeszcze raz." };
  }

  const inbox = (process.env.SUPPORT_INBOX_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const delivery = await sendMail({
    to: inbox,
    replyTo: row.contact_email,
    idempotencyKey: `support-${row.id}`,
    subject: supportSubject(kind, row, message),
    text: supportBody({ kind, row, message, pagePath, errorCode, userAgent, userId: user.id }),
  });

  if (!delivery.ok) console.error("[support] mail", row.reference, delivery.error);
  await supabase.rpc("mark_support_delivery", {
    p_id: row.id,
    p_ok: delivery.ok,
    p_error: delivery.ok ? null : delivery.error,
  });

  // Człowiek dostaje potwierdzenie także wtedy, gdy mail nie wyszedł:
  // zgłoszenie jest zapisane i zespół je odczyta. Awaria poczty to problem
  // Vairo, nie powód, żeby kazać komuś pisać jeszcze raz.
  return { error: null, reference: row.reference, email: row.contact_email };
}

function supportSubject(kind: SupportKind, row: SubmitRow, message: string) {
  // Temat to jedna linia — imię z profilu też może mieć w sobie entery.
  const who = (row.contact_name ?? row.contact_email).replace(/\s+/g, " ");
  const preview = message.replace(/\s+/g, " ").slice(0, 60);
  return `[Vairo · ${SUPPORT_KIND_LABELS[kind]}] ${row.reference} — ${who}: ${preview}${message.length > 60 ? "…" : ""}`;
}

function supportBody(input: {
  kind: SupportKind;
  row: SubmitRow;
  message: string;
  pagePath: string | null;
  errorCode: string | null;
  userAgent: string | null;
  userId: string;
}) {
  const { row } = input;
  const sent = new Date(row.created_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  return [
    `${row.contact_name ?? "Bez imienia"} <${row.contact_email}> pisze:`,
    "",
    input.message,
    "",
    "—",
    `Numer: ${row.reference}`,
    `Rodzaj: ${SUPPORT_KIND_LABELS[input.kind]}`,
    `Strona: ${input.pagePath ? `${getSiteUrl()}${input.pagePath}` : "—"}`,
    ...(input.errorCode ? [`Kod błędu: ${input.errorCode} (szukaj w logach Vercel)`] : []),
    `Zespół: ${row.startup_name ?? "—"}`,
    `Konto: ${input.userId}`,
    `Przeglądarka: ${input.userAgent ?? "—"}`,
    `Wysłano: ${sent}`,
    "",
    "Odpowiedz na tego maila — trafi prosto do autora zgłoszenia.",
  ].join("\n");
}
