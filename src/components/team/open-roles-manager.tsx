"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Plus, Trash2, UserPlus } from "lucide-react";
import {
  createOpenRole,
  deleteOpenRole,
  setOpenRoleState,
} from "@/app/app/team/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { OpenRole } from "@/lib/social";

type Props = {
  startupId: string;
  roles: OpenRole[];
  canManage: boolean;
};

/**
 * Otwarte role teamu — to, co joiner widzi w Discover.
 *
 * Zamknięcie roli zamiast kasowania jest celowe: zgłoszenia, które na nią
 * przyszły, nadal mają do czego się odwołać.
 */
export function OpenRolesManager({ startupId, roles, canManage }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

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

  const submit = () =>
    run(
      () =>
        createOpenRole({
          startupId,
          title,
          description,
          weeklyHours: hours.trim() ? Number(hours) : null,
        }),
      () => {
        setAdding(false);
        setTitle("");
        setDescription("");
        setHours("");
      }
    );

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-white">Otwarte role</h2>
          <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-subtle)]">
            To pierwsza rzecz, którą widzi ktoś, kto szuka teamu. Konkretna rola
            i liczba godzin działają wielokrotnie lepiej niż „szukamy ludzi”.
          </p>
        </div>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Dodaj rolę
          </Button>
        ) : null}
      </div>

      {error && !adding ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {roles.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-white/10 px-5 py-6 text-center text-[13px] text-[var(--text-subtle)]">
          {canManage
            ? "Nie szukacie teraz nikogo. Dodaj rolę, a team pojawi się w Odkrywaj wśród tych, które rekrutują."
            : "Ten team nie ma teraz otwartych ról."}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex flex-wrap items-start gap-4 rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4"
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
              </div>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        setOpenRoleState({
                          startupId,
                          roleId: role.id,
                          isOpen: !role.isOpen,
                        })
                      )
                    }
                  >
                    {role.isOpen ? "Zamknij" : "Otwórz"}
                  </Button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() => deleteOpenRole({ startupId, roleId: role.id }))
                    }
                    aria-label={`Usuń rolę ${role.title}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--text-faint)] transition-colors hover:bg-[var(--danger)]/12 hover:text-[var(--danger)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <Modal
          title="Kogo szukacie?"
          description="Jedna rola na wpis. Im konkretniej, tym lepsze zgłoszenia."
          onClose={() => setAdding(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setAdding(false)} disabled={busy}>
                Anuluj
              </Button>
              <Button onClick={submit} loading={busy} disabled={title.trim().length < 2}>
                Dodaj rolę
              </Button>
            </>
          }
        >
          <Field label="Nazwa roli" hint="Np. Frontend developer, Osoba od marketingu.">
            {({ id }) => (
              <Input
                id={id}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                placeholder="np. Frontend developer"
                autoFocus
              />
            )}
          </Field>

          <Field
            label="Ile godzin tygodniowo"
            hint="Opcjonalne, ale odsiewa nieporozumienia na samym starcie."
          >
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={80}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                placeholder="np. 10"
              />
            )}
          </Field>

          <Field
            label="Czym ta osoba będzie się zajmować"
            counter={{ value: description.length, max: 600 }}
          >
            {({ id }) => (
              <Textarea
                id={id}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
