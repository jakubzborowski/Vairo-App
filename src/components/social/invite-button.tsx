"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, UserPlus } from "lucide-react";
import { inviteToStartup } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { JOB_TITLE_SUGGESTIONS } from "@/types/social";

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
  /**
   * Własny wyzwalacz zamiast zwykłego przycisku. Talia w Odkrywaj podaje tu
   * okrągły `DeckAction`; lista i profil publiczny zostają przy przycisku.
   * Modal, walidacja i akcja serwerowa są w obu przypadkach te same — bez
   * tego byłyby dwie kopie tego samego formularza.
   */
  trigger?: (open: () => void) => React.ReactNode;
};

/**
 * Zaproszenie osoby do teamu.
 *
 * Rola i stanowisko to dwie różne rzeczy i pytamy o nie osobno: „CTO" jest
 * wizytówką, a to, czy ktoś może zmieniać walidację pomysłu, wynika z roli.
 * Opis pod każdą rolą mówi wprost, co ona daje — bez tego ludzie nadają
 * Admina wszystkim, bo brzmi poważniej.
 */
/** Poniżej tylu znaków zaproszenie nie niesie żadnej informacji. */
const THIN_MESSAGE = 40;

export function InviteButton({
  profileId,
  profileName,
  teams,
  blockedReason,
  trigger,
  size = "md",
  onDone,
  variant = "secondary",
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [sending, startSending] = useTransition();
  const { toast } = useToast();

  if (teams.length === 0 || blockedReason) {
    return blockedReason ? (
      <span className="text-[12px] text-[var(--text-faint)]">{blockedReason}</span>
    ) : null;
  }

  const trimmed = message.trim();
  const thin = trimmed.length < THIN_MESSAGE;
  const showConsequence = attempted && thin;

  // Zaproszenie bez słowa wyjaśnienia dla odbiorcy wygląda jak spam. Nie
  // blokujemy go — pierwsze kliknięcie mówi, jak to zostanie odebrane, drugie
  // wysyła mimo to. Ten sam mechanizm co przy zgłoszeniu i w etapach.
  const trySubmit = () => {
    if (thin && !attempted) {
      setAttempted(true);
      return;
    }
    submit();
  };

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
        jobTitle,
        message,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast({
        title: "Zaproszenie wysłane",
        description: `${profileName} dołączy do zespołu po przyjęciu zaproszenia.`,
      });
      setOpen(false);
      setMessage("");
      setJobTitle("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Zaproś do teamu
        </Button>
      )}

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
              <Button onClick={trySubmit} loading={sending}>
                {showConsequence ? "Wyślij mimo to" : "Wyślij zaproszenie"}
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

          {/* Wyboru uprawnień tu nie ma i nie powinno być.
              Guidelines, sekcja 4: „Dopiero zaakceptowanie zaproszenia tworzy
              membership. Użytkownik otrzymuje dostęp jako Member. Nie
              otrzymuje automatycznie uprawnień administracyjnych. Role
              i permisje ustawia Founder albo Admin."

              Wcześniej dało się tu zaznaczyć „Admin", a jedno kliknięcie
              „Przyjmij" po drugiej stronie nadawało prawa do zarządzania
              zespołem, zamykania etapów i usuwania ludzi. Nadanie uprawnień
              jest czynnością teamu, nie zapraszanego — i dzieje się teraz po
              dołączeniu, jednym ruchem w menu przy członku. */}
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

          {showConsequence ? (
            <p className="flex items-start gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3.5 py-3 text-[13px] leading-relaxed text-[var(--warning)]">
              <AlertCircle className="mt-[2px] size-4 shrink-0" />
              <span>
                {trimmed.length === 0
                  ? `${profileName} zobaczy samą nazwę teamu i nic poza tym — ani czemu akurat ta osoba, ani czym mielibyście się zajmować.`
                  : "To bardzo krótkie zaproszenie. Jedno zdanie o tym, czemu akurat ta osoba, zmienia je z rozesłanego w skierowane."}{" "}
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
