"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FileText, Plus, ShieldCheck } from "lucide-react";
import { createFromTemplate } from "@/app/app/docs/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModuleHeader, SectionLabel } from "@/components/ui/module-header";
import { useToast } from "@/components/ui/toast";
import { plainPreview } from "@/lib/markdown";
import { DOC_TEMPLATES, type DocSummary } from "@/types/docs";

import { useT } from "@/i18n/client";
import { useDateFormat } from "@/components/goals/goal-format-hook";
/**
 * Półka z notatkami. Karta wygląda jak mała kartka: tytuł, pierwsze linijki
 * treści, kto i kiedy — notatkę rozpoznaje się po tym, co w niej jest.
 * Gotowe początki to mały rząd na górze: po kilku tygodniach półka będzie
 * pełna i to ona ma być widoczna, nie szablony.
 */
export function DocsShelf({ documents }: { documents: DocSummary[] }) {
  const { formatDay } = useDateFormat();
  const t = useT("docs");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const startFrom = (templateId: string) => {
    if (templateId === "blank") {
      router.push("/app/docs/new");
      return;
    }
    start(async () => {
      const result = await createFromTemplate(templateId);
      if (result.error || !("id" in result) || !result.id) {
        toast({
          tone: "error",
          title: t("docsShelf.nieUdaloSieZalozyc"),
          description: result.error ?? undefined,
        });
        return;
      }
      router.push(`/app/docs/${result.id}`);
    });
  };

  return (
    <div className="page-wide">
      <ModuleHeader
        title={t("docsShelf.dokumenty")}
        subtitle={
          documents.length === 0
            ? t("docsShelf.wspolneNotatkiZespolu")
            : t("docsShelf.count", { count: documents.length })
        }
        action={
          <Button href="/app/docs/new">
            <Plus className="size-4" />
            {t("docsShelf.nowyDokument")}
          </Button>
        }
      />

      <section className="mt-6">
        <SectionLabel>{t("docsShelf.gotowePoczatki")}</SectionLabel>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {DOC_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={pending}
              onClick={() => startFrom(template.id)}
              className="flex min-w-[190px] shrink-0 items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-3.5 py-3 text-left transition-colors hover:border-white/16 disabled:opacity-60"
            >
              <FilePlus2 className="mt-0.5 size-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
              <span>
                <span className="block text-[13.5px] font-medium text-white">{t(`template.${template.id}.label`)}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-subtle)]">
                  {t(`template.${template.id}.description`)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {documents.length === 0 ? (
        <section className="topo mt-6 rounded-[25px] border border-dashed border-white/10 px-6 py-9 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-subtle)]">
            <FileText className="size-6" strokeWidth={1.5} />
          </span>
          <h2 className="mt-4 font-heading text-[17px] font-semibold text-white">{t("docsShelf.polkaJestPusta")}</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
            {t("docsShelf.notatkiZeSpotkanWyniki")}
          </p>
        </section>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const preview = plainPreview(doc.body, 3);
            return (
              <li key={doc.id}>
                <Link
                  href={`/app/docs/${doc.id}`}
                  className="flex h-full min-h-[190px] flex-col rounded-[20px] border border-white/[0.07] bg-[var(--surface)] p-5 lift-1 lift-hover hover:border-white/15"
                >
                  <p className="line-clamp-2 font-heading text-[16px] font-semibold leading-snug text-white">
                    {doc.title}
                  </p>
                  <div className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--text-subtle)]">
                    {preview.length > 0 ? (
                      preview.map((line, index) => (
                        <p key={index} className="truncate">
                          {line}
                        </p>
                      ))
                    ) : (
                      <p>{t("docsShelf.pustyDokument")}</p>
                    )}
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-[12px] text-[var(--text-subtle)]">
                    <Avatar name={doc.authorName} size="xs" />
                    <span className="truncate">
                      {doc.authorName} · {formatDay(doc.updatedAt)}
                    </span>
                    {doc.usedAsProof ? (
                      <span
                        className="ml-auto inline-flex shrink-0 items-center gap-1 text-[var(--success)]"
                        title={t("docsShelf.tenDokumentJestDowodem")}
                      >
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        {t("docsShelf.dowod")}
                      </span>
                    ) : null}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
