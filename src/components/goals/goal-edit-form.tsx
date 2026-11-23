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
import { COMMON_PROOF_KINDS, buildRequirement, optionsCount } from "./goal-options";

import { useT } from "@/i18n/client";
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
  const t = useT("goals");
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
    if (values.title.trim().length < 3) next.title = t("goalEditForm.napiszCoMaByc");
    if (!values.dueDate) next.dueDate = "Ustal termin.";
    if (values.label.trim().length < 2) next.label = t("goalEditForm.napiszJednymZdaniemCzego");
    if (values.kind === "select" && optionsCount(values.optionsText) < 2) {
      next.options = t("goalEditForm.potrzebneSaCoNajmniej");
    }
    setErrors(next);
    const problems = Object.keys(next).length;
    if (problems > 0) {
      setSaveError(
        problems === 1 ? t("goalEditForm.jednoPoleCzekaNa") : t("goalEditForm.problemsPolaCzekajaNa", { problems })
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
      toast({ title: t("goalEditForm.celZapisany") });
      onDone();
    });
  };

  return (
    <div className="mt-5">
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[var(--surface)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-white">{t("goalEditForm.edytujeszCel")}</p>
          <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
            {t("goalEditForm.zadaniaIMaterialyWroca")}
          </p>
        </div>
        {dirty ? null : (
          <Button size="sm" variant="ghost" onClick={onDone}>
            {t("goalEditForm.zamknijEdycje")}
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <Field label={t("goalEditForm.jakiWynikPokazecie")} error={errors.title}>
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

        <Field label={t("goalEditForm.opisOpcjonalnie")} hint={t("goalEditForm.kontekstDlaZespoluJesli")}>
          {({ id }) => (
            <Textarea
              id={id}
              rows={3}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-muted)]">{t("goalEditForm.wlasciciel")}</span>
            <MenuSelect
              ariaLabel={t("goalEditForm.wlasciciel")}
              value={values.ownerId}
              disabled={!canAssign}
              onChange={(value) => set("ownerId", value)}
              options={owners}
            />
            {!canAssign ? (
              <span className="text-[12px] text-[var(--text-subtle)]">
                {t("goalEditForm.osobeZmieniaFounderAlbo")}
              </span>
            ) : null}
          </div>
          <Field label={t("goalEditForm.termin")} error={errors.dueDate}>
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
              {t("goalEditForm.rodzajuWymagaWarunekSubpointtitle", { subpointTitle: typeLock.subpointTitle })}
            </span>
          ) : null}
        </div>

        <fieldset className="rounded-2xl border border-white/[0.08] p-4">
          <legend className="px-1 text-[13px] font-medium text-white">{t("goalEditForm.dowodKtoregoOczekujecie")}</legend>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-muted)]">{t("goalEditForm.wJakiejFormie")}</span>
              <MenuSelect
                ariaLabel={t("goalEditForm.formaDowodu")}
                value={values.kind}
                disabled={Boolean(kindLock)}
                onChange={(value) => set("kind", value as ProofKind)}
                options={kinds.map((kind) => ({ value: kind, label: t(`proofMeta.${kind}.label`) }))}
              />
              {kindLock ? (
                <span className="text-[12px] text-[var(--text-subtle)]">
                  {t("goalEditForm.formyWymagaWarunekSubpointtitle", { subpointTitle: kindLock.subpointTitle })}
                </span>
              ) : null}
            </div>
            <Field label={t("goalEditForm.coMaSieW")} error={errors.label}>
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
              <Field label={t("goalEditForm.mozliweOdpowiedzi")} hint={t("goalEditForm.kazdaWOsobnejLinijce")} error={errors.options}>
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

        <Field label={t("goalEditForm.notatkaDlaZespoluOpcjonalnie")}>
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
