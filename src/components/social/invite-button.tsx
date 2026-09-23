"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { inviteToStartup } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { JOB_TITLE_SUGGESTIONS } from "@/types/social";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/types/startup";

export type InvitableTeam = { id: string; name: string };

type Props = {
  profileId: string;
  profileName: string;
  /** Teamy, w których zapraszający jest Founderem lub Adminem. */
  teams: InvitableTeam[];
  blockedReason?: string | null;
  size?: "sm" | "md" | "lg";
  /** Wywolywane po udanym wyslaniu — talia Odkrywaj przechodzi wtedy dalej. */
  onDone?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
};

const ROLE_CHOICES = ["member", "admin"] as const;

/**
 * Zaproszenie osoby do teamu.
 *
 * Rola i stanowisko to dwie różne rzeczy i pytamy o nie osobno: „CTO" jest
 * wizytówką, a to, czy ktoś może zmieniać walidację pomysłu, wynika z roli.
 * Opis pod każdą rolą mówi wprost, co ona daje — bez tego ludzie nadają
 * Admina wszystkim, bo brzmi poważniej.
 */
export function InviteButton({
  profileId,
  profileName,
  teams,
  blockedReason,
  size = "md",
  onDone,
  variant = "secondary",
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [jobTitle, setJobTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  if (teams.length === 0 || blockedReason) {
    return blockedReason ? (
      <span className="text-[12px] text-[var(--text-faint)]">{blockedReason}</span>
    ) : null;
  }

  const submit = () => {
    setError(null);
    if (!teamId) {
      setError("Wybierz team.");
      return;
    }
    startSending(async () => {
      const result = await inviteToStartup({
        startupId: teamId,
        profileId,
        proposedRole: role,
        jobTitle,
        message,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setMessage("");
      setJobTitle("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Zaproś do teamu
      </Button>

      {open ? (
        <Modal
          title={`Zaproś ${profileName}`}
          description="Zaproszenie czeka na odpowiedź. Do teamu dołącza dopiero po akceptacji."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
                Anuluj
              </Button>
              <Button onClick={submit} loading={sending}>
                Wyślij zaproszenie
              </Button>
            </>
          }
        >
          {teams.length > 1 ? (
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
                Do którego teamu?
              </p>
              <div className="flex flex-col gap-1.5">
                {teams.map((team) => (
                  <Choice
                    key={team.id}
                    selected={teamId === team.id}
                    onSelect={() => setTeamId(team.id)}
                    title={team.name}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
              Jakie uprawnienia?
            </p>
            <div className="flex flex-col gap-1.5">
              {ROLE_CHOICES.map((choice) => (
                <Choice
                  key={choice}
                  selected={role === choice}
                  onSelect={() => setRole(choice)}
                  title={ROLE_LABELS[choice]}
                  description={ROLE_DESCRIPTIONS[choice]}
                />
              ))}
            </div>
          </div>

          <Field
            label="Stanowisko"
            hint="Wizytówka w składzie teamu. Nie ma wpływu na uprawnienia."
          >
            {({ id }) => (
              <div>
                <Input
                  id={id}
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  maxLength={48}
                  placeholder="np. CTO"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {JOB_TITLE_SUGGESTIONS.slice(0, 8).map((suggestion) => (
                    <Pill
                      key={suggestion}
                      selected={jobTitle === suggestion}
                      onToggle={() =>
                        setJobTitle((prev) =>
                          prev === suggestion ? "" : suggestion
                        )
                      }
                    >
                      {suggestion}
                    </Pill>
                  ))}
                </div>
              </div>
            )}
          </Field>

          <Field
            label="Wiadomość"
            hint="Opcjonalna, ale zaproszenie bez słowa wyjaśnienia rzadko kogoś przekonuje."
            counter={{ value: message.length, max: 600 }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Np. Widzieliśmy Twój profil — szukamy kogoś do frontendu na jakieś 10 h tygodniowo."
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

function Choice({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        selected
          ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
          : "border-white/10 hover:border-white/22"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
          selected
            ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
            : "border-white/25"
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-white">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
