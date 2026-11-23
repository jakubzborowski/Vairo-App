"use client";

import { useState, useTransition } from "react";
import {
  Bug,
  CheckCircle2,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquareText,
  Send,
  type LucideIcon,
} from "lucide-react";
import { sendFeedback } from "@/app/app/help/actions";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Field, Textarea } from "@/components/ui/input";
import { VoiceButton, appendDictation } from "@/components/ui/voice-button";
import {
  SUPPORT_KINDS,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_MESSAGE_MIN,
  type SupportKind,
} from "@/types/support";

import { useT } from "@/i18n/client";
const KIND_ICONS: Record<SupportKind, LucideIcon> = {
  bug: Bug,
  idea: Lightbulb,
  question: MessageCircleQuestion,
  other: MessageSquareText,
};

type Props = {
  /** Ścieżka strony, z której ktoś przyszedł — dołączana do zgłoszenia. */
  from?: string | null;
  initialKind?: SupportKind | null;
  /** Kod z ekranu błędu — trafia do maila, żeby dało się znaleźć log. */
  errorCode?: string | null;
  /** Po udanym wysłaniu: toast na stronie Pomocy, nic w onboardingu. */
  onSent?: (reference: string) => void;
};

/**
 * Jedno zgłoszenie do zespołu Vairo: rodzaj i treść.
 *
 * Dwie informacje, więc jeden ekran zamiast kreatora. Rodzaj jest pierwszy,
 * bo zmienia podpowiedź pod polem — „coś nie działa” potrzebuje innego
 * opisu niż „mam pomysł”. Walidacja dopiero po kliknięciu „Wyślij”.
 *
 * Odpowiedź przychodzi mailem na adres z konta — zespół odpisuje ze zwykłej
 * poczty. Po wysłaniu pokazujemy numer zgłoszenia i ten adres, żeby nikt nie
 * czekał na odpowiedź w złym miejscu.
 */
export function FeedbackForm({ from, initialKind, errorCode, onSent }: Props) {
  const t = useT("help");
  const [kind, setKind] = useState<SupportKind | null>(initialKind ?? null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ kind?: string; message?: string; form?: string }>({});
  const [sent, setSent] = useState<{ reference: string; email: string | null } | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const next: typeof errors = {};
    if (!kind) next.kind = t("feedbackForm.wybierzCzegoDotyczyZgloszenie");
    if (message.trim().length < SUPPORT_MESSAGE_MIN) {
      next.message = t("feedbackForm.napiszTrocheWiecejCo", { SUPPORT_MESSAGE_MIN });
    } else if (message.length > SUPPORT_MESSAGE_MAX) {
      next.message = t("feedbackForm.najwyzejSupportMessageMax", { SUPPORT_MESSAGE_MAX });
    }
    setErrors(next);
    if (next.kind || next.message || !kind) return;

    startTransition(async () => {
      const result = await sendFeedback({ kind, message, from, errorCode });
      if (result.error || !result.reference) {
        setErrors({ form: result.error ?? t("feedbackForm.nieUdaloSieWyslac") });
        return;
      }
      setSent({ reference: result.reference, email: result.email ?? null });
      setMessage("");
      onSent?.(result.reference);
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--success)]/25 bg-[var(--success)]/[0.06] px-5 py-5">
        <CheckCircle2 className="size-6 text-[var(--success)]" aria-hidden="true" />
        <div>
          <p className="text-[15px] font-medium text-white">{t("feedbackForm.dziekujemyZgloszenieDotarlo")}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
            {t("feedbackForm.przeczytaJeKtosZ")}
            {sent.email ? (
              <>
                {" "}na <strong className="font-medium text-white">{sent.email}</strong>
              </>
            ) : null}
            .
          </p>
          <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
            {t("feedbackForm.numerZgloszenia")}
            <span className="tabular font-medium text-[var(--text-muted)]">{sent.reference}</span>{t("feedbackForm.przydaSieJesliZechcesz")}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSent(null);
            setKind(null);
          }}
        >
          {t("feedbackForm.wyslijKolejne")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">{t("feedbackForm.czegoToDotyczy")}</p>
        <div role="radiogroup" aria-label={t("feedbackForm.czegoDotyczyZgloszenie")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUPPORT_KINDS.map((item) => (
            <ChoiceCard
              key={item}
              icon={KIND_ICONS[item]}
              label={t(`kind.${item}.label`)}
              selected={kind === item}
              onSelect={() => {
                setKind(item);
                setErrors((prev) => ({ ...prev, kind: undefined }));
              }}
            />
          ))}
        </div>
        {errors.kind ? (
          <p className="mt-1.5 text-[12px] text-[var(--danger)]">{errors.kind}</p>
        ) : null}
      </div>

      <Field
        label={t("feedbackForm.opiszToSwoimiSlowami")}
        hint={kind ? t(`kind.${kind}.hint`) : t("feedbackForm.kilkaZdanWystarczyNie")}
        error={errors.message}
        counter={{ value: message.length, max: SUPPORT_MESSAGE_MAX }}
      >
        {({ id, invalid }) => (
          <div>
            <Textarea
              id={id}
              rows={6}
              value={message}
              aria-invalid={invalid}
              maxLength={SUPPORT_MESSAGE_MAX + 200}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                kind === "bug"
                  ? t("feedbackForm.npPoKliknieciuZapisz")
                  : kind === "idea"
                    ? t("feedbackForm.npPrzydalobySiePrzypomnienie")
                    : t("feedbackForm.napiszOCoChodzi")
              }
            />
            <VoiceButton
              disabled={pending}
              onText={(text) => setMessage((prev) => appendDictation(prev, text, SUPPORT_MESSAGE_MAX))}
            />
          </div>
        )}
      </Field>

      <p className="text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
        {t("feedbackForm.odpowiemyMailemNaAdres")}
      </p>

      {errors.form ? (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" loading={pending} onClick={submit}>
          <Send className="size-4" />
          {t("feedbackForm.wyslij")}
        </Button>
        {from ? (
          <span className="min-w-0 truncate text-[12.5px] text-[var(--text-subtle)]">
            {t("feedbackForm.dolaczymyAdresStronyFrom", { from })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
