import Link from "next/link";
import { Check, Lock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageProgramEntry } from "@/lib/stage";

/**
 * Pasek pięciu etapów jako **ciąg klocków ze strzałkowym wcięciem**.
 *
 * Poprzednia wersja była rzędem pigułek, który na wąskim ekranie zawijał się
 * do dwóch linii. Pigułka obok pigułki nie niesie kierunku: pięć równych
 * owali czyta się jak menu, z którego coś się wybiera, a nie jak droga, którą
 * się idzie. Strzałka rozwiązuje to jednym kształtem — grot pokazuje, w którą
 * stronę biegnie program, i robi to bez ani jednej ikony i bez podpisu.
 *
 * Trzy decyzje, które o tym przesądzają:
 *
 * **Kształt robi `clip-path`, nie obrazek.** Wcięcie i grot to ten sam
 * wielokąt, więc klocki wchodzą jeden w drugi bez szczeliny i bez SVG.
 * Ujemny margines jest o 2 px mniejszy od groty — stąd widoczna kreska między
 * klockami. `clip-path` przycina też `border` i `border-radius`, dlatego
 * klocki nie mają obramowań, a zaokrąglenie całości daje kontener
 * z `overflow-hidden`.
 *
 * **Jeden rząd, nigdy dwa.** Na telefonie pięć pełnych nazw się nie mieści,
 * więc podpis zostaje **tylko przy bieżącym etapie** — pozostałe zwijają się
 * do samego znaku stanu. Zawijanie do drugiej linii zamieniłoby drogę
 * w tabelkę, a pozioma przewijarka schowałaby połowę programu przed kimś,
 * kto nie wie, że można przesunąć.
 *
 * **Bieżący etap jest jedynym wypełnionym.** Pozostałe cztery stany
 * rozróżnia jasność tła i znak, nie kolor — inaczej pasek sam w sobie miałby
 * pięć akcentów.
 */

/** Głębokość groty w pikselach. */
const ARROW = 12;

const SHAPE = {
  middle: `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%, ${ARROW}px 50%)`,
  first: `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%)`,
  last: `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${ARROW}px 50%)`,
};

export function StageProgress({
  program,
  currentKey,
  className,
}: {
  program: StageProgramEntry[];
  currentKey: string | null;
  className?: string;
}) {
  const currentIndex = program.findIndex((item) => item.key === currentKey);

  return (
    <nav
      aria-label="Postęp programu"
      className={cn(
        // `steps` daje klockom wejście od lewej, jeden po drugim — w tę samą
        // stronę, w którą pokazuje grot. Animacja dosłownie rysuje drogę.
        "steps flex overflow-hidden rounded-xl bg-[var(--surface)]/60 lift-1",
        className
      )}
    >
      {program.map((item, index) => {
        const isCurrent = index === currentIndex;
        const isDone = item.status === "completed";
        // Etap otwarty, ale nie bieżący: ktoś do niego wrócił albo otworzył go
        // z własnej woli. To NIE to samo co pominięty.
        const isOpen = item.status === "in_progress" && !isCurrent;
        const isSkipped =
          item.status === "not_started" &&
          currentIndex >= 0 &&
          index < currentIndex;
        const isLocked = !isDone && !isCurrent && !isOpen && !isSkipped;
        const isLast = index === program.length - 1;

        // „Ambition Stage" w klocku szerokim na 70 px to sama końcówka
        // „…Stage". Słowo i tak nic nie wnosi — pasek mówi o etapach.
        const label = item.title.replace(/\s*stage\s*$/i, "");

        // Numer jest ZAWSZE — na telefonie zamiast nazwy, na desktopie przed
        // nią. „01" przy „Ambition" nie jest ozdobą: pasek bez numeracji mówi
        // „jesteś w Idea i są jeszcze jakieś cztery rzeczy", z numeracją mówi
        // „drugi z pięciu", a to jest cała informacja, po którą się na taki
        // pasek patrzy. Znak stanu zostaje tylko tam, gdzie coś dodaje:
        // ptaszek przy domkniętym, kłódka przy zablokowanym.
        const number = String(index + 1).padStart(2, "0");

        const body = (
          <>
            <span
              className={cn(
                "tabular shrink-0 text-[11px] tracking-wide",
                // Numer przy NIE-bieżącym klocku znika w średnim zakresie
                // szerokości: tam jest miejsce albo na numer, albo na nazwę,
                // a nazwa niesie więcej. Na telefonie numer jest jedyną
                // treścią klocka, przy  mieści się jedno i drugie.
                isCurrent ? "opacity-80" : "opacity-55 sm:hidden lg:inline"
              )}
            >
              {number}
            </span>

            <span
              className={cn(
                "truncate",
                // Na telefonie nazwę ma tylko bieżący etap — pięć nazw naraz
                // nie mieści się w jednym rzędzie, a rząd ma być jeden.
                isCurrent ? "inline" : "hidden sm:inline"
              )}
            >
              {label}
            </span>

            {isDone ? (
              <Check className="hidden size-3.5 shrink-0 sm:block" strokeWidth={2.75} />
            ) : isLocked ? (
              <Lock className="hidden size-3 shrink-0 opacity-70 sm:block" />
            ) : isSkipped ? (
              <Minus className="hidden size-3.5 shrink-0 opacity-70 sm:block" />
            ) : null}

            {/* Jednorazowy przebłysk światła przez bieżący klocek, chwilę po
                tym, jak wszystkie wjadą. To jedyny moment, w którym pasek
                robi cokolwiek „efektownego" — i robi to na tym jednym
                elemencie, który ma przyciągnąć wzrok. */}
            {isCurrent ? (
              <span
                aria-hidden="true"
                className="sweep pointer-events-none absolute inset-0"
              />
            ) : null}
          </>
        );

        const shared = cn(
          "relative flex h-11 min-w-0 items-center justify-center gap-1.5 overflow-hidden sm:h-10",
          "text-[12.5px] font-medium transition-colors duration-150",
          // Grot sąsiada wchodzi w to wcięcie, więc lewa strona potrzebuje
          // dodatkowego oddechu — inaczej znak siedzi na ostrzu.
          index === 0 ? "pl-3.5 pr-4" : "pl-5 pr-4",
          isCurrent
            ? "flex-[1.5_1_0%] bg-[var(--vairo-strong)] text-white"
            : "flex-[0_0_auto] sm:flex-1",
          isDone && !isCurrent && "bg-[var(--success)]/14 text-[var(--success)]",
          isOpen && "bg-white/[0.07] text-white",
          isSkipped && "bg-white/[0.035] text-[var(--text-subtle)]",
          isLocked && "bg-white/[0.02] text-[var(--text-faint)]"
        );

        const style = {
          clipPath: index === 0 ? SHAPE.first : isLast ? SHAPE.last : SHAPE.middle,
          marginLeft: index === 0 ? undefined : -(ARROW - 2),
        };

        // Do etapu bez treści nie ma po co wchodzić — czeka tam tylko ekran
        // „w przygotowaniu".
        const clickable = item.hasContent && (isDone || isSkipped || isOpen);

        if (clickable) {
          return (
            <Link
              key={item.key}
              href={`/app/stage?stage=${item.key}`}
              style={style}
              title={
                isSkipped
                  ? `${label} — etap pominięty, możesz go uzupełnić, ale nie musisz`
                  : isOpen
                    ? `${label} — etap otwarty, możesz do niego wrócić`
                    : `${label} — etap domknięty, możesz przejrzeć odpowiedzi`
              }
              className={cn(shared, "hover:bg-white/[0.11] hover:text-white")}
            >
              {body}
            </Link>
          );
        }

        return (
          <div
            key={item.key}
            style={style}
            aria-current={isCurrent ? "step" : undefined}
            title={
              isCurrent
                ? `${label} — tu jesteś teraz`
                : item.hasContent
                  ? undefined
                  : `${label} — etap jest w programie, treść jeszcze w przygotowaniu`
            }
            className={shared}
          >
            {body}
          </div>
        );
      })}
    </nav>
  );
}
