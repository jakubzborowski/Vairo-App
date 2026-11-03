/**
 * Wysyłka maili transakcyjnych z serwera.
 *
 * Dostawca: Resend (https://resend.com) — przez zwykłe REST API, bez SDK,
 * więc zmiana na Postmarka czy SES to zmiana tej jednej funkcji. Klucz
 * żyje wyłącznie w zmiennych środowiskowych serwera (`RESEND_API_KEY`),
 * nigdy w `NEXT_PUBLIC_*`.
 *
 * Funkcja nie rzuca: zwraca wynik, bo wołający zawsze ma już zapis w bazie
 * i sam decyduje, co powiedzieć człowiekowi.
 */

export type MailResult = { ok: true } | { ok: false; error: string };

export function isMailerConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(input: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  /** Ten sam klucz = ten sam mail; ponowienie nie wyśle drugiej kopii. */
  idempotencyKey?: string;
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return { ok: false, error: "mailer_not_configured" };
  if (input.to.length === 0) return { ok: false, error: "no_recipient" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      // Człowiek czeka na potwierdzenie — dłużej niż kilka sekund nie ma
      // sensu. Zgłoszenie jest już zapisane, więc nic nie przepada.
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, error: `resend_${response.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
    };
  }
}
