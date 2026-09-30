"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Send } from "lucide-react";
import { applyToStartup } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type OpenRole = { id: string; title: string; weekly_hours?: number | null };

type Props = {
  startupId: string;
  startupName: string;
  openRoles: OpenRole[];
  /** Powód, dla którego zgłoszenie jest niemożliwe (limit, już w teamie…). */
  blockedReason?: string | null;
  size?: "sm" | "md" | "lg";
  /**
   * Własny wyzwalacz zamiast zwykłego przycisku. Talia w Odkrywaj podaje tu
   * okrągły `DeckAction`; lista i profil publiczny zostają przy przycisku.
   * Modal, walidacja i akcja serwerowa są w obu przypadkach te same — bez
   * tego byłyby dwie kopie tego samego formularza.
   */
  trigger?: (open: () => void) => React.ReactNode;
  /** Wywolywane po udanym wyslaniu — talia Odkrywaj przechodzi wtedy dalej. */
  onDone?: () => void;
  className?: string;
};

/** Poniżej tylu znaków zgłoszenie praktycznie nic o człowieku nie mówi. */
const THIN_MESSAGE = 40;

/**
 * Zgłoszenie do teamu.
 *
 * Wiadomość jest opcjonalna, ale pytamy o nią wprost, bo „chcę dołączyć" bez
 * zdania o sobie to najsłabsze możliwe zgłoszenie — a człowiek, który robi to
 * pierwszy raz, sam na to nie wpadnie.
 *
 * **Nie blokujemy pustego zgłoszenia — pokazujemy, co się z nim stanie.**
 * Pierwsze kliknięcie „Wyślij" przy pustym albo jednozdaniowym opisie nic nie
 * wysyła, tylko mówi wprost, że founder zobaczy sam profil. Drugie wysyła mimo
 * to. Ten sam mechanizm co przy zbyt krótkich odpowiedziach w etapie:
 * konsekwencja zamiast zakazu, decyzja zostaje po stronie człowieka.
 */
export function ApplyButton({
  startupId,
  startupName,
  openRoles,
  blockedReason,
  trigger,
  size = "md",
  onDone,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [sending, startSending] = useTransition();
  const { toast } = useToast();

  if (blockedReason) {
    return (
      <span className="text-[12px] text-[var(--text-faint)]">{blockedReason}</span>
    );
  }

  const trimmed = message.trim();
  const thin = trimmed.length < THIN_MESSAGE;
  const showConsequence = attempted && thin;

  const trySubmit = () => {
    if (thin && !attempted) {
      setAttempted(true);
      return;
    }
    submit();
  };

  const submit = () => {
    setError(null);
    startSending(async () => {
      const result = await applyToStartup({
        startupId,
        openRoleId: roleId,
        message,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast({
        title: "Zgłoszenie wysłane",
        description: `Osoby prowadzące ${startupName} zobaczą je w Zaproszeniach.`,
      });
      setOpen(false);
      setMessage("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button size={size} className={className} onClick={() => setOpen(true)}>
          <Send className="size-4" />
          Zgłoś się
        </Button>
      )}

      {open ? (
        <Modal
          title={`Zgłoś się do ${startupName}`}
          description="Zgłoszenie trafi do osób zarządzających teamem. Zobaczą Twój profil publiczny i to, co tutaj napiszesz."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
                Anuluj
              </Button>
              <Button onClick={trySubmit} loading={sending}>
                {showConsequence ? "Wyślij mimo to" : "Wyślij zgłoszenie"}
              </Button>
            </>
          }
        >
          {openRoles.length > 0 ? (
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
                Na którą rolę? <span className="text-[var(--text-faint)]">(opcjonalnie)</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {openRoles.map((role) => {
                  const selected = roleId === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setRoleId(selected ? null : role.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                        selected
                          ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
                          : "border-white/10 hover:border-white/22"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
                            : "border-white/25"
                        )}
                        aria-hidden="true"
                      >
                        {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1 text-[13.5px] text-white">
                        {role.title}
                        {role.weekly_hours ? (
                          <span className="text-[var(--text-subtle)]">
                            {" "}
                            · {role.weekly_hours} h/tydz.
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Field
            label="Kilka zdań o sobie"
            hint="Co potrafisz, ile czasu możesz dać i dlaczego akurat ten projekt."
            counter={{ value: message.length, max: 600 }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={600}
                placeholder="Np. Robię front w Reakcie od trzech lat, mogę dać 10 h tygodniowo. Wasz problem z rezerwacjami znam od strony klienta…"
              />
            )}
          </Field>

          {showConsequence ? (
            <p className="flex items-start gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3.5 py-3 text-[13px] leading-relaxed text-[var(--warning)]">
              <AlertCircle className="mt-[2px] size-4 shrink-0" />
              <span>
                {trimmed.length === 0
                  ? `Wysyłasz zgłoszenie bez ani jednego zdania o sobie. ${startupName} zobaczy wtedy sam Twój profil publiczny — najczęściej to za mało, żeby ktoś odpisał.`
                  : `To bardzo krótkie zgłoszenie. Dopisz, co potrafisz i ile czasu możesz dać — to jedyne, czego ${startupName} nie wyczyta z Twojego profilu.`}{" "}
                Możesz je rozwinąć albo wysłać tak, jak jest.
              </span>
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
