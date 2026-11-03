"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publicSupportEmail } from "@/types/support";

/**
 * Błąd poza /app — onboarding, link zaproszenia, logowanie. /app ma własny
 * ekran z wejściem do „Pomoc i opinie”; tu ktoś może nie mieć jeszcze konta,
 * więc zostaje mail.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const supportEmail = publicSupportEmail();

  useEffect(() => {
    console.error("[root]", error);
  }, [error]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-5 py-16 text-center">
      <h1 className="font-heading text-[1.5rem] font-semibold text-white">Coś poszło nie tak</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--text-muted)]">
        Ta strona nie wczytała się poprawnie. To błąd po naszej stronie — spróbuj
        jeszcze raz za chwilę.
      </p>
      <div className="mt-6">
        <Button
          onClick={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
        >
          Spróbuj ponownie
        </Button>
      </div>
      {supportEmail ? (
        <p className="mt-6 text-[13px] text-[var(--text-subtle)]">
          Dalej nie działa? Napisz na{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-[var(--text-muted)] underline underline-offset-2 hover:text-white"
          >
            {supportEmail}
          </a>
          {error.digest ? ` i podaj kod ${error.digest}` : ""}.
        </p>
      ) : error.digest ? (
        <p className="mt-6 text-[12px] text-[var(--text-subtle)]">Kod błędu: {error.digest}</p>
      ) : null}
    </main>
  );
}
