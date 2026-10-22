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
import { formatDay, plural } from "@/components/goals/goal-format";
import { plainPreview } from "@/lib/markdown";
import { DOC_TEMPLATES, type DocSummary } from "@/types/docs";

/**
 * Półka z notatkami. Karta wygląda jak mała kartka: tytuł, pierwsze linijki
 * treści, kto i kiedy — notatkę rozpoznaje się po tym, co w niej jest.
 * Gotowe początki to mały rząd na górze: po kilku tygodniach półka będzie
 * pełna i to ona ma być widoczna, nie szablony.
 */
export function DocsShelf({ documents }: { documents: DocSummary[] }) {
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
          title: "Nie udało się założyć dokumentu",
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
        title="Dokumenty"
        subtitle={
          documents.length === 0
            ? "Wspólne notatki zespołu."
            : `${documents.length} ${plural(documents.length, "dokument", "dokumenty", "dokumentów")} zespołu.`
        }
        action={
          <Button href="/app/docs/new">
            <Plus className="size-4" />
            Nowy dokument
          </Button>
        }
      />

      <section className="mt-6">
        <SectionLabel>Gotowe początki</SectionLabel>
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
                <span className="block text-[13.5px] font-medium text-white">{template.label}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-subtle)]">
                  {template.description}
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
          <h2 className="mt-4 font-heading text-[17px] font-semibold text-white">Półka jest pusta</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
            Notatki ze spotkań, wyniki rozmów, decyzje — wszystko, co zespół chce mieć w jednym
            miejscu. Zacznij od pustej kartki albo od jednego z początków wyżej.
          </p>
        </section>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      <p>Pusty dokument</p>
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
                        title="Ten dokument jest dowodem ukończonego celu"
                      >
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        Dowód
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
