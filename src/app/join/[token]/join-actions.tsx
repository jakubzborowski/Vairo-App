"use client";

import { useState, useTransition } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvite, dismissInvite, rememberInviteAndGo } from "./actions";

export function JoinActions({
  token,
  mode,
}: {
  token: string;
  /** `already` — ta osoba już jest w teamie; link tylko przełącza na niego. */
  mode: "guest" | "member" | "already";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-2.5">
      {mode === "guest" ? (
        <>
          <Button
            size="lg"
            disabled={pending}
            onClick={() => startTransition(() => rememberInviteAndGo(token, "register"))}
          >
            <UserPlus className="size-4" />
            Załóż konto i dołącz
          </Button>
          <Button
            variant="secondary"
            size="lg"
            disabled={pending}
            onClick={() => startTransition(() => rememberInviteAndGo(token, "login"))}
          >
            <LogIn className="size-4" />
            Mam konto — zaloguj się
          </Button>
        </>
      ) : (
        <>
          <Button
            size="lg"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await acceptInvite(token);
                if (result?.error) setError(result.error);
              })
            }
          >
            {mode === "already" ? null : <UserPlus className="size-4" />}
            {mode === "already"
              ? pending
                ? "Przechodzę…"
                : "Przejdź do zespołu"
              : pending
                ? "Dołączam…"
                : "Dołącz do zespołu"}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => startTransition(() => dismissInvite())}
          >
            Nie teraz
          </Button>
        </>
      )}
      {error ? (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
