"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { applyToStartup } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type OpenRole = { id: string; title: string; weekly_hours?: number | null };

type Props = {
  startupId: string;
  startupName: string;
  openRoles: OpenRole[];
  /** Powód, dla którego zgłoszenie jest niemożliwe (limit, już w teamie…). */
  blockedReason?: string | null;
  size?: "sm" | "md" | "lg";
  /** Wywolywane po udanym wyslaniu — talia Odkrywaj przechodzi wtedy dalej. */
  onDone?: () => void;
  className?: string;
};

/**
 * Zgłoszenie do teamu.
 *
 * Wiadomość jest opcjonalna, ale pytamy o nią wprost, bo „chcę dołączyć" bez
 * zdania o sobie to najsłabsze możliwe zgłoszenie — a człowiek, który robi to
 * pierwszy raz, sam na to nie wpadnie.
 */
export function ApplyButton({
  startupId,
  startupName,
  openRoles,
  blockedReason,
  size = "md",
  onDone,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  if (blockedReason) {
    return (
      <span className="text-[12px] text-[var(--text-faint)]">{blockedReason}</span>
    );
  }

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
      setOpen(false);
      setMessage("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <>
      <Button size={size} className={className} onClick={() => setOpen(true)}>
        <Send className="size-4" />
        Zgłoś się
      </Button>

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
              <Button onClick={submit} loading={sending}>
                Wyślij zgłoszenie
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
