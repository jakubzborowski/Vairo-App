"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LifeBuoy, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Ekran błędu dla całego /app. Do tej pory nieobsłużony wyjątek kończył się
 * domyślną stroną Next.js po angielsku — bez wyjścia i bez sposobu, żeby
 * komuś o tym powiedzieć. Teraz: spróbuj jeszcze raz albo zgłoś, z adresem
 * strony już dopisanym do zgłoszenia.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Samo `reset()` renderuje ponownie tylko klienta — błąd z komponentu
  // serwerowego wróciłby od razu. `refresh()` pobiera stronę jeszcze raz.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="page">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
        <TriangleAlert className="size-8 text-[var(--warning)]" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-[1.35rem] font-semibold text-white">
          Coś poszło nie tak
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
          Ta strona nie wczytała się poprawnie. To błąd po naszej stronie, nie
          Twój — zapisane odpowiedzi są bezpieczne.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry}>
            <RotateCcw className="size-4" />
            Spróbuj ponownie
          </Button>
          <Button
            variant="secondary"
            href={`/app/help?kind=bug&from=${encodeURIComponent(pathname)}${error.digest ? `&code=${encodeURIComponent(error.digest)}` : ""}`}
          >
            <LifeBuoy className="size-4" />
            Zgłoś problem
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-4 text-[12px] text-[var(--text-subtle)]">Kod błędu: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
