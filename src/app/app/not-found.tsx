import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Nie ma tu tej strony — Vairo" };

/**
 * Brak strony w /app — cel, rozmowa, profil czy dokument, którego nie ma
 * albo który należy do innego zespołu. Te dwa przypadki wyglądają tu tak
 * samo celowo: „nie masz dostępu” zdradzałoby, że pod adresem coś jest.
 * Wcześniej kończyło się to angielską stroną Next.js bez menu.
 */
export default function AppNotFound() {
  return (
    <div className="page">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
        <SearchX className="size-8 text-[var(--text-subtle)]" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-[1.35rem] font-semibold text-white">
          Nie ma tu tej strony
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
          Mogła zostać usunięta albo należy do zespołu, w którym akurat nie
          jesteś. Sprawdź, czy w menu jest wybrany właściwy zespół.
        </p>
        <div className="mt-6">
          <Button href="/app">
            <ArrowLeft className="size-4" />
            Wróć na Start
          </Button>
        </div>
      </div>
    </div>
  );
}
