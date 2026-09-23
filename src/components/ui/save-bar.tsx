"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveBarProps = {
  /** Widoczny tylko przy niezapisanych zmianach — inaczej nie zajmuje miejsca. */
  dirty: boolean;
  saving?: boolean;
  error?: string | null;
  /** Krótkie potwierdzenie po udanym zapisie. */
  savedAt?: number | null;
  onSave: () => void;
  onDiscard: () => void;
};

/**
 * Jeden wzorzec zapisu dla całej aplikacji.
 *
 * Zastępuje to, co było na stronie profilu: „Skip", „Continue" oraz trio
 * ✗ / 💾 / ✓ — pięć przycisków, z których trzy robiły wariacje tego samego
 * zapisu, a dwa pochodziły z zupełnie innych ekranów.
 */
export function SaveBar({
  dirty,
  saving,
  error,
  savedAt,
  onSave,
  onDiscard,
}: SaveBarProps) {
  const showSaved = !dirty && !error && Boolean(savedAt);

  if (!dirty && !error && !showSaved) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky bottom-4 z-30 mx-auto flex w-fit max-w-full items-center gap-3",
        "rounded-2xl border px-4 py-3 backdrop-blur",
        error
          ? "border-[var(--danger)]/30 bg-[var(--danger)]/10"
          : "border-white/12 bg-[var(--surface-2)]/95 shadow-[0_8px_32px_rgba(0,0,0,.5)]"
      )}
    >
      {error ? (
        <>
          <AlertCircle className="size-4 shrink-0 text-[var(--danger)]" />
          <p className="text-[13px] text-[var(--danger)]">{error}</p>
          <Button size="sm" variant="secondary" onClick={onSave}>
            Spróbuj ponownie
          </Button>
        </>
      ) : showSaved ? (
        <>
          <CheckCircle2 className="size-4 shrink-0 text-[var(--success)]" />
          <p className="text-[13px] text-[var(--text-muted)]">Zapisano</p>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[var(--text-muted)]">
            Masz niezapisane zmiany
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving}>
              Odrzuć
            </Button>
            <Button size="sm" onClick={onSave} loading={saving}>
              Zapisz
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
