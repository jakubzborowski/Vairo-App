"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck } from "lucide-react";
import { createGoal } from "@/app/app/goals/actions";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MenuSelect } from "@/components/ui/menu-select";
import { StepWizard, type WizardStep } from "@/components/ui/step-wizard";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { canAssignToOthers, type StartupRole } from "@/types/startup";
import type {
  GoalTypeOption,
  MilestoneCondition,
  ProofKind,
  TeamMemberOption,
} from "@/types/goals";
import { formatDayLong } from "./goal-format";
import {
  COMMON_PROOF_KINDS,
  PROOF_KIND_META,
  buildRequirement,
  goalTypeIcon,
  optionsCount,
} from "./goal-options";

const EXAMPLES = ["Działający formularz zamówienia", "Raport z 5 rozmów", "Podpisana umowa"];

/**
 * Nowy cel — jedno pytanie na ekran.
 *
 * Dawniej osiem pól w jednym oknie, w tym dwa, które brzmiały tak samo
 * („czym pokażecie, że gotowe" i „format dowodu"). Teraz to dwa kolejne
 * kroki: najpierw forma, potem pytanie, które tę formę już zna — „Co ma być
 * pod tym linkiem?". Całość widać raz, na ostatnim kroku, z „Zmień" przy
 * każdym wierszu.
 */
export function GoalWizard({
  startupId,
  userId,
  role,
  members,
  goalTypes,
  preset,
  initialTitle,
  initialDescription,
}: {
  startupId: string;
  userId: string;
  role: StartupRole;
  members: TeamMemberOption[];
  goalTypes: GoalTypeOption[];
  preset: MilestoneCondition | null;
  initialTitle: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const canAssign = canAssignToOthers(role);
  const lockedType = preset && !preset.matchAnyType ? preset.goalTypeId : null;
  const lockedKind = preset?.proofKind ?? null;

  const [title, setTitle] = useState(initialTitle);
  const [goalTypeId, setGoalTypeId] = useState(lockedType ?? preset?.goalTypeId ?? "custom");
  const [ownerId, setOwnerId] = useState(userId);
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<ProofKind | null>(lockedKind);
  const [label, setLabel] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const typeLabel = goalTypes.find((type) => type.id === goalTypeId)?.label ?? goalTypeId;
  const ownerName =
    ownerId === userId
      ? "Ty"
      : (members.find((member) => member.id === ownerId)?.name ?? "Ty");
  const kinds =
    lockedKind && !COMMON_PROOF_KINDS.includes(lockedKind)
      ? [...COMMON_PROOF_KINDS, lockedKind]
      : COMMON_PROOF_KINDS;

  if (created) {
    return <Created goalId={created} preset={preset} />;
  }

  const finish = () => {
    if (!kind) return;
    setError(null);
    start(async () => {
      const result = await createGoal({
        startupId,
        title,
        description: initialDescription,
        goalTypeId,
        ownerId: canAssign ? ownerId : userId,
        dueDate,
        proofRequirement: buildRequirement(kind, label, optionsText),
        conditionId: preset?.id ?? null,
        // Warunek, który ma już cel, dostaje KOLEJNY — bez tej flagi akcja
        // oddaje istniejący (ochrona przed podwójnym kliknięciem).
        addAnother: Boolean(preset && preset.linkedGoalIds.length > 0),
      });
      if (result.error || !result.id) {
        setError(result.error ?? "Nie udało się założyć celu. Spróbuj jeszcze raz.");
        return;
      }
      toast({ title: "Cel zapisany", description: title.trim() });
      setCreated(result.id);
    });
  };

  const steps: WizardStep[] = [
    {
      key: "result",
      title: "Jaki wynik chcecie pokazać?",
      validate: () =>
        title.trim().length < 3 ? "Napisz, co ma być gotowe. Jedno zdanie wystarczy." : null,
      render: ({ error: stepError }) => (
        <div>
          <Field
            error={stepError}
            hint="Jedna rzecz, którą da się komuś pokazać palcem. To będzie nazwa celu."
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                aria-invalid={invalid}
                aria-label="Wynik"
                autoFocus
                value={title}
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Na przykład: pakiet przekazania dla pierwszej firmy"
                className="h-[52px] text-[16px]"
              />
            )}
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="w-full text-[12.5px] text-[var(--text-subtle)]">
              Albo zacznij od przykładu:
            </span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setTitle(example)}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--surface-2)] px-3.5 text-[13px] text-[var(--text-muted)] ring-1 ring-inset ring-white/8 transition-colors hover:text-white hover:ring-white/20 sm:min-h-8"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Jakiego rodzaju to wynik?",
      description: lockedType
        ? undefined
        : "Rodzaj decyduje, do których warunków etapu cel da się później podpiąć.",
      render: () => (
        <div role="radiogroup" aria-label="Rodzaj celu" className="flex flex-col gap-2.5">
          {goalTypes.map((type) => {
            const locked = Boolean(lockedType && type.id !== lockedType);
            return (
              <ChoiceCard
                key={type.id}
                icon={goalTypeIcon(type.id)}
                label={type.label}
                description={type.description}
                note={
                  lockedType && type.id === lockedType && preset
                    ? `Tego typu wymaga warunek „${preset.subpointTitle}”.`
                    : null
                }
                selected={type.id === goalTypeId}
                disabled={locked}
                onSelect={() => setGoalTypeId(type.id)}
              />
            );
          })}
        </div>
      ),
    },
    {
      key: "when",
      title: "Do kiedy ma być gotowe?",
      validate: () => (dueDate ? null : "Wybierz termin — można go później przesunąć."),
      render: ({ error: stepError }) => (
        <div className="flex flex-col gap-5">
          <Field error={stepError} hint="Termin da się przesunąć w szczególe celu.">
            {({ id, invalid }) => (
              <Input
                id={id}
                type="date"
                aria-invalid={invalid}
                aria-label="Termin"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-[52px] text-[16px] [color-scheme:dark]"
              />
            )}
          </Field>
          {canAssign ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-muted)]">
                Kto odpowiada za wynik
              </span>
              <MenuSelect
                ariaLabel="Kto odpowiada za wynik"
                value={ownerId}
                onChange={setOwnerId}
                options={members.map((member) => ({
                  value: member.id,
                  label: member.id === userId ? `${member.name} (Ty)` : member.name,
                }))}
              />
              <span className="text-[12px] text-[var(--text-subtle)]">
                Jedna osoba odpowiada za wynik. Inni mogą dostać zadania pod nim.
              </span>
            </div>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
              Za wynik odpowiadasz Ty. Cel komuś innemu przypisuje Founder albo Admin.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "proof",
      title: "W jakiej formie pokażecie, że jest gotowe?",
      validate: () => (kind ? null : "Wybierz formę dowodu."),
      render: ({ error: stepError }) => (
        <div>
          <div role="radiogroup" aria-label="Forma dowodu" className="grid gap-2.5 sm:grid-cols-2">
            {kinds.map((item) => {
              const meta = PROOF_KIND_META[item];
              return (
                <ChoiceCard
                  key={item}
                  icon={meta.icon}
                  label={meta.label}
                  description={meta.example}
                  selected={kind === item}
                  disabled={Boolean(lockedKind && item !== lockedKind)}
                  onSelect={() => setKind(item)}
                />
              );
            })}
          </div>
          {lockedKind && preset ? (
            <p className="mt-3 text-[13px] text-[var(--text-subtle)]">
              Warunek „{preset.subpointTitle}” przyjmuje tylko tę formę.
            </p>
          ) : null}
          {stepError ? (
            <p role="alert" className="mt-3 text-[12.5px] text-[var(--danger)]">
              {stepError}
            </p>
          ) : null}
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-subtle)]">
            Tego będziemy oczekiwać przy kończeniu celu. Cel kończy dowód, nie
            odhaczenie zadań.
          </p>
        </div>
      ),
    },
    {
      key: "expect",
      title: kind ? PROOF_KIND_META[kind].question : "Co ma pokazać dowód?",
      validate: () => {
        if (label.trim().length < 2) return "Napisz jednym zdaniem, czego oczekujecie.";
        if (kind === "select" && optionsCount(optionsText) < 2) {
          return "Lista wyboru potrzebuje co najmniej dwóch odpowiedzi — każda w osobnej linijce.";
        }
        return null;
      },
      render: ({ error: stepError, goTo }) => (
        <div className="flex flex-col gap-5">
          <Field
            error={stepError && label.trim().length < 2 ? stepError : null}
            hint="Jednym zdaniem — tak, żeby osoba kończąca cel wiedziała, co dodać."
          >
            {({ id, invalid }) => (
              <Input
                id={id}
                aria-invalid={invalid}
                aria-label="Czego oczekujecie"
                autoFocus
                value={label}
                maxLength={200}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={kind ? PROOF_KIND_META[kind].placeholder : ""}
                className="h-[52px] text-[16px]"
              />
            )}
          </Field>
          {kind === "select" ? (
            <Field
              label="Możliwe odpowiedzi"
              error={stepError && label.trim().length >= 2 ? stepError : null}
              hint="Każda odpowiedź w osobnej linijce."
            >
              {({ id, invalid }) => (
                <Textarea
                  id={id}
                  aria-invalid={invalid}
                  rows={4}
                  value={optionsText}
                  onChange={(event) => setOptionsText(event.target.value)}
                  placeholder={"Tak\nNie"}
                />
              )}
            </Field>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--surface)]">
            <p className="px-4 pt-3.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
              Tak będzie wyglądał cel
            </p>
            <dl className="mt-1.5 divide-y divide-white/[0.06]">
              <SummaryRow label="Wynik" value={title.trim()} onChange={() => goTo(0)} />
              <SummaryRow
                label="Rodzaj"
                value={typeLabel}
                onChange={lockedType ? undefined : () => goTo(1)}
              />
              <SummaryRow
                label="Kto i do kiedy"
                value={`${ownerName} · do ${formatDayLong(dueDate)}`}
                onChange={() => goTo(2)}
              />
              <SummaryRow
                label="Dowód"
                value={`${kind ? PROOF_KIND_META[kind].label : ""}${label.trim() ? ` · ${label.trim()}` : ""}`}
                onChange={lockedKind ? undefined : () => goTo(3)}
              />
              {preset ? <SummaryRow label="Liczy się do" value={preset.subpointTitle} /> : null}
            </dl>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page py-2 sm:py-6">
      <StepWizard
        steps={steps}
        finishLabel="Załóż cel"
        finishing={pending}
        error={error}
        onFinish={finish}
        onExit={() => router.push("/app/goals")}
        exitLabel="Wróć do celów"
        footerBack
        crumb={
          preset
            ? `Nowy cel · podepnie się do „${preset.subpointTitle}”`
            : "Nowy cel"
        }
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-baseline gap-3 px-4 py-2.5">
      <dt className="w-28 shrink-0 text-[12.5px] text-[var(--text-subtle)]">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13.5px] text-white">{value || "—"}</dd>
      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="inline-flex min-h-11 shrink-0 items-center text-[12.5px] font-medium text-[var(--text-muted)] underline decoration-white/25 underline-offset-4 hover:text-white sm:min-h-0"
        >
          Zmień
        </button>
      ) : null}
    </div>
  );
}

/** Po założeniu: co się właśnie stało i jeden następny ruch. */
function Created({ goalId, preset }: { goalId: string; preset: MilestoneCondition | null }) {
  return (
    <div className="page py-6">
      <div className="mx-auto max-w-[560px] app-enter">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--success)]/15 text-[var(--success)]">
          <CircleCheck className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-[1.8rem] font-semibold leading-tight text-white">
          Cel założony
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--text-muted)]">
          {preset
            ? preset.countsWhen === "defined"
              ? `Jest podpięty do warunku „${preset.subpointTitle}” i już się do niego liczy.`
              : `Jest podpięty do warunku „${preset.subpointTitle}”. Kreska etapu zapali się, gdy cel będzie ukończony z dowodem.`
            : "Jest na liście zespołu. Do etapu możesz go podpiąć później, z jego strony."}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-subtle)]">
          Następny krok: rozpisz, co trzeba zrobić, żeby do niego dojść.
        </p>
        <div className={cn("mt-8 flex flex-wrap items-center gap-3")}>
          <Button size="lg" href={`/app/goals/${goalId}#zadania`}>
            Rozpisz zadania
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="ghost" href="/app/goals">
            Wróć do celów
          </Button>
        </div>
      </div>
    </div>
  );
}
