import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissingPiece } from "@/lib/profile-completeness";

type Props = {
  score: number;
  missing: MissingPiece[];
  /** `banner` nad talią w Odkrywaj, `panel` na własnym profilu. */
  variant?: "banner" | "panel";
  /** Gdzie prowadzi „Uzupełnij". Domyślnie kreator profilu osoby. */
  fixHref?: string;
  /**
   * false, gdy formularz naprawiający braki jest już na tym samym ekranie —
   * przycisk prowadzący „nikt nie wie gdzie" byłby martwym elementem.
   */
  showFix?: boolean;
  /** Czego dotyczy — zmienia brzmienie nagłówka. */
  subject?: "profile" | "team";
  className?: string;
};

/**
 * Ile brakuje do profilu, który ktokolwiek zaprosi.
 *
 * Nie blokujemy wejścia do Odkrywaj — blokada wypchnęłaby z aplikacji tych,
 * którzy najbardziej jej potrzebują. Zamiast tego mówimy wprost, co jest
 * puste i dlaczego to ma znaczenie, i dajemy jeden przycisk, który to załatwia.
 */
export function ProfileNudge({
  score,
  missing,
  variant = "banner",
  fixHref = "/app/social/start",
  showFix = true,
  subject = "profile",
  className,
}: Props) {
  const complete = missing.length === 0;

  if (complete && variant === "banner") return null;

  return (
    <section
      className={cn(
        "rounded-2xl border px-5 py-4",
        complete
          ? "border-[var(--success)]/25 bg-[var(--success)]/6"
          : "border-[var(--warning)]/30 bg-[var(--warning)]/8",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-medium text-white">
            {complete ? (
              <>
                <Check className="size-4 shrink-0 text-[var(--success)]" />
                {subject === "team"
                  ? "Profil teamu jest kompletny"
                  : "Twój profil jest kompletny"}
              </>
            ) : (
              <>
                <AlertTriangle className="size-4 shrink-0 text-[var(--warning)]" />
                {score < 40
                  ? subject === "team"
                    ? "Karta teamu jest prawie pusta"
                    : "Twoja karta jest prawie pusta"
                  : "Do kompletnego profilu jeszcze trochę brakuje"}
              </>
            )}
          </p>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--text-muted)]">
            {complete
              ? "Nic nie musisz poprawiać. Możesz wrócić tu w każdej chwili."
              : "Ludzie decydują w kilka sekund, na podstawie tego, co widzą na karcie. Braki poniżej to dokładnie to, czego im zabraknie."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="tabular text-[20px] font-semibold text-white">
            {score}%
          </span>
          {!complete && showFix ? (
            <Button href={fixHref} size="sm">
              Uzupełnij
              <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            complete ? "bg-[var(--success)]" : "bg-[var(--warning)]"
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      {!complete ? (
        <ul className="mt-3.5 flex flex-col gap-2">
          {missing.map((piece) => (
            <li key={piece.key} className="flex items-start gap-2.5">
              <span
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--warning)]"
                aria-hidden="true"
              />
              <span className="min-w-0 text-[13px] leading-relaxed">
                <span className="font-medium text-white">{piece.label}</span>
                <span className="text-[var(--text-subtle)]"> — {piece.why}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
