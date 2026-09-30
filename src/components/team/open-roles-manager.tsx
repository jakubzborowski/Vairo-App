"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import {
  createOpenRole,
  deleteOpenRole,
  setOpenRoleState,
  updateOpenRole,
} from "@/app/app/team/actions";
import { SkillPicker, type SkillOption } from "@/components/social/skill-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import type { OpenRole } from "@/lib/social";

type Props = {
  startupId: string;
  roles: OpenRole[];
  canManage: boolean;
  /** Katalog umiejętności do wyboru przy roli. */
  skillCatalogue: SkillOption[];
};

/** Pusty formularz — jeden kształt dla dodawania i edycji. */
type Draft = {
  roleId: string | null;
  title: string;
  hours: string;
  description: string;
  skillIds: string[];
};

const EMPTY: Draft = {
  roleId: null,
  title: "",
  hours: "",
  description: "",
  skillIds: [],
};

/**
 * Otwarte role teamu — to, co joiner widzi w Odkrywaj.
 *
 * Dwie rzeczy, których tu wcześniej nie było, a które są sednem tej sekcji:
 *
 * **Umiejętności przy roli.** Tabela `startup_open_role_skills` istniała od
 * migracji 009, widok publiczny wystawiał `open_roles[].skills`, karta teamu
 * była gotowa je pokazać — i nic ich nie zapisywało. Kolumna w bazie, której
 * żaden formularz nie wypełnia, to dokładnie ta sama klasa błędu co przycisk,
 * który nic nie robi. Bez nich karta w Odkrywaj nie ma jak powiedzieć „ta rola
 * pyta o React, a Ty masz React w profilu" — zostaje sama nazwa stanowiska,
 * czyli to, od czego mieliśmy uciec.
 *
 * **Edycja.** Wcześniej literówkę w nazwie roli dało się poprawić wyłącznie
 * przez skasowanie jej i wpisanie od nowa — a to zrywa powiązanie ze
 * zgłoszeniami, które na tę rolę przyszły. Zamknięcie roli zamiast kasowania
 * jest z tego samego powodu: historia ma do czego się odwołać.
 */
export function OpenRolesManager({
  startupId,
  roles,
  canManage,
  skillCatalogue,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [catalogue, setCatalogue] = useState(skillCatalogue);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const editing = draft?.roleId != null;

  const run = (fn: () => Promise<{ error: string | null }>, after?: () => void) => {
    setError(null);
    startBusy(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      after?.();
      router.refresh();
    });
  };

  const submit = () => {
    if (!draft) return;
    const payload = {
      startupId,
      title: draft.title,
      description: draft.description,
      weeklyHours: draft.hours.trim() ? Number(draft.hours) : null,
      skillIds: draft.skillIds,
    };
    run(
      () =>
        draft.roleId
          ? updateOpenRole({ ...payload, roleId: draft.roleId })
          : createOpenRole(payload),
      () => setDraft(null)
    );
  };

  return (
    // Karta, nie sekcja z marginesem. Ten komponent stoi teraz w prawej
    // kolumnie obok składu, więc musi mieć tę samą budowę: pasek nagłówka
    // z licznikiem i akcją, pod nim treść. Inaczej jedna kolumna miałaby
    // ramkę, a druga nie, i całość wyglądałaby na przypadek.
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        {/* Bez akapitu pod nagłówkiem. To, po co są otwarte role, mówi pusty
            stan — czyli wtedy, kiedy ta wiedza jest komuś potrzebna. Gdy role
            już są, zdanie o tym, jak ważne są role, jest tylko szumem nad
            listą, którą i tak się czyta. */}
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          <UserPlus className="size-4" />
          Otwarte role
          {roles.length > 0 ? (
            <span className="tabular font-normal normal-case tracking-normal text-[var(--text-faint)]">
              {roles.length}
            </span>
          ) : null}
        </h2>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={() => setDraft(EMPTY)}>
            <Plus className="size-4" />
            Dodaj rolę
          </Button>
        ) : null}
      </div>

      <div className="p-4">
      {error && !draft ? (
        <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {roles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-5 py-6 text-center text-[13px] leading-relaxed text-[var(--text-subtle)]">
          {canManage
            ? "Nie szukacie teraz nikogo. Dodaj rolę, a team pojawi się w Odkrywaj wśród tych, które rekrutują."
            : "Ten team nie ma teraz otwartych ról."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex flex-wrap items-start gap-3 rounded-xl bg-[var(--surface-2)]/60 p-3.5"
            >
              <UserPlus
                className="mt-0.5 size-4 shrink-0 text-[var(--vairo)]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-white">
                  {role.title}
                  {role.weeklyHours ? (
                    <span className="text-[12.5px] font-normal text-[var(--text-subtle)]">
                      {role.weeklyHours} h tygodniowo
                    </span>
                  ) : null}
                  {!role.isOpen ? (
                    <Badge>
                      <EyeOff className="size-3" />
                      Zamknięta
                    </Badge>
                  ) : null}
                </p>
                {role.description ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                    {role.description}
                  </p>
                ) : null}

                {role.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.skills.map((skill) => (
                      <Pill key={skill.id}>{skill.label}</Pill>
                    ))}
                  </div>
                ) : canManage ? (
                  // Brak umiejętności nie jest błędem, ale ma konkretny skutek,
                  // więc mówimy o nim tam, gdzie da się go naprawić.
                  <p className="mt-2 text-[12.5px] text-[var(--text-faint)]">
                    Bez umiejętności ta rola nie dopasuje się do niczyjego
                    profilu w Odkrywaj.
                  </p>
                ) : null}
              </div>

              {canManage ? (
                <Menu label={`Zarządzaj rolą: ${role.title}`}>
                  {(close) => (
                    <>
                      <MenuItem
                        icon={Pencil}
                        onClick={() => {
                          setDraft({
                            roleId: role.id,
                            title: role.title,
                            hours: role.weeklyHours ? String(role.weeklyHours) : "",
                            description: role.description ?? "",
                            skillIds: role.skills.map((skill) => skill.id),
                          });
                          close();
                        }}
                      >
                        Edytuj
                      </MenuItem>

                      <MenuItem
                        icon={role.isOpen ? EyeOff : Eye}
                        disabled={busy}
                        onClick={() => {
                          run(() =>
                            setOpenRoleState({
                              startupId,
                              roleId: role.id,
                              isOpen: !role.isOpen,
                            })
                          );
                          close();
                        }}
                      >
                        {role.isOpen ? "Zamknij nabór" : "Otwórz nabór"}
                      </MenuItem>

                      <MenuSeparator />
                      <MenuItem
                        icon={Trash2}
                        tone="danger"
                        disabled={busy}
                        title="Zgłoszenia na tę rolę stracą do czego się odwołać"
                        onClick={() => {
                          run(() => deleteOpenRole({ startupId, roleId: role.id }));
                          close();
                        }}
                      >
                        Usuń rolę
                      </MenuItem>
                    </>
                  )}
                </Menu>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      </div>

      {draft ? (
        <Modal
          title={editing ? "Zmień rolę" : "Kogo szukacie?"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
                Anuluj
              </Button>
              <Button
                onClick={submit}
                loading={busy}
                disabled={draft.title.trim().length < 2}
                title={
                  draft.title.trim().length < 2
                    ? "Wpisz nazwę roli — co najmniej 2 znaki"
                    : undefined
                }
              >
                {editing ? "Zapisz zmiany" : "Dodaj rolę"}
              </Button>
            </>
          }
        >
          {/* Podpowiedzi zostały tylko tam, gdzie pole ich naprawdę wymaga.
              „Nazwa roli" z podpowiedzią „np. Frontend developer" powtarzała
              placeholder innymi słowami — a podpowiedź, która powtarza to, co
              i tak widać, uczy pomijać wszystkie podpowiedzi. */}
          <Field label="Nazwa roli">
            {({ id }) => (
              <Input
                id={id}
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                maxLength={80}
                placeholder="np. Frontend developer"
                autoFocus
              />
            )}
          </Field>

          <Field label="Ile godzin tygodniowo" hint="Opcjonalne">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={80}
                value={draft.hours}
                onChange={(event) =>
                  setDraft({ ...draft, hours: event.target.value })
                }
                placeholder="np. 10"
              />
            )}
          </Field>

          {/* Jedyne pole roli, które da się porównać maszynowo — i dlatego
              jedyne, dzięki któremu Odkrywaj potrafi powiedzieć komuś wprost,
              że ta rola pyta o to, co on ma w profilu. */}
          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--text-muted)]">
              Jakich umiejętności szukacie
              <span className="ml-2 font-normal text-[var(--text-faint)]">
                po tym dopasujemy ludzi
              </span>
            </p>
            <SkillPicker
              skills={catalogue}
              selectedIds={draft.skillIds}
              onChange={(skillIds) => setDraft({ ...draft, skillIds })}
              onSkillCreated={(skill) => setCatalogue((prev) => [...prev, skill])}
            />
          </div>

          <Field
            label="Czym ta osoba będzie się zajmować"
            hint="Opcjonalne"
            counter={{ value: draft.description.length, max: 600 }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                rows={4}
                maxLength={600}
                placeholder="Np. Zbudowanie panelu rezerwacji w Next.js. Projekt graficzny mamy gotowy."
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
    </section>
  );
}
