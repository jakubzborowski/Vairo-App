"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnAccount } from "@/app/app/settings/account/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/i18n/client";

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
  const t = useT("settings");
  const tc = useT("common");
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
        {t("delete.open")}
      </Button>

      {open ? (
        <Modal
          title={t("delete.title")}
          description={t("delete.description")}
          onClose={() => setOpen(false)}
          footer={
            <>
              {!matches ? (
                <p className="mr-auto text-[12.5px] text-[var(--text-subtle)]">
                  {typed.length === 0 ? t("delete.typeFirst") : t("delete.notYet")}
                </p>
              ) : null}
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                {tc("actions.cancel")}
              </Button>
              <Button
                variant="danger"
                loading={busy}
                disabled={!matches}
                onClick={confirm}
              >
                <Trash2 className="size-4" />
                {soleFounderOf.length === 1 ? t("delete.confirmWith", { name: soleFounderOf[0] }) : t("delete.confirm")}
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3.5">
            <p className="text-[13px] font-medium text-white">{t("delete.whatGoes")}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
              <li>{t("delete.goesProfile")}</li>
              <li>{t("delete.goesConversations")}</li>
              {teamCount > 0 ? (
                <li>{t("delete.goesMemberships", { count: teamCount })}</li>
              ) : null}
              {soleFounderOf.length > 0 ? (
                <li className="text-[var(--danger)]">
                  <strong>
                    {t("delete.soleFounder", { count: soleFounderOf.length })}:
                  </strong>{" "}
                  {t("delete.soleFounderList", { names: soleFounderOf.join(", ") })}
                </li>
              ) : null}
            </ul>
          </div>

          {soleFounderOf.length > 0 ? (
            <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--warning)]">
              {t("delete.handOver")}{" "}
              <Link href="/app/team" className="font-medium text-white underline underline-offset-4">
                {t("delete.handOverLink")}
              </Link>
            </p>
          ) : null}

          <Field
            label={t("delete.typeEmail")}
            hint={email}
            error={typed.length > 0 && !matches ? t("delete.mismatch") : null}
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
