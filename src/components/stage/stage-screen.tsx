"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Lock,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  PlayCircle,
  Save,
  Undo2,
  RotateCcw,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  closeStage,
  reopenStage,
  saveSubpointAnswers,
} from "@/app/app/stage/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STAGES_WITH_DECISION,
  type StageDecision,
  type StagePoint,
  type StageSubpoint,
  type StageTree,
} from "@/types/stage";
import { ROLE_LABELS, type StartupRole } from "@/types/startup";
import { StageCloseDialog } from "./stage-close-dialog";
import { SubpointModal } from "./subpoint-modal";

type Props = {
  tree: StageTree;
  role: StartupRole;
  /** Czy to jest etap, nad którym startup pracuje teraz. */
  isCurrent?: boolean;
  /** Tytuł bieżącego etapu — do powrotu, gdy oglądamy inny. */
  currentTitle?: string | null;
  /** Podpunkt do otwarcia od razu, np. po powrocie z Plików. */
  initialSubpointId?: string | null;
};

function locateSubpoint(tree: StageTree, subpointId?: string | null) {
  if (!subpointId) return null;
  for (const category of tree.categories) {
    for (const point of category.points) {
      const subpoint = point.subpoints.find((item) => item.id === subpointId);
      if (subpoint) {
        return { categoryKey: category.key, pointKey: point.key, subpoint };
      }
    }
  }
  return null;
}

/**
 * Ekran etapu.
 *
 * Ambition ma dwie listy (punkty → podpunkty), Idea trzy (kategorie → punkty →
 * podpunkty) — o tym decyduje `showCategories`, a nie osobny komponent.
 * Panel Guide pojawia się tylko wtedy, gdy punkt naprawdę ma przewodnik.
 *
 * Rola Członka daje pełny odczyt i zero zapisu: zamiast wyszarzonego formularza
 * ten sam ekran pokazuje odpowiedzi jako treść do przeczytania.
 */
export function StageScreen({
  tree,
  role,
  isCurrent = true,
  currentTitle,
  initialSubpointId,
}: Props) {
  const router = useRouter();
  const located = locateSubpoint(tree, initialSubpointId);
  const [categoryKey, setCategoryKey] = useState(
    () =>
      located?.categoryKey ??
      tree.categories.find((c) => !c.isComplete)?.key ??
      tree.categories[0]?.key ??
      ""
  );
  const category = tree.categories.find((c) => c.key === categoryKey) ?? tree.categories[0];

  const [pointKey, setPointKey] = useState(
    () =>
      located?.pointKey ??
      category?.points.find((p) => !p.isComplete)?.key ??
      category?.points[0]?.key ??
      ""
  );
  const point = category?.points.find((p) => p.key === pointKey) ?? category?.points[0];

  const [openSubpoint, setOpenSubpoint] = useState<StageSubpoint | null>(
    () => located?.subpoint ?? null
  );
  const [guideOpen, setGuideOpen] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState(tree.answers);
  const [saving, startSaving] = useTransition();

  const percent = tree.total > 0 ? Math.round((tree.done / tree.total) * 100) : 0;
  const hasGuide = Boolean(point?.guideBody);
  const readOnly = !tree.canEdit;
  const isCompleted = tree.status === "completed";
  const needsDecision = STAGES_WITH_DECISION.includes(tree.templateKey);

  // Pierwszy nieukończony podpunkt w całym etapie. Przy siedemdziesięciu
  // pozycjach równa lista nie mówi, od czego zacząć — jedna wyróżniona mówi.
  const next = findNext(tree);
  // Pierwsze wejście: nikt jeszcze niczego nie zapisał. Zamiast trzech kolumn
  // bez kontekstu pokazujemy najpierw, czym ten etap w ogóle jest.
  const isFirstVisit = tree.done === 0 && !readOnly && !isCompleted;
  const pointCount = tree.categories.reduce(
    (sum, category) => sum + category.points.length,
    0
  );

  const openNext = () => {
    if (!next) return;
    setCategoryKey(next.categoryKey);
    setPointKey(next.pointKey);
    setError(null);
    setOpenSubpoint(next.subpoint);
  };

  const selectCategory = (key: string) => {
    setCategoryKey(key);
    const target = tree.categories.find((c) => c.key === key);
    setPointKey(
      target?.points.find((p) => !p.isComplete)?.key ?? target?.points[0]?.key ?? ""
    );
  };

  const onSave = (draft: Record<string, unknown>) => {
    if (!openSubpoint) return;
    setError(null);
    startSaving(async () => {
      const result = await saveSubpointAnswers({
        startupStageId: tree.startupStageId,
        subpointId: openSubpoint.id,
        answers: draft,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setAnswers((prev) => ({ ...prev, ...draft }));
      setOpenSubpoint(null);
      router.refresh();
    });
  };

  const onFinish = () => {
    setError(null);
    // Idea Stage kończy się decyzją, nie samym kliknięciem „gotowe".
    if (needsDecision) {
      setClosing(true);
      return;
    }
    startSaving(async () => {
      const result = await closeStage({
        startupStageId: tree.startupStageId,
        decision: "continue",
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(result.next ?? "/app");
      router.refresh();
    });
  };

  const onDecision = (input: {
    decision: StageDecision;
    note: string;
    reopenSubpointIds: string[];
  }) => {
    setError(null);
    startSaving(async () => {
      const result = await closeStage({
        startupStageId: tree.startupStageId,
        ...input,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setClosing(false);
      router.push(result.next ?? "/app");
      router.refresh();
    });
  };

  const onReopen = () => {
    setError(null);
    startSaving(async () => {
      const result = await reopenStage(tree.startupStageId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
              {tree.title}
            </h1>
            {tree.subtitle ? (
              <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
                {tree.subtitle}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="tabular text-[13px] text-[var(--text-muted)]">
              <span className="font-semibold text-white">{tree.done}</span> z {tree.total}{" "}
              podpunktów
            </p>
            <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[var(--vairo)] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rola Członka nie jest błędem ani karą — mówimy wprost, co z niej
            wynika i u kogo prosić o zmianę, zamiast tylko blokować przyciski. */}
        {readOnly ? (
          <p className="mt-4 flex max-w-3xl items-start gap-2.5 rounded-xl border border-[var(--info)]/25 bg-[var(--info)]/8 px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
            <Eye className="mt-0.5 size-4 shrink-0 text-[var(--info)]" />
            <span>
              Masz w tym teamie rolę <strong>{ROLE_LABELS[role]}</strong> —
              czytasz wszystko, co zespół uzupełnił, ale nie zmieniasz
              odpowiedzi. Zmienia je Founder albo Admin;{" "}
              <Link
                href="/app/team"
                className="text-[var(--info)] underline-offset-2 hover:underline"
              >
                znajdziesz ich w składzie teamu
              </Link>
              .
            </span>
          </p>
        ) : tree.intro ? (
          <p className="mt-4 max-w-3xl rounded-xl border border-white/[0.07] bg-[var(--surface)] px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
            {tree.intro}
          </p>
        ) : null}
      </header>

      {/* Oglądasz etap, który nie jest bieżący — trzeba to powiedzieć wprost,
          inaczej wygląda to tak, jakby program się cofnął. */}
      {!isCurrent ? (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/[0.07] bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--text-muted)]">
          <span>
            To nie jest Twój bieżący etap — możesz tu poprawiać odpowiedzi, ale
            program czeka gdzie indziej.
          </span>
          <Link
            href="/app/stage"
            className="text-[var(--vairo)] underline-offset-2 hover:underline"
          >
            Wróć do {currentTitle ?? "bieżącego etapu"}
          </Link>
        </p>
      ) : null}

      {/* Pierwsze wejście dostaje wprowadzenie, kolejne — sam następny krok.
          Jeden element w dwóch stanach: człowiek, który widzi ten ekran po raz
          pierwszy, potrzebuje wiedzieć, czym to jest i ile potrwa; ten, który
          wraca po raz dziesiąty, potrzebuje tylko „co dalej". */}
      {isFirstVisit && next ? (
        <section className="mb-5 rounded-2xl border border-[var(--vairo)]/30 bg-[var(--vairo)]/6 px-5 py-5 sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
            Zaczynasz nowy etap
          </p>
          <h2 className="mt-1.5 font-heading text-[20px] font-semibold text-white">
            {tree.subtitle ?? tree.title}
          </h2>
          {tree.intro ? (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-muted)]">
              {tree.intro}
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2 text-[13.5px] text-[var(--text-muted)]">
            <li className="flex items-start gap-2.5">
              <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
              <span>
                <strong className="text-white">{tree.total} podpunktów</strong>{" "}
                w {pointCount} {pointCount === 1 ? "punkcie" : "punktach"}
                {tree.showCategories
                  ? `, podzielonych na ${tree.categories.length} kategorie dobrane do Twojego startupu`
                  : ""}
                .
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Save className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
              <span>
                Każda odpowiedź zapisuje się osobno. Możesz wyjść w połowie
                i wrócić — nic nie przepada.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Undo2 className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
              <span>
                Nie ma złych odpowiedzi ani punktów za szybkość. Wszystko da się
                później poprawić.
              </span>
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={openNext}>
              <PlayCircle className="size-[18px]" />
              Zaczynam
            </Button>
            <span className="text-[12.5px] text-[var(--text-subtle)]">
              Pierwsze pytanie: {next.subpoint.title}
            </span>
          </div>
        </section>
      ) : !readOnly && !isCompleted && next ? (
        <button
          type="button"
          onClick={openNext}
          className="mb-4 flex w-full items-center gap-4 rounded-2xl border border-[var(--vairo)]/35 bg-[var(--vairo)]/8 px-5 py-4 text-left transition-colors hover:border-[var(--vairo)]/55 hover:bg-[var(--vairo)]/12"
        >
          <PlayCircle
            className="size-6 shrink-0 text-[var(--vairo)]"
            strokeWidth={1.75}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold uppercase tracking-wide text-[var(--vairo)]">
              Następny krok
            </span>
            <span className="mt-0.5 block truncate text-[15px] font-medium text-white">
              {next.subpoint.title}
            </span>
            <span className="mt-0.5 block truncate text-[12.5px] text-[var(--text-subtle)]">
              {tree.showCategories ? `${next.categoryTitle} · ` : ""}
              {next.pointTitle}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[var(--vairo)]" />
        </button>
      ) : null}

      {/* Kolejność jest dowolna — dla kogoś, kto widzi taki ekran pierwszy
          raz, to nie jest oczywiste. Plus wyjście na podsumowanie, gdy jest
          już co podsumowywać. */}
      {!isFirstVisit && tree.done > 0 ? (
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--text-faint)]">
          {tree.showCategories && !readOnly && !isCompleted ? (
            <span>
              Kategorie i punkty możesz robić w dowolnej kolejności. Każdy zapis
              zostaje.
            </span>
          ) : null}
          <Link
            href={`/app/stage/summary?stage=${tree.templateKey}`}
            className="inline-flex items-center gap-1.5 text-[var(--text-subtle)] underline-offset-2 hover:text-white hover:underline"
          >
            <FileText className="size-3.5" />
            Zobacz wszystko, co ustaliliście
          </Link>
        </p>
      ) : null}

      {/* Zwinięty przewodnik zostaje w tej samej kolumnie co rozwinięty —
          zwężony do paska. Przycisk nie wędruje pod listy, więc user wie,
          gdzie go szukać niezależnie od stanu panelu. */}
      <div
        className={cn(
          "grid items-start gap-4",
          hasGuide && guideOpen
            ? tree.showCategories
              ? "xl:grid-cols-[190px_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]"
            : hasGuide
              ? tree.showCategories
                ? "xl:grid-cols-[190px_minmax(0,1fr)_minmax(0,1.4fr)_52px]"
                : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_52px]"
              : tree.showCategories
                ? "xl:grid-cols-[190px_minmax(0,1fr)_minmax(0,1.4fr)]"
                : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
        )}
      >
        {tree.showCategories ? (
          <Column
            icon={Layers}
            title="Kategorie"
            subtitle="Dobrane do Twojego startupu"
          >
            {tree.categories.map((item) => (
              <ListRow
                key={item.key}
                title={item.title}
                meta={`${item.done}/${item.total}`}
                complete={item.isComplete}
                active={item.key === categoryKey}
                onClick={() => selectCategory(item.key)}
              />
            ))}
          </Column>
        ) : null}

        <Column
          icon={SlidersHorizontal}
          title={tree.showCategories ? (category?.title ?? "Punkty") : tree.title}
          subtitle={
            category ? `${category.done} z ${category.total} ukończonych` : null
          }
        >
          {(category?.points ?? []).map((item) => (
            <ListRow
              key={item.key}
              title={item.title}
              subtitle={item.durationHint}
              meta={`${item.done}/${item.total}`}
              complete={item.isComplete}
              active={item.key === pointKey}
              onClick={() => setPointKey(item.key)}
            />
          ))}
        </Column>

        <Column
          icon={SlidersHorizontal}
          title={readOnly ? "Odpowiedzi zespołu" : "Do zrobienia"}
          subtitle={point?.title}
          active
          meta={
            point?.durationHint ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/6 px-2 py-0.5 text-[11.5px] text-[var(--text-subtle)]">
                <Clock className="size-3" />
                {point.durationHint}
              </span>
            ) : null
          }
        >
          {(point?.subpoints ?? []).map((item) => (
            <ListRow
              key={item.key}
              title={item.title}
              subtitle={
                item.waitingOn
                  ? item.waitingOn
                  : item.skipped
                  ? "Pominięte"
                  : item.goalConditions.length > 0
                    ? item.goalConditions
                        .map((condition) => `${condition.label} ${condition.done}/${condition.minCount}`)
                        .join(" · ")
                    : item.isComplete
                      ? "Uzupełnione"
                      : readOnly
                        ? "Jeszcze nieuzupełnione"
                        : item.isOptional
                          ? "Opcjonalne"
                          : `${item.fields.length} ${
                              item.fields.length === 1 ? "pytanie" : "pytania"
                            } do uzupełnienia`
              }
              complete={item.isComplete}
              active={false}
              chevron
              onClick={() => {
                setError(null);
                setOpenSubpoint(item);
              }}
            />
          ))}
        </Column>

        {hasGuide && point ? (
          guideOpen ? (
            <GuidePanel point={point} onClose={() => setGuideOpen(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              title="Pokaż przewodnik"
              aria-label="Pokaż przewodnik"
              className="flex h-full min-h-[180px] w-full flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-[var(--surface)] py-4 text-[var(--text-subtle)] transition-colors hover:border-white/20 hover:text-white"
            >
              <PanelRightOpen className="size-4 shrink-0" />
              <span
                className="text-[12px] font-medium tracking-wide"
                style={{ writingMode: "vertical-rl" }}
              >
                Przewodnik
              </span>
              <BookOpen className="mt-auto size-4 shrink-0 text-[var(--vairo)]" />
            </button>
          )
        ) : null}
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-white">
            {isCompleted
              ? "Ten etap jest domknięty."
              : readOnly
                ? `Zespół uzupełnił ${tree.done} z ${tree.total} podpunktów.`
                : tree.canFinish
                  ? "Wszystko uzupełnione — możesz domknąć etap."
                  : `Zostało ${tree.total - tree.done} podpunktów do uzupełnienia.`}
          </p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-subtle)]">
            {isCompleted
              ? "Możesz go otworzyć ponownie i poprawić odpowiedzi."
              : readOnly
                ? "Etap domykają Founder i Admin."
                : tree.canFinish
                  ? needsDecision
                    ? "Zapytamy Cię, co dalej z tym pomysłem, i zapiszemy Twoją decyzję razem z odpowiedziami. Wrócić da się zawsze."
                    : "Zapiszemy Twoje odpowiedzi i przejdziemy do kolejnego kroku. Wrócić da się zawsze."
                  : "Postęp zapisuje się automatycznie. Możesz wyjść i wrócić kiedy chcesz."}
          </p>
        </div>

        {readOnly ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-2 text-[13px] text-[var(--text-subtle)]">
            <Lock className="size-3.5" />
            Tylko do odczytu
          </span>
        ) : isCompleted ? (
          <Button size="lg" variant="secondary" loading={saving} onClick={onReopen}>
            <RotateCcw className="size-4" />
            Otwórz ponownie
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!tree.canFinish}
            loading={saving && !closing}
            onClick={onFinish}
          >
            {tree.finishLabel ?? "Zakończ etap"}
          </Button>
        )}
      </footer>

      {error && !openSubpoint && !closing ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {openSubpoint && point ? (
        <SubpointModal
          tree={{ ...tree, answers }}
          subpoint={openSubpoint}
          pointTitle={point.title}
          answers={answers}
          saving={saving}
          error={error}
          readOnly={readOnly}
          onClose={() => {
            setOpenSubpoint(null);
            setError(null);
          }}
          onSave={onSave}
        />
      ) : null}

      {closing ? (
        <StageCloseDialog
          tree={tree}
          saving={saving}
          error={error}
          onClose={() => {
            setClosing(false);
            setError(null);
          }}
          onConfirm={onDecision}
        />
      ) : null}
    </div>
  );
}

function Column({
  icon: Icon,
  title,
  subtitle,
  meta,
  active,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  meta?: React.ReactNode;
  /** Kolumna, w której user właśnie działa — jedyna z pomarańczową ramką. */
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-[var(--surface)] p-4 transition-colors",
        active ? "border-[var(--vairo)]/45" : "border-white/[0.07]"
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--vairo)]">
            <Icon className="size-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{title}</span>
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate pl-6 text-[12px] text-[var(--text-subtle)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </header>
      <ul className="flex max-h-[min(58vh,560px)] flex-col gap-1 overflow-y-auto pr-1">
        {children}
      </ul>
    </section>
  );
}

function ListRow({
  title,
  subtitle,
  meta,
  complete,
  active,
  chevron,
  onClick,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string;
  complete: boolean;
  active: boolean;
  chevron?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
          active ? "bg-[var(--vairo)]/10" : "hover:bg-white/[0.05]"
        )}
      >
        <span
          className={cn(
            "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
            complete
              ? "border-[var(--success)] bg-[var(--success)] text-black"
              : active
                ? "border-[var(--vairo)]/70"
                : "border-white/25 group-hover:border-white/45"
          )}
          aria-hidden="true"
        >
          {complete ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[13.5px] leading-snug",
              active
                ? "font-medium text-[var(--vairo)]"
                : complete
                  ? "text-[var(--text-subtle)]"
                  : "text-white"
            )}
          >
            {title}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-[12px] text-[var(--text-subtle)]">
              {subtitle}
            </span>
          ) : null}
        </span>

        {meta ? (
          <span className="tabular mt-0.5 shrink-0 text-[12px] text-[var(--text-faint)]">
            {meta}
          </span>
        ) : null}

        {chevron ? (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </button>
    </li>
  );
}

function GuidePanel({ point, onClose }: { point: StagePoint; onClose: () => void }) {
  return (
    <aside className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--vairo)]">
          <BookOpen className="size-4 shrink-0" strokeWidth={2} />
          Przewodnik
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {point.guideSourceLabel ? (
            <span className="text-[11.5px] text-[var(--text-subtle)]">
              od {point.guideSourceLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Ukryj przewodnik"
            className="rounded-md p-1 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
          >
            <PanelRightClose className="size-4" />
          </button>
        </div>
      </header>

      <div className="max-h-[min(58vh,560px)] overflow-y-auto pr-1">
        <h3 className="font-heading text-[17px] font-semibold leading-snug text-white">
          {point.title}
        </h3>

        {point.guideBody ? (
          <div className="mt-3 flex flex-col gap-3 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
            {point.guideBody
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
          </div>
        ) : null}

        {point.guideSources.length > 0 ? (
          <details className="mt-5 border-t border-white/[0.06] pt-3">
            <summary className="cursor-pointer text-[12px] text-[var(--text-subtle)] transition-colors hover:text-white">
              Źródła ({point.guideSources.length})
            </summary>
            <ul className="mt-2.5 flex flex-col gap-2">
              {point.guideSources.map((source, i) => (
                <li
                  key={i}
                  className="border-l-2 border-white/10 pl-3 text-[12px] leading-relaxed text-[var(--text-subtle)]"
                >
                  {source}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </aside>
  );
}


/**
 * Pierwszy nieukończony, wymagany podpunkt w całym etapie — razem z kontekstem,
 * żeby kliknięcie ustawiło też właściwą kategorię i punkt.
 */
function findNext(tree: StageTree) {
  for (const category of tree.categories) {
    for (const point of category.points) {
      for (const subpoint of point.subpoints) {
        if (subpoint.isComplete || subpoint.isOptional) continue;
        return {
          categoryKey: category.key,
          categoryTitle: category.title,
          pointKey: point.key,
          pointTitle: point.title,
          subpoint,
        };
      }
    }
  }
  return null;
}
