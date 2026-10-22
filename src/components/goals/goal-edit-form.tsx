"use client";

import { useState, useTransition } from "react";
import { updateGoal } from "@/app/app/goals/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MenuSelect } from "@/components/ui/menu-select";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import type {
  GoalItem,
  GoalTypeOption,
  MilestoneCondition,
  ProofKind,
  TeamMemberOption,
} from "@/types/goals";
import { COMMON_PROOF_KINDS, PROOF_KIND_META, buildRequirement, optionsCount } from "./goal-options";

type Errors = Partial<Record<"title" | "dueDate" | "label" | "options", string>>;

/**
 * Tryb edycji dotyczy wyłącznie DEFINICJI celu: wynik, osoba, termin, typ,
 * oczekiwany dowód, notatka. Ma jeden zapis — SaveBar przypięty u dołu.
 * Zadania i materiały chowają się na ten czas, żeby nie mieszać dwóch
 * modeli zapisu na jednym ekranie.
 */
export function GoalEditForm({
  goal,
  members,
  goalTypes,
  conditions,
  canAssign,
  startupId,
  onDone,
}: {
  goal: GoalItem;
  members: TeamMemberOption[];
  goalTypes: GoalTypeOption[];
  conditions: MilestoneCondition[];
  canAssign: boolean;
  startupId: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const initial = {
    title: goal.title,
    description: goal.description ?? "",
    ownerId: goal.ownerId ?? "",
    dueDate: goal.dueDate,
    goalTypeId: goal.goalTypeId,
    kind: goal.proofRequirement.kind,
    label: goal.proofRequirement.label,
    optionsText: (goal.proofRequirement.options ?? []).map((option) => option.label).join("\n"),
    note: goal.note ?? "",
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some(
    (key) => values[key] !== initial[key]
  );

  // Warunek etapu, do którego cel jest podpięty, może wymagać typu i formy
  // dowodu. Wtedy te pola są zablokowane — zmiana po cichu odpięłaby cel
  // od postępu etapu.
  const linked = conditions.filter((condition) =>
    goal.conditions.some((ref) => ref.id === condition.id)
  );
  const typeLock = linked.find((condition) => !condition.matchAnyType) ?? null;
  const kindLock = linked.find((condition) => condition.proofKind) ?? null;
  const kinds: ProofKind[] = COMMON_PROOF_KINDS.includes(values.kind)
    ? COMMON_PROOF_KINDS
    : [...COMMON_PROOF_KINDS, values.kind];

  const owners = [
    ...(goal.ownerId && !members.some((member) => member.id === goal.ownerId)
      ? [{ value: goal.ownerId, label: goal.ownerName }]
      : []),
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

  const save = () => {
    const next: Errors = {};
    if (values.title.trim().length < 3) next.title = "Napisz, co ma być gotowe. Jedno zdanie wystarczy.";
    if (!values.dueDate) next.dueDate = "Ustal termin.";
    if (values.label.trim().length < 2) next.label = "Napisz jednym zdaniem, czego oczekujecie.";
    if (values.kind === "select" && optionsCount(values.optionsText) < 2) {
      next.options = "Potrzebne są co najmniej dwie odpowiedzi.";
    }
    setErrors(next);
    const problems = Object.keys(next).length;
    if (problems > 0) {
      setSaveError(
        problems === 1 ? "Jedno pole czeka na poprawkę." : `${problems} pola czekają na poprawkę.`
      );
      return;
    }
    setSaveError(null);

    const proofChanged =
      values.kind !== initial.kind ||
      values.label !== initial.label ||
      values.optionsText !== initial.optionsText;

    start(async () => {
      const result = await updateGoal({
        startupId,
        goalId: goal.id,
        title: values.title !== initial.title ? values.title : undefined,
        description: values.description !== initial.description ? values.description : undefined,
        ownerId: canAssign && values.ownerId !== initial.ownerId ? values.ownerId : undefined,
        dueDate: values.dueDate !== initial.dueDate ? values.dueDate : undefined,
        goalTypeId: values.goalTypeId !== initial.goalTypeId ? values.goalTypeId : undefined,
        proofRequirement: proofChanged
          ? buildRequirement(values.kind, values.label, values.optionsText)
          : undefined,
        note: values.note !== initial.note ? values.note : undefined,
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      toast({ title: "Cel zapisany" });
      onDone();
    });
  };

  return (
    <div className="mt-5">
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[var(--surface)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-white">Edytujesz cel</p>
          <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
            Zadania i materiały wrócą po zapisaniu albo odrzuceniu zmian.
          </p>
        </div>
        {dirty ? null : (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Zamknij edycję
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <Field label="Jaki wynik pokażecie?" error={errors.title}>
          {({ id, invalid }) => (
            <Input
              id={id}
              aria-invalid={invalid}
              value={values.title}
              maxLength={160}
              onChange={(event) => set("title", event.target.value)}
            />
          )}
        </Field>

        <Field label="Opis · opcjonalnie" hint="Kontekst dla zespołu, jeśli tytuł nie wystarcza.">
          {({ id }) => (
            <Textarea
              id={id}
              rows={3}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-muted)]">Właściciel</span>
            <MenuSelect
              ariaLabel="Właściciel"
              value={values.ownerId}
              disabled={!canAssign}
              onChange={(value) => set("ownerId", value)}
              options={owners}
            />
            {!canAssign ? (
              <span className="text-[12px] text-[var(--text-subtle)]">
                Osobę zmienia Founder albo Admin.
              </span>
            ) : null}
          </div>
          <Field label="Termin" error={errors.dueDate}>
            {({ id, invalid }) => (
              <Input
                id={id}
                type="date"
                aria-invalid={invalid}
                value={values.dueDate}
                onChange={(event) => set("dueDate", event.target.value)}
                className="[color-scheme:dark]"
              />
            )}
          </Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--text-muted)]">Rodzaj</span>
          <MenuSelect
            ariaLabel="Rodzaj"
            value={values.goalTypeId}
            disabled={Boolean(typeLock)}
            onChange={(value) => set("goalTypeId", value)}
            options={goalTypes.map((type) => ({ value: type.id, label: type.label }))}
          />
          {typeLock ? (
            <span className="text-[12px] text-[var(--text-subtle)]">
              Rodzaju wymaga warunek „{typeLock.subpointTitle}”. Zmienisz go po odpięciu.
            </span>
          ) : null}
        </div>

        <fieldset className="rounded-2xl border border-white/[0.08] p-4">
          <legend className="px-1 text-[13px] font-medium text-white">Dowód, którego oczekujecie</legend>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-muted)]">W jakiej formie</span>
              <MenuSelect
                ariaLabel="Forma dowodu"
                value={values.kind}
                disabled={Boolean(kindLock)}
                onChange={(value) => set("kind", value as ProofKind)}
                options={kinds.map((kind) => ({ value: kind, label: PROOF_KIND_META[kind].label }))}
              />
              {kindLock ? (
                <span className="text-[12px] text-[var(--text-subtle)]">
                  Formy wymaga warunek „{kindLock.subpointTitle}”.
                </span>
              ) : null}
            </div>
            <Field label="Co ma się w nim znaleźć" error={errors.label}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  aria-invalid={invalid}
                  value={values.label}
                  maxLength={200}
                  onChange={(event) => set("label", event.target.value)}
                />
              )}
            </Field>
            {values.kind === "select" ? (
              <Field label="Możliwe odpowiedzi" hint="Każda w osobnej linijce." error={errors.options}>
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    aria-invalid={invalid}
                    rows={3}
                    value={values.optionsText}
                    onChange={(event) => set("optionsText", event.target.value)}
                  />
                )}
              </Field>
            ) : null}
          </div>
        </fieldset>

        <Field label="Notatka dla zespołu · opcjonalnie">
          {({ id }) => (
            <Textarea
              id={id}
              rows={2}
              value={values.note}
              onChange={(event) => set("note", event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="h-6" />
      <SaveBar
        dirty={dirty || Boolean(saveError)}
        saving={pending}
        error={saveError}
        onSave={save}
        onDiscard={onDone}
      />
    </div>
  );
}
