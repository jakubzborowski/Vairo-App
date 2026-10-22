"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnAccount } from "@/app/app/settings/account/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type Props = {
  email: string;
  /** Startupy, w których user jest jedynym Founderem — znikną razem z kontem. */
  soleFounderOf: string[];
  teamCount: number;
};

/**
 * Usunięcie konta.
 *
 * Potwierdzenie przez przepisanie adresu e-mail, bo po tej operacji nie ma
 * czego przywrócić. Zanim się pojawi, modal wypisuje konkretnie, co zniknie —
 * w szczególności startupy, w których ta osoba jest jedynym Founderem.
 * „Usuwając konto tracisz dane" bez tej listy nikomu nic nie mówi.
 */
export function DeleteAccountButton({ email, soleFounderOf, teamCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();

  const confirm = () => {
    setError(null);
    startBusy(async () => {
      const result = await deleteOwnAccount(typed);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[var(--danger-text)] hover:text-[var(--danger-text)]"
      >
        Usuń konto…
      </Button>

      {open ? (
        <Modal
          title="Usunąć konto na zawsze?"
          description="Tego nie da się cofnąć. Nie ma kosza ani okresu na rozmyślenie się."
          onClose={() => setOpen(false)}
          footer={
            <>
              {!matches ? (
                <p className="mr-auto text-[12.5px] text-[var(--text-subtle)]">
                  {typed.length === 0 ? "Najpierw wpisz swój adres." : "Adres jeszcze się nie zgadza."}
                </p>
              ) : null}
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
                {soleFounderOf.length === 1 ? `Usuń konto i ${soleFounderOf[0]}` : "Usuń konto"}
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3.5">
            <p className="text-[13px] font-medium text-white">Co zniknie</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              <li>Twój profil publiczny, zdjęcie i umiejętności.</li>
              <li>Wszystkie rozmowy, zaczepki i zaproszenia.</li>
              {teamCount > 0 ? (
                <li>
                  Członkostwo w{" "}
                  {teamCount === 1 ? "jednym teamie" : `${teamCount} teamach`}.
                </li>
              ) : null}
              {soleFounderOf.length > 0 ? (
                <li className="text-[var(--danger)]">
                  <strong>
                    {soleFounderOf.length === 1
                      ? "Startup, w którym jesteś jedynym Founderem"
                      : "Startupy, w których jesteś jedynym Founderem"}
                    :
                  </strong>{" "}
                  {soleFounderOf.join(", ")} — razem z całą pracą zespołu.
                </li>
              ) : null}
            </ul>
          </div>

          {soleFounderOf.length > 0 ? (
            <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--warning)]">
              Jeśli ten projekt ma żyć dalej, najpierw przekaż komuś rolę
              Foundera w składzie teamu. Wtedy startup zostanie, a Ty tylko
              z niego wyjdziesz.{" "}
              <Link href="/app/team" className="font-medium text-white underline underline-offset-4">
                Przekaż rolę Foundera w Team
              </Link>
            </p>
          ) : null}

          <Field
            label="Przepisz swój adres e-mail, żeby potwierdzić"
            hint={email}
            error={typed.length > 0 && !matches ? "Adres się nie zgadza." : null}
          >
            {({ id }) => (
              <Input
                id={id}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={email}
                autoComplete="off"
                autoFocus
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
