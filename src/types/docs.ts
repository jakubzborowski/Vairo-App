/**
 * Gotowe początki dokumentów — prosta lista szablonów z nagłówkami do
 * uzupełnienia, nie funkcja AI. Pusty dokument jest zawsze pierwszy.
 */
export type DocTemplate = {
  id: "blank" | "meeting" | "interviews" | "decision";
};

/**
 * Teksty szablonów są w słowniku `docs`: `template.<id>.label|description`
 * i — poza pustym — `template.<id>.title|body`. Nagłówki w treści są
 * w języku osoby, która zakłada dokument.
 */
export const DOC_TEMPLATES: DocTemplate[] = [
  { id: "blank" },
  { id: "meeting" },
  { id: "interviews" },
  { id: "decision" },
];

export type DocSummary = {
  id: string;
  title: string;
  body: string;
  createdBy: string | null;
  authorName: string;
  updatedAt: string;
  /** Tekst z tego dokumentu jest dowodem ukończonego celu. */
  usedAsProof?: boolean;
};
