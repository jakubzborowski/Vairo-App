import { Check, ExternalLink, Minus, Paperclip } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { hasAnswer, type StageField } from "@/types/stage";

/**
 * Odpowiedź w trybie odczytu — dla osób, które mają w teamie rolę Członka.
 *
 * Celowo NIE jest to ten sam formularz z `disabled`. Wyszarzone pole tekstowe
 * wygląda jak coś, co się zaraz odblokuje, i jest gorzej czytelne; tutaj chodzi
 * o czytanie tego, co zespół ustalił, więc odpowiedź renderujemy jako treść.
 */
export function AnswerView({
  field,
  value,
}: {
  field: StageField;
  value: unknown;
}) {
  return (
    <div className="border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
      <p className="text-[15px] font-medium leading-snug text-white">
        {field.question}
      </p>
      <div className="mt-2.5">
        {hasAnswer(value) ? (
          <AnswerBody field={field} value={value} />
        ) : (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-faint)]">
            <Minus className="size-3.5" aria-hidden="true" />
            Jeszcze nie uzupełnione
          </p>
        )}
      </div>
    </div>
  );
}

function AnswerBody({ field, value }: { field: StageField; value: unknown }) {
  switch (field.kind) {
    case "list_short":
    case "list_long":
      return (
        <ul className="flex flex-col gap-1.5">
          {asList(value).map((item, index) => (
            <li
              key={index}
              className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--text-muted)]"
            >
              <span className="tabular mt-0.5 shrink-0 text-[12px] text-[var(--text-faint)]">
                {index + 1}.
              </span>
              <span className="whitespace-pre-line">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "multi_select": {
      const options = field.config.options ?? [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {asList(value).map((item) => (
            <Pill key={item}>
              {options.find((o) => o.value === item)?.label ?? item}
            </Pill>
          ))}
        </div>
      );
    }

    case "select": {
      const options = field.config.options ?? [];
      const raw = typeof value === "string" ? value : "";
      return <Plain>{options.find((o) => o.value === raw)?.label ?? raw}</Plain>;
    }

    case "scale": {
      const max = field.config.max ?? 10;
      return (
        <p className="text-[14px] text-[var(--text-muted)]">
          <span className="tabular text-[18px] font-semibold text-white">
            {String(value)}
          </span>
          <span className="text-[var(--text-faint)]"> / {max}</span>
        </p>
      );
    }

    case "number":
      return (
        <Plain>
          {String(value)}
          {field.config.unit ? ` ${field.config.unit}` : ""}
        </Plain>
      );

    case "date":
      return <Plain>{formatDate(value)}</Plain>;

    case "checkmark":
      return (
        <p className="inline-flex items-center gap-2 text-[14px] text-[var(--success)]">
          <Check className="size-4" strokeWidth={2.5} />
          {field.config.confirm_label ?? "Potwierdzone"}
        </p>
      );

    case "links":
      return (
        <ul className="flex flex-col gap-1.5">
          {asList(value).map((url, index) => (
            <li key={index}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-[var(--vairo)] underline-offset-2 hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0" />
                <span className="break-all">{url}</span>
              </a>
            </li>
          ))}
        </ul>
      );

    case "files":
      return (
        <ul className="flex flex-col gap-1.5">
          {asFiles(value).map((file) => (
            <li
              key={file.path}
              className="inline-flex items-center gap-2 text-[14px] text-[var(--text-muted)]"
            >
              <Paperclip className="size-3.5 shrink-0 text-[var(--text-faint)]" />
              {file.name}
            </li>
          ))}
        </ul>
      );

    case "sentence_template": {
      const slots = (value ?? {}) as Record<string, string>;
      const template = field.config.template ?? "";
      const sentence = template
        .replace(/\{(\w+)\}/g, (_, key: string) => (slots[key] ?? "").trim() || "…")
        .replace(/\s+/g, " ")
        .trim();
      return (
        <p className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-[15px] leading-relaxed text-white">
          {sentence}
        </p>
      );
    }

    case "summary":
      return (
        <p className="inline-flex items-center gap-2 text-[14px] text-[var(--success)]">
          <Check className="size-4" strokeWidth={2.5} />
          Podsumowanie potwierdzone
        </p>
      );

    default:
      return <Plain>{typeof value === "string" ? value : String(value)}</Plain>;
  }
}

function Plain({ children }: { children: React.ReactNode }) {
  return (
    <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--text-muted)]">
      {children}
    </p>
  );
}

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((v) => (typeof v === "string" ? v : String(v ?? "")))
        .filter((v) => v.trim().length > 0)
    : [];

const asFiles = (value: unknown): { path: string; name: string }[] =>
  Array.isArray(value)
    ? (value.filter(
        (v) => v && typeof v === "object" && "path" in v && "name" in v
      ) as { path: string; name: string }[])
    : [];

function formatDate(value: unknown) {
  if (typeof value !== "string") return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
