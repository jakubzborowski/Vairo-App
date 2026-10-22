"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, SquareCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ModuleHeader } from "@/components/ui/module-header";
import { cn } from "@/lib/utils";
import { plural } from "@/components/goals/goal-format";

export type DeadlineItem = {
  id: string;
  kind: "goal" | "task";
  title: string;
  /** „Cel · Wynik budowy" albo „Zadanie w celu „X”". */
  what: string;
  due: string;
  ownerId: string | null;
  ownerName: string;
  statusLabel: string;
  statusTone: "muted" | "info" | "danger" | "warning" | "success";
  open: boolean;
  href: string;
};

const WD_SHORT = ["pon", "wt", "śr", "czw", "pt", "sob", "nd"];
const WD_LONG = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

function iso(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
function parse(value: string) {
  return new Date(`${value}T00:00:00`);
}
function addDays(value: string, days: number) {
  const date = parse(value);
  date.setDate(date.getDate() + days);
  return iso(date);
}
/** Poniedziałek tygodnia, w którym leży dzień. */
function mondayOf(value: string) {
  const date = parse(value);
  const shift = (date.getDay() + 6) % 7;
  return addDays(value, -shift);
}
function weekdayIndex(value: string) {
  return (parse(value).getDay() + 6) % 7;
}
const DAY_MONTH = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });
const MONTH_YEAR = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });
function rangeLabel(from: string, to: string) {
  const a = parse(from);
  const b = parse(to);
  if (a.getMonth() === b.getMonth()) {
    const month = new Intl.DateTimeFormat("pl-PL", { month: "long" }).format(b);
    return `${a.getDate()} – ${b.getDate()} ${genitive(month)}`;
  }
  return `${DAY_MONTH.format(a)} – ${DAY_MONTH.format(b)}`;
}
/** „październik" → „października" dla zakresu dni. */
function genitive(month: string) {
  const map: Record<string, string> = {
    styczeń: "stycznia",
    luty: "lutego",
    marzec: "marca",
    kwiecień: "kwietnia",
    maj: "maja",
    czerwiec: "czerwca",
    lipiec: "lipca",
    sierpień: "sierpnia",
    wrzesień: "września",
    październik: "października",
    listopad: "listopada",
    grudzień: "grudnia",
  };
  return map[month] ?? month;
}

const TONE: Record<DeadlineItem["statusTone"], string> = {
  muted: "text-[var(--text-muted)]",
  info: "text-[var(--info-text)]",
  danger: "text-[var(--danger-text)]",
  warning: "text-[var(--warning)]",
  success: "text-[var(--success)]",
};

/**
 * Terminy — dwa tygodnie na jednym oddechu.
 *
 * Mały zespół rzadko planuje dalej niż kilka tygodni, a pełny kalendarz
 * z godzinami byłby pusty. Pasek 14 dni odpowiada na pytanie „kiedy jest
 * gęsto" (pełna kropka to cel, pusta to zadanie), pod nim lista w grupach:
 * Minęły, Ten tydzień, Następny, Później. Miesiąc jest drugą zakładką — na
 * przegląd, nie do planowania.
 */
export function CalendarView({ items, userId }: { items: DeadlineItem[]; userId: string }) {
  const today = iso(new Date());
  const [mine, setMine] = useState(false);
  const [mode, setMode] = useState<"two" | "month">("two");
  const [stripStart, setStripStart] = useState(() => mondayOf(today));
  const [monthAnchor, setMonthAnchor] = useState(() => today.slice(0, 7));

  const visible = useMemo(
    () => items.filter((item) => !mine || item.ownerId === userId),
    [items, mine, userId]
  );
  const byDay = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    for (const item of visible) {
      const list = map.get(item.due) ?? [];
      list.push(item);
      map.set(item.due, list);
    }
    return map;
  }, [visible]);

  const thisMonday = mondayOf(today);
  const thisSunday = addDays(thisMonday, 6);
  const nextSunday = addDays(thisMonday, 13);
  const overdue = visible.filter((item) => item.open && item.due < today);
  const upcoming = visible.filter((item) => item.due >= today);
  const thisWeek = upcoming.filter((item) => item.due <= thisSunday);
  const nextWeek = upcoming.filter((item) => item.due > thisSunday && item.due <= nextSunday);
  const later = upcoming.filter((item) => item.due > nextSunday);
  const nearest = upcoming.find((item) => item.open);

  const subtitle = (() => {
    if (visible.length === 0) return "Nie ma jeszcze żadnych terminów.";
    const parts: string[] = [];
    parts.push(
      thisWeek.length === 0
        ? "W tym tygodniu nic"
        : `W tym tygodniu ${thisWeek.length} ${plural(thisWeek.length, "termin", "terminy", "terminów")}`
    );
    if (overdue.length > 0) {
      parts.push(`${overdue.length} ${plural(overdue.length, "minął", "minęły", "minęło")}`);
    }
    let sentence = `${parts.join(", ")}.`;
    if (nearest) {
      const date = parse(nearest.due);
      sentence += ` Najbliższy: ${WD_LONG[weekdayIndex(nearest.due)]} ${DAY_MONTH.format(date)}.`;
    }
    return sentence;
  })();

  if (items.length === 0) {
    return (
      <div className="page-wide">
        <ModuleHeader title="Terminy" subtitle="Daty z celów i zadań, w jednym miejscu." />
        <EmptyState
          className="mt-6"
          icon={CalendarDays}
          title="Nie ma jeszcze terminów"
          description="Każdy cel ma termin, a zadania mogą go mieć. Gdy je założycie, zobaczycie tu, kiedy jest gęsto."
          action={<Button href="/app/goals/new">Załóż cel</Button>}
        />
      </div>
    );
  }

  const strip = Array.from({ length: 14 }, (_, index) => addDays(stripStart, index));

  return (
    <div className="page-wide">
      <ModuleHeader title="Terminy" subtitle={subtitle}>
        <Segmented
          label="Czyje terminy"
          value={mine ? "mine" : "all"}
          onChange={(value) => setMine(value === "mine")}
          options={[
            ["mine", "Moje"],
            ["all", "Wszyscy"],
          ]}
        />
        <Segmented
          label="Widok"
          value={mode}
          onChange={(value) => setMode(value as "two" | "month")}
          options={[
            ["two", "Dwa tygodnie"],
            ["month", "Miesiąc"],
          ]}
        />
      </ModuleHeader>

      {mode === "two" ? (
        <>
          <section className="edge-accent mt-6 overflow-hidden rounded-[25px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.05] p-3 lift-2 sm:p-4">
            <div className="flex items-center justify-between gap-2 px-1.5 pb-3">
              <p className="font-heading text-[15px] font-semibold text-white">
                {rangeLabel(strip[0]!, strip[13]!)}
              </p>
              <div className="flex gap-1">
                <IconButton label="Poprzedni tydzień" onClick={() => setStripStart(addDays(stripStart, -7))}>
                  <ChevronLeft className="size-4" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => setStripStart(thisMonday)}
                  className="h-9 rounded-[10px] bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text-muted)] transition-colors hover:text-white sm:h-8"
                >
                  Dziś
                </button>
                <IconButton label="Następny tydzień" onClick={() => setStripStart(addDays(stripStart, 7))}>
                  <ChevronRight className="size-4" />
                </IconButton>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 lg:grid-cols-14">
              {strip.map((day, index) => {
                const list = byDay.get(day) ?? [];
                const isToday = day === today;
                const weekend = weekdayIndex(day) >= 5;
                return (
                  <button
                    key={day}
                    type="button"
                    // Na telefonie widać tydzień — drugi tydzień paska chowa się.
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[14px] py-2.5 transition-colors hover:bg-white/[0.04]",
                      index >= 7 && "hidden lg:flex",
                      isToday ? "bg-[var(--vairo)]/10" : weekend ? "" : "bg-[var(--bg)]/45",
                      day < today && !isToday && "opacity-70"
                    )}
                    aria-label={`${WD_LONG[weekdayIndex(day)]} ${DAY_MONTH.format(parse(day))}: ${list.length} ${plural(list.length, "termin", "terminy", "terminów")}`}
                    onClick={() =>
                      document.getElementById(`dzien-${day}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  >
                    <span className="text-[11.5px] text-[var(--text-muted)]">{WD_SHORT[weekdayIndex(day)]}</span>
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-full font-heading text-[15px] font-semibold text-white",
                        isToday && "bg-[var(--vairo-strong)]"
                      )}
                    >
                      {parse(day).getDate()}
                    </span>
                    <span className="flex min-h-2 justify-center gap-[3px]">
                      {list.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "size-[7px] rounded-full",
                            item.kind === "goal" ? "bg-white" : "border-[1.5px] border-white/80"
                          )}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 px-1.5 text-[12.5px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-[7px] rounded-full bg-white" />
                cel
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-[7px] rounded-full border-[1.5px] border-white/80" />
                zadanie
              </span>
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-6">
            <Group
              name="Minęły"
              sub="Spóźniony termin nie blokuje dowodu dodanego później."
              items={overdue}
              today={today}
              overdue
            />
            <Group
              name="Ten tydzień"
              sub={`do niedzieli ${DAY_MONTH.format(parse(thisSunday))}`}
              items={thisWeek}
              today={today}
            />
            <Group
              name="Następny tydzień"
              sub={rangeLabel(addDays(thisSunday, 1), nextSunday)}
              items={nextWeek}
              today={today}
            />
            <Group name="Później" sub="" items={later} today={today} />
            {overdue.length + upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-3.5 text-[13px] text-[var(--text-subtle)]">
                {mine ? "Nie masz otwartych terminów." : "Wszystkie terminy są już za Wami."}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <MonthGrid
          anchor={monthAnchor}
          onShift={(delta) => {
            const date = parse(`${monthAnchor}-01`);
            date.setMonth(date.getMonth() + delta);
            setMonthAnchor(iso(date).slice(0, 7));
          }}
          onToday={() => setMonthAnchor(today.slice(0, 7))}
          byDay={byDay}
          today={today}
        />
      )}
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-[14px] border border-white/[0.07] bg-[var(--surface)] p-1">
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-11 items-center rounded-[10px] px-3.5 text-[13.5px] transition-colors sm:h-8",
            value === id ? "bg-[var(--surface-3)] font-medium text-white" : "text-[var(--text-muted)] hover:text-white"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:text-white sm:size-8"
    >
      {children}
    </button>
  );
}

function Group({
  name,
  sub,
  items,
  today,
  overdue = false,
}: {
  name: string;
  sub: string;
  items: DeadlineItem[];
  today: string;
  overdue?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-2.5 px-1">
        <h2
          className={cn(
            "font-heading text-[16px] font-semibold",
            overdue ? "text-[var(--warning)]" : "text-white"
          )}
        >
          {name}
        </h2>
        {sub ? <p className="text-[13px] text-[var(--text-muted)]">{sub}</p> : null}
      </div>
      <ul
        className={cn(
          "mt-2.5 overflow-hidden rounded-[22px] border lift-1 divide-y divide-white/[0.05]",
          overdue
            ? "border-[var(--warning)]/20 bg-[var(--warning)]/[0.05]"
            : "border-transparent bg-[var(--surface)]"
        )}
      >
        {items.map((item, index) => {
          const firstOfDay = index === 0 || items[index - 1]!.due !== item.due;
          return (
            <li key={`${item.kind}-${item.id}`} id={firstOfDay ? `dzien-${item.due}` : undefined}>
              <Link
                href={item.href}
                className="flex min-h-16 items-center gap-3 px-3.5 py-3 transition-colors hover:bg-white/[0.03] sm:gap-3.5 sm:px-[18px]"
              >
                <span className="w-10 shrink-0 text-center sm:w-[52px]">
                  <span
                    className={cn(
                      "block font-heading text-[18px] font-semibold leading-tight",
                      item.open && item.due < today ? "text-[var(--warning)]" : "text-white"
                    )}
                  >
                    {parse(item.due).getDate()}
                  </span>
                  <span className="block text-[11.5px] text-[var(--text-muted)]">
                    {WD_SHORT[weekdayIndex(item.due)]}
                  </span>
                </span>
                {item.kind === "goal" ? (
                  <Flag className="size-4 shrink-0 text-white" aria-label="Cel" />
                ) : (
                  <SquareCheck className="size-4 shrink-0 text-[var(--text-muted)]" aria-label="Zadanie" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-white">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--text-muted)]">{item.what}</span>
                </span>
                <span className="hidden sm:inline-flex">
                  <Avatar name={item.ownerName} size="xs" />
                </span>
                <span className={cn("hidden w-[120px] shrink-0 text-right text-[12.5px] sm:block", TONE[item.statusTone])}>
                  {item.statusLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Przegląd miesiąca: w dniu najwyżej dwa terminy, reszta jako „+1". */
function MonthGrid({
  anchor,
  onShift,
  onToday,
  byDay,
  today,
}: {
  anchor: string;
  onShift: (delta: number) => void;
  onToday: () => void;
  byDay: Map<string, DeadlineItem[]>;
  today: string;
}) {
  const first = `${anchor}-01`;
  const start = mondayOf(first);
  const month = parse(first).getMonth();
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const lastRowNeeded = cells.slice(35).some((day) => parse(day).getMonth() === month);
  const shown = lastRowNeeded ? cells : cells.slice(0, 35);
  const count = shown
    .filter((day) => parse(day).getMonth() === month)
    .reduce((sum, day) => sum + (byDay.get(day)?.length ?? 0), 0);

  return (
    <section className="mt-6 rounded-[25px] bg-[var(--surface)] p-3 lift-1 sm:p-3.5">
      <div className="flex items-center justify-between gap-2 px-1.5 pb-3">
        <p className="font-heading text-[15px] font-semibold capitalize text-white">
          {MONTH_YEAR.format(parse(first))}
          <span className="ml-2 font-sans text-[13px] font-normal normal-case text-[var(--text-muted)]">
            {count} {plural(count, "termin", "terminy", "terminów")}
          </span>
        </p>
        <div className="flex gap-1">
          <IconButton label="Poprzedni miesiąc" onClick={() => onShift(-1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={onToday}
            className="h-9 rounded-[10px] bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text-muted)] hover:text-white sm:h-8"
          >
            Dziś
          </button>
          <IconButton label="Następny miesiąc" onClick={() => onShift(1)}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 pb-2">
        {WD_LONG.map((day, index) => (
          <p key={day} className="truncate px-2 text-[12px] text-[var(--text-muted)]">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{WD_SHORT[index]}</span>
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {shown.map((day) => {
          const inMonth = parse(day).getMonth() === month;
          const list = inMonth ? (byDay.get(day) ?? []) : [];
          const isToday = day === today;
          return (
            <div
              key={day}
              className={cn(
                "flex min-h-[72px] flex-col gap-[3px] rounded-xl border p-1.5 md:min-h-[110px]",
                !inMonth
                  ? "border-transparent"
                  : isToday
                    ? "border-[var(--vairo)]/40 bg-[var(--vairo)]/10"
                    : "border-transparent bg-white/[0.02]"
              )}
            >
              {inMonth ? (
                <>
                  <p
                    className={cn(
                      "px-1.5 pb-1 pt-0.5 text-[13px]",
                      isToday
                        ? "font-semibold text-[var(--vairo-soft)]"
                        : day < today
                          ? "text-[var(--text-subtle)]"
                          : "text-[var(--text-muted)]"
                    )}
                  >
                    {parse(day).getDate()}
                  </p>
                  {list.slice(0, 2).map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      title={item.title}
                      className={cn(
                        "hidden truncate rounded-md px-1.5 py-0.5 text-[11.5px] leading-snug transition-colors hover:bg-white/[0.12] md:block",
                        item.kind === "goal" ? "bg-white/10" : "",
                        item.open && item.due < today ? "text-[var(--warning)]" : "text-white"
                      )}
                    >
                      {item.kind === "task" ? "· " : ""}
                      {item.title}
                    </Link>
                  ))}
                  {list.length > 0 ? (
                    <span className="flex gap-[3px] px-1.5 md:hidden" aria-label={`${list.length} terminy`}>
                      {list.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "size-[6px] rounded-full",
                            item.kind === "goal" ? "bg-white" : "border border-white/80"
                          )}
                        />
                      ))}
                    </span>
                  ) : null}
                  {list.length > 2 ? (
                    <p className="hidden px-1.5 text-[11.5px] text-[var(--text-muted)] md:block">
                      +{list.length - 2}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
