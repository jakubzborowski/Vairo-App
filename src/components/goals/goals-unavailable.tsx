import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cele nie dały się wczytać. Stoi tam, gdzie miała być treść, po polsku
 * i z jednym wyjściem — zamiast pustej listy, która udaje, że celów nie ma.
 */
export function GoalsUnavailable({
  missingMigration,
  title = "Cele",
  href = "/app/goals",
}: {
  missingMigration: boolean;
  title?: string;
  href?: string;
}) {
  return (
    <div className="page">
      <h1 className="font-heading text-[1.65rem] font-semibold text-white">{title}</h1>
      <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[var(--danger)]/25 bg-[var(--danger)]/[0.07] p-5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
        <div>
          <p className="text-[15px] font-medium text-white">
            {missingMigration
              ? "Moduły pracy nie są jeszcze włączone w bazie"
              : `Nie udało się wczytać: ${title}`}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-muted)]">
            {missingMigration
              ? "Brakuje migracji 025. Wklej ją w Supabase → SQL Editor, po migracji 024. Dopiero wtedy da się zapisywać cele, dowody i zadania."
              : "Odśwież stronę. Jeśli komunikat wraca, sprawdź, czy migracja 025 jest odpalona w całości."}
          </p>
          {missingMigration ? null : (
            <Button className="mt-4" variant="secondary" href={href}>
              Odśwież
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
