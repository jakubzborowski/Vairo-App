"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { renameStartup } from "@/app/app/team/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/i18n/client";

/**
 * Okno zmiany nazwy zespołu — jedno pole, jedna akcja.
 *
 * Walidacja dopiero po kliknięciu „Zapisz": licznik znaków mówi o limicie
 * z góry, a komunikat błędu pojawia się tylko wtedy, gdy zapis się nie uda.
 */
export function RenameTeamDialog({
  startupId,
  name,
  onClose,
}: {
  startupId: string;
  name: string;
  onClose: () => void;
}) {
  const t = useT("team");
  const tc = useT("common");
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const unchanged = value.trim() === name.trim();

  const save = () => {
    if (unchanged) {
      onClose();
      return;
    }
    setError(null);
    startBusy(async () => {
      const result = await renameStartup({ startupId, name: value });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast({ title: t("rename.done"), description: value.trim() });
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      title={t("rename.title")}
      description={t("rename.body")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {tc("actions.cancel")}
          </Button>
          <Button loading={busy} onClick={save}>
            <Check className="size-4" />
            {t("rename.save")}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Field
          label={t("rename.label")}
          error={error}
          counter={{ value: value.trim().length, max: 80 }}
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              aria-invalid={invalid}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={80}
              autoFocus
              autoComplete="off"
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
