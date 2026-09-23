"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteStartup } from "@/app/app/team/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/**
 * Jedyna operacja w aplikacji, po której nic nie da się odzyskać.
 *
 * Stąd przepisanie nazwy zamiast zwykłego „na pewno?" — przy nieodwracalnym
 * kasowaniu potwierdzenie musi wymagać uwagi, a nie jednego kliknięcia
 * w odruchu. Obok jest przypomnienie o pauzie i archiwum, żeby nikt nie
 * kasował startupu tylko dlatego, że chce zrobić przerwę.
 */
export function DeleteStartupButton({
  startupId,
  name,
}: {
  startupId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const matches = typed.trim() === name.trim();

  const confirm = () => {
    setError(null);
    startBusy(async () => {
      const result = await deleteStartup({ startupId, confirmName: typed });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/app");
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        Usuń startup
      </Button>

      {open ? (
        <Modal
          title={`Usunąć ${name}?`}
          description="Tego nie da się cofnąć. Znikną wszystkie odpowiedzi z etapów, otwarte role, zgłoszenia i cały skład zespołu."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Anuluj
              </Button>
              <Button
                variant="danger"
                loading={busy}
                disabled={!matches}
                onClick={confirm}
              >
                <Trash2 className="size-4" />
                Usuwam na zawsze
              </Button>
            </>
          }
        >
          <p className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
            Jeśli chcesz tylko zrobić przerwę, wybierz <strong>Wstrzymaj</strong>{" "}
            zamiast usuwania. Startup zniknie wtedy z Odkrywaj, ale wszystko
            zostanie na miejscu.
          </p>

          <Field
            label={`Przepisz nazwę startupu, żeby potwierdzić`}
            hint={`Dokładnie: ${name}`}
            error={typed.length > 0 && !matches ? "Nazwa się nie zgadza." : null}
          >
            {({ id }) => (
              <Input
                id={id}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={name}
                autoFocus
                autoComplete="off"
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
