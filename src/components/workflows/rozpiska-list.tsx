import Link from "next/link";
import { Flag, Plus, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/ui/module-header";
import { formatMoment, plural } from "@/components/goals/goal-format";
import type { RozpiskaRecord } from "@/lib/workflows";
import { WorkflowThumb } from "./workflow-thumb";

/**
 * Pierwszy ekran Rozpiski: lista planów z miniaturami, jak pliki w programie
 * do rysowania. Dawniej lista, wersje i karta dowodu walczyły o uwagę obok
 * płótna; teraz płótno ma własną stronę.
 */
export function RozpiskaList({
  records,
  goalTitles,
}: {
  records: RozpiskaRecord[];
  goalTitles: Record<string, string>;
}) {
  return (
    <div className="page-wide">
      <ModuleHeader
        title="Rozpiska"
        subtitle={
          records.length === 0
            ? "Plan pracy z bloczków i strzałek."
            : `${records.length} ${plural(records.length, "plan", "plany", "planów")} zespołu.`
        }
        action={
          records.length > 0 ? (
            <Button href="/app/workflows/new">
              <Plus className="size-4" />
              Nowa rozpiska
            </Button>
          ) : null
        }
      />

      {records.length === 0 ? (
        <section className="topo mt-6 rounded-[25px] border border-dashed border-white/10 px-6 py-9 sm:px-8">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-subtle)]">
            <Waypoints className="size-6" strokeWidth={1.5} />
          </span>
          <h2 className="mt-4 font-heading text-[17px] font-semibold text-white">
            Rozpisz pracę na kroki
          </h2>
          <div className="mt-3 flex max-w-xl flex-col gap-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
            <p>Bloczki to kroki, strzałki mówią, co po czym następuje.</p>
            <p>
              Strzałka niczego nie zmienia w celach i zadaniach — to plan do patrzenia
              i rozmowy, nie automat.
            </p>
            <p>Zapisana wersja może być dowodem, jeśli cel właśnie jej oczekuje.</p>
          </div>
          <Button className="mt-6" href="/app/workflows/new">
            <Plus className="size-4" />
            Nowa rozpiska
          </Button>
        </section>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <li key={record.id}>
              <Link
                href={`/app/workflows/${record.id}`}
                className="group block overflow-hidden rounded-[20px] border border-white/[0.07] bg-[var(--surface)] lift-1 lift-hover hover:border-white/15"
              >
                <div className="h-36 border-b border-white/[0.06] bg-[var(--bg)]/50 p-3">
                  <WorkflowThumb nodes={record.nodes} edges={record.edges} />
                </div>
                <div className="p-4">
                  <p className="truncate text-[15px] font-medium text-white">{record.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-[12.5px] text-[var(--text-muted)]">
                    <Flag className="size-3 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
                    {record.goalId && goalTitles[record.goalId]
                      ? `Dla celu „${goalTitles[record.goalId]}”`
                      : "Bez celu"}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--text-subtle)]">
                    Wersja {record.version} · zapisana {formatMoment(record.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/app/workflows/new"
              className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/12 text-[13.5px] text-[var(--text-muted)] transition-colors hover:border-white/25 hover:text-white"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nowa rozpiska
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
