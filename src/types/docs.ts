/**
 * Gotowe początki dokumentów — prosta lista szablonów z nagłówkami do
 * uzupełnienia, nie funkcja AI. Pusty dokument jest zawsze pierwszy.
 */
export type DocTemplate = {
  id: string;
  label: string;
  description: string;
  title: string;
  body: string;
};

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    label: "Pusty dokument",
    description: "Czysta kartka.",
    title: "",
    body: "",
  },
  {
    id: "meeting",
    label: "Notatka ze spotkania",
    description: "Kto był, co ustaliliście, kto co robi.",
    title: "Notatka ze spotkania",
    body: "## Kto był\n- \n\n## Co ustaliliśmy\n- \n\n## Kto co robi\n- [ ] \n",
  },
  {
    id: "interviews",
    label: "Wynik rozmów",
    description: "Z kim, czego się dowiedzieliście, co z tego wynika.",
    title: "Wynik rozmów",
    body: "## Z kim rozmawialiśmy\n- \n\n## Co się powtarzało\n- \n\n## Co nas zaskoczyło\n- \n\n## Co z tego wynika\n",
  },
  {
    id: "decision",
    label: "Decyzja",
    description: "Co postanowiliście i dlaczego.",
    title: "Decyzja",
    body: "## Co postanowiliśmy\n\n## Dlaczego\n- \n\n## Co odrzuciliśmy\n- \n",
  },
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
