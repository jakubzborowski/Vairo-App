"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateDbError } from "@/lib/db-errors";
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
  const [open, setOpen] = useState<"email" | "password" | null>(null);
  return (
    <>
      <Row icon={Mail} label="E-mail" value={email || "—"} onChange={() => setOpen("email")} />
      <Row icon={KeyRound} label="Hasło" value="••••••••••" border onChange={() => setOpen("password")} />
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
        Zmień
      </Button>
    </div>
  );
}

function EmailModal({ current, onClose }: { current: string; onClose: () => void }) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    const next = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setError("To nie wygląda na adres e-mail.");
      return;
    }
    if (next === current.trim().toLowerCase()) {
      setError("To jest Twój obecny adres.");
      return;
    }
    setError(null);
    start(async () => {
      const { error: authError } = await createClient().auth.updateUser({ email: next });
      if (authError) {
        setError(translateDbError(authError.message));
        return;
      }
      toast({
        title: "Sprawdź skrzynkę",
        description: `Wysłaliśmy link na ${next}. Adres zmieni się po jego kliknięciu.`,
      });
      onClose();
    });
  };

  return (
    <Modal
      title="Zmień adres e-mail"
      description="Na nowy adres przyjdzie link. Do czasu jego kliknięcia logujesz się starym."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={pending} onClick={submit}>
            Wyślij link
          </Button>
        </>
      }
    >
      <Field label="Nowy adres" error={error}>
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
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<{ password?: string; repeat?: string; form?: string }>({});
  const [pending, start] = useTransition();

  const submit = () => {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`;
    if (repeat !== password) next.repeat = "Hasła się różnią.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    start(async () => {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) {
        setErrors({
          form: authError.message.toLowerCase().includes("reauthent")
            ? "Ze względów bezpieczeństwa zaloguj się ponownie i spróbuj jeszcze raz."
            : (translateDbError(authError.message) ?? "Nie udało się zmienić hasła."),
        });
        return;
      }
      toast({ title: "Hasło zmienione", description: "Przy następnym logowaniu użyj nowego." });
      onClose();
    });
  };

  return (
    <Modal
      title="Zmień hasło"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={pending} onClick={submit}>
            Zapisz hasło
          </Button>
        </>
      }
    >
      <Field label="Nowe hasło" hint={`Co najmniej ${MIN_PASSWORD} znaków.`} error={errors.password}>
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
      <Field label="Powtórz hasło" error={errors.repeat}>
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
