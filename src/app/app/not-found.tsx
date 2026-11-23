import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  const t = await getT("common");
  return { title: t("notFound.metaTitle") };
}

/**
 * Brak strony w /app — cel, rozmowa, profil czy dokument, którego nie ma
 * albo który należy do innego zespołu. Te dwa przypadki wyglądają tu tak
 * samo celowo: „nie masz dostępu” zdradzałoby, że pod adresem coś jest.
 * Wcześniej kończyło się to angielską stroną Next.js bez menu.
 */
export default async function AppNotFound() {
  const t = await getT("common");
  return (
    <div className="page">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
        <SearchX className="size-8 text-[var(--text-subtle)]" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-[1.35rem] font-semibold text-white">
          {t("notFound.title")}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-muted)]">
          {t("notFound.appBody")}
        </p>
        <div className="mt-6">
          <Button href="/app">
            <ArrowLeft className="size-4" />
            {t("notFound.backToStart")}
          </Button>
        </div>
      </div>
    </div>
  );
}
