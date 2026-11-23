"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDbError } from "@/lib/use-db-error";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const MIN_PASSWORD = 8;

/**
 * Zmiana e-maila i hasła — przez Supabase Auth, bez naszej bazy.
 *
 * E-mail zmienia się dopiero po kliknięciu linku wysłanego na NOWY adres
 * (i, zależnie od ustawień projektu, na stary) — mówimy to wprost, zanim
 * ktoś pomyśli, że zmiana nie zadziałała.
 */
export function CredentialsRows({ email }: { email: string }) {
  const t = useT("settings");
  const [open, setOpen] = useState<"email" | "password" | null>(null);
  return (
    <>
      <Row icon={Mail} label={t("credentials.email")} value={email || "—"} onChange={() => setOpen("email")} />
      <Row icon={KeyRound} label={t("credentials.password")} value="••••••••••" border onChange={() => setOpen("password")} />
      {open === "email" ? <EmailModal current={email} onClose={() => setOpen(null)} /> : null}
      {open === "password" ? <PasswordModal onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  border,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  border?: boolean;
  onChange: () => void;
}) {
  const t = useT("settings");
  return (
    <div className={"flex items-center gap-3.5 px-5 py-4 " + (border ? "border-t border-white/[0.05]" : "")}>
      <span className="hidden size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--surface-2)] text-[var(--text-muted)] sm:inline-flex">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 truncate text-[15px] text-white">{value}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={onChange}>
        {t("credentials.change")}
      </Button>
    </div>
  );
}

function EmailModal({ current, onClose }: { current: string; onClose: () => void }) {
  const t = useT("settings");
  const tc = useT("common");
  const dbError = useDbError();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    const next = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setError(t("credentials.invalidEmail"));
      return;
    }
    if (next === current.trim().toLowerCase()) {
      setError(t("credentials.sameEmail"));
      return;
    }
    setError(null);
    start(async () => {
      const { error: authError } = await createClient().auth.updateUser({ email: next });
      if (authError) {
        setError(dbError(authError.message));
        return;
      }
      toast({
        title: t("credentials.emailSentTitle"),
        description: t("credentials.emailSentBody", { email: next }),
      });
      onClose();
    });
  };

  return (
    <Modal
      title={t("credentials.emailTitle")}
      description={t("credentials.emailDescription")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button loading={pending} onClick={submit}>
            {t("credentials.sendLink")}
          </Button>
        </>
      }
    >
      <Field label={t("credentials.newEmail")} error={error}>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            aria-invalid={invalid}
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
        )}
      </Field>
    </Modal>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const t = useT("settings");
  const tc = useT("common");
  const dbError = useDbError();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<{ password?: string; repeat?: string; form?: string }>({});
  const [pending, start] = useTransition();

  const submit = () => {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = t("credentials.passwordTooShort", { count: MIN_PASSWORD });
    if (repeat !== password) next.repeat = t("credentials.passwordMismatch");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    start(async () => {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) {
        setErrors({
          form: authError.message.toLowerCase().includes("reauthent")
            ? t("credentials.reauthenticate")
            : (dbError(authError.message) ?? t("credentials.passwordFailed")),
        });
        return;
      }
      toast({ title: t("credentials.passwordChanged"), description: t("credentials.passwordChangedBody") });
      onClose();
    });
  };

  return (
    <Modal
      title={t("credentials.passwordTitle")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button loading={pending} onClick={submit}>
            {t("credentials.savePassword")}
          </Button>
        </>
      }
    >
      <Field label={t("credentials.newPassword")} hint={t("credentials.passwordHint", { count: MIN_PASSWORD })} error={errors.password}>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-invalid={invalid}
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>
      <Field label={t("credentials.repeatPassword")} error={errors.repeat}>
        {({ id, invalid }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-invalid={invalid}
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
        )}
      </Field>
      {errors.form ? (
        <p role="alert" className="text-[13px] text-[var(--danger)]">
          {errors.form}
        </p>
      ) : null}
    </Modal>
  );
}
