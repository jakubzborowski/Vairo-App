import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getT } from "@/i18n/server";
/**
 * Cele nie dały się wczytać. Stoi tam, gdzie miała być treść, po polsku
 * i z jednym wyjściem — zamiast pustej listy, która udaje, że celów nie ma.
 */
export async function GoalsUnavailable({
  missingMigration,
  title: titleProp,
  href = "/app/goals",
}: {
  missingMigration: boolean;
  title?: string;
  href?: string;
}) {
  const t = await getT("goals");
  const title = titleProp ?? t("goalsUnavailable.title");
  return (
    <div className="page">
      <h1 className="font-heading text-[1.65rem] font-semibold text-white">{title}</h1>
      <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[var(--danger)]/25 bg-[var(--danger)]/[0.07] p-5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
        <div>
          <p className="text-[15px] font-medium text-white">
            {missingMigration
              ? t("goalsUnavailable.modulyPracyNieSa")
              : t("goalsUnavailable.nieUdaloSieWczytac", { title })}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-muted)]">
            {missingMigration
              ? t("goalsUnavailable.brakujeMigracji025Wklej")
              : t("goalsUnavailable.odswiezStroneJesliKomunikat")}
          </p>
          {missingMigration ? null : (
            <Button className="mt-4" variant="secondary" href={href}>
              {t("goalsUnavailable.odswiez")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
