"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  Check,
  CheckSquare,
  Copy,
  Heading1,
  Heading2,
  List,
  Lock,
  Trash2,
} from "lucide-react";
import { deleteDocument, saveDocument } from "@/app/app/docs/actions";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatMoment } from "@/components/goals/goal-format";
import { Markdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SLASH_ITEMS = [
  { id: "h1", label: "Nagłówek", prefix: "# ", icon: Heading1 },
  { id: "h2", label: "Podtytuł", prefix: "## ", icon: Heading2 },
  { id: "ul", label: "Lista", prefix: "- ", icon: List },
  { id: "todo", label: "Lista do odhaczenia", prefix: "- [ ] ", icon: CheckSquare },
] as const;

/**
 * Kartka — osobna strona z samym dokumentem, w kolumnie do czytania.
 *
 * Przy pisaniu nie widać nic poza tekstem: bez karty, bez ramek, bez stałego
 * paska narzędzi. Formatowanie pojawia się po zaznaczeniu tekstu, a „/" na
 * pustej linii wstawia nagłówek, listę albo listę do odhaczenia. Zapis idzie
 * w tle od pierwszego znaku; pusty tytuł dostaje nazwę z pierwszej linijki.
 */
export function DocSheet({
  docId: initialId,
  initialTitle,
  initialBody,
  updatedAt,
  authorName,
  editorName = null,
  canEdit,
}: {
  docId: string | null;
  initialTitle: string;
  initialBody: string;
  updatedAt: string | null;
  authorName: string | null;
  /** Kto zmieniał ostatnio (031). */
  editorName?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [docId, setDocId] = useState(initialId);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(updatedAt);
  const [mode, setMode] = useState<"write" | "read">(canEdit ? "write" : "read");
  const [selection, setSelection] = useState(false);
  const [slash, setSlash] = useState<{ index: number } | null>(null);
  const [slashActive, setSlashActive] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const area = useRef<HTMLTextAreaElement>(null);
  const latest = useRef({ title, body, docId });
  const timer = useRef<number | null>(null);
  const inFlight = useRef(false);
  const again = useRef(false);

  useLayoutEffect(() => {
    latest.current = { title, body, docId };
  }, [title, body, docId]);

  // Pole rośnie razem z tekstem — dokument ma się przewijać jak strona,
  // nie jak małe okienko w środku strony.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  }, [body, mode]);

  const flush = useCallback(async () => {
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    // Pętla zamiast rekurencji: jeśli w trakcie zapisu ktoś dalej pisał,
    // zapisujemy jeszcze raz najświeższą wersję.
    do {
      again.current = false;
      const { title: t, body: b, docId: id } = latest.current;
      if (!id && !t.trim() && !b.trim()) break;
      setState("saving");
      const result = await saveDocument({ id: id ?? undefined, title: t, body: b });
      if (result.error) {
        inFlight.current = false;
        setState("error");
        toast({ tone: "error", title: "Nie udało się zapisać dokumentu", description: result.error });
        return;
      }
      if (!id && result.id) {
        latest.current = { ...latest.current, docId: result.id };
        setDocId(result.id);
        // Adres bez przeładowania — kursor zostaje tam, gdzie był.
        window.history.replaceState(null, "", `/app/docs/${result.id}`);
      }
      setSavedAt(new Date().toISOString());
    } while (again.current);
    inFlight.current = false;
    setState("saved");
  }, [toast]);

  const schedule = () => {
    setState("dirty");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 900);
  };

  // Wyjście ze strony z niezapisanym tekstem — zapis, zanim zniknie.
  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (timer.current || inFlight.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  const replaceRange = (start: number, end: number, text: string, caret?: number) => {
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    schedule();
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      const at = caret ?? start + text.length;
      el.setSelectionRange(at, at);
    });
  };

  /** Prefiks na początku każdej zaznaczonej linijki („# ", „- "). */
  const prefixLines = (prefix: string) => {
    const el = area.current;
    if (!el) return;
    const lineStart = body.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const lineEnd = body.indexOf("\n", el.selectionEnd);
    const end = lineEnd === -1 ? body.length : lineEnd;
    const block = body
      .slice(lineStart, end)
      .split("\n")
      .map((line) => prefix + line.replace(/^(#{1,3} |- \[[ xX]\] |- )/, ""))
      .join("\n");
    replaceRange(lineStart, end, block);
  };

  const bold = () => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    if (start === end) return;
    replaceRange(start, end, `**${body.slice(start, end)}**`);
  };

  const applySlash = (prefix: string) => {
    if (!slash) return;
    replaceRange(slash.index, slash.index + 1, prefix);
    setSlash(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    if (slash) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashActive((value) => (value + 1) % SLASH_ITEMS.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashActive((value) => (value - 1 + SLASH_ITEMS.length) % SLASH_ITEMS.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        applySlash(SLASH_ITEMS[slashActive]!.prefix);
        return;
      }
      if (event.key === "Escape") {
        setSlash(null);
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      bold();
      return;
    }
    // Enter na liście kontynuuje listę; Enter na pustym punkcie ją kończy.
    if (event.key === "Enter" && !event.shiftKey && el.selectionStart === el.selectionEnd) {
      const lineStart = body.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const line = body.slice(lineStart, el.selectionStart);
      const list = /^(\s*)(- \[[ xX]\] |- )(.*)$/.exec(line);
      if (list) {
        event.preventDefault();
        if (!list[3]!.trim()) {
          replaceRange(lineStart, el.selectionStart, "");
        } else {
          const next = list[2]!.startsWith("- [") ? "- [ ] " : "- ";
          replaceRange(el.selectionStart, el.selectionStart, `\n${list[1]}${next}`);
        }
      }
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const caret = event.target.selectionStart;
    setBody(value);
    schedule();
    // „/" jako pierwszy znak pustej linijki otwiera menu wstawiania.
    const lineStart = value.lastIndexOf("\n", caret - 2) + 1;
    if (value[caret - 1] === "/" && caret - 1 === lineStart) {
      setSlash({ index: caret - 1 });
      setSlashActive(0);
    } else if (slash) {
      setSlash(null);
    }
  };

  const stateLabel =
    state === "saving"
      ? "Zapisuję…"
      : state === "dirty"
        ? "Zmiany czekają na zapis"
        : state === "error"
          ? "Nie zapisano"
          : savedAt
            ? `Zapisano ${formatMoment(savedAt)}`
            : canEdit
              ? "Zapisze się sam od pierwszego znaku"
              : "";

  return (
    <div className="page">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/app/docs"
          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white sm:min-h-0"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dokumenty
        </Link>
        <span className="text-[12.5px] text-[var(--text-subtle)]">
          {editorName && editorName !== authorName
            ? `Autor: ${authorName ?? "ktoś z teamu"} · ostatnia zmiana: ${editorName}`
            : authorName
              ? `Pisze ${authorName}`
              : null}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[12.5px]",
            state === "error" ? "text-[var(--danger)]" : "text-[var(--text-subtle)]"
          )}
          aria-live="polite"
        >
          {state === "saved" ? <Check className="size-3.5 text-[var(--success)]" /> : null}
          {stateLabel}
        </span>
        {canEdit ? (
          <div role="tablist" aria-label="Tryb" className="inline-flex rounded-lg bg-[var(--surface)] p-0.5">
            {(
              [
                ["write", "Pisanie"],
                ["read", "Podgląd"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "h-9 rounded-md px-2.5 text-[12.5px] font-medium sm:h-7",
                  mode === id ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)] hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <Menu label="Więcej">
          {(close) => (
            <>
              <MenuItem
                icon={Copy}
                disabled={!docId}
                onClick={() => {
                  close();
                  void navigator.clipboard
                    ?.writeText(window.location.href)
                    .then(() => toast({ title: "Link do dokumentu skopiowany" }));
                }}
              >
                Kopiuj link
              </MenuItem>
              {canEdit && docId ? (
                <>
                  <MenuSeparator />
                  <MenuItem
                    icon={Trash2}
                    tone="danger"
                    onClick={() => {
                      close();
                      setDeleting(true);
                    }}
                  >
                    Usuń dokument
                  </MenuItem>
                </>
              ) : null}
            </>
          )}
        </Menu>
      </div>

      {!canEdit ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
          <Lock className="size-3.5" aria-hidden="true" />
          Tylko do odczytu — ten dokument zmienia {authorName ?? "autor"}, Founder albo Admin.
        </p>
      ) : null}

      <p className="mt-4 text-[12.5px] text-[var(--text-subtle)]">
        Dowód celu zapisany z tego tekstu jest osobną kopią — późniejsze zmiany go nie podmienią.
      </p>

      {mode === "write" ? (
        <>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              schedule();
            }}
            maxLength={140}
            placeholder="Tytuł"
            aria-label="Tytuł dokumentu"
            className="mt-5 w-full bg-transparent font-heading text-[2rem] font-semibold leading-tight text-white outline-none placeholder:text-[var(--text-faint)]"
          />

          {selection || slash ? (
            <div className="sticky top-16 z-20 mt-3 flex w-fit flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[var(--surface-2)] p-1 lift-3 lg:top-3">
              {slash ? (
                <ul role="listbox" aria-label="Wstaw" className="flex flex-col py-0.5">
                  {SLASH_ITEMS.map((item, index) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === slashActive}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySlash(item.prefix)}
                        className={cn(
                          "flex min-h-10 w-56 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px]",
                          index === slashActive ? "bg-white/[0.08] text-white" : "text-[var(--text-muted)]"
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ToolButton label="Pogrubienie (Ctrl+B)" onClick={bold}>
                    <Bold className="size-4" />
                  </ToolButton>
                  <ToolButton label="Nagłówek" onClick={() => prefixLines("# ")}>
                    <Heading1 className="size-4" />
                  </ToolButton>
                  <ToolButton label="Podtytuł" onClick={() => prefixLines("## ")}>
                    <Heading2 className="size-4" />
                  </ToolButton>
                  <ToolButton label="Lista" onClick={() => prefixLines("- ")}>
                    <List className="size-4" />
                  </ToolButton>
                  <ToolButton label="Lista do odhaczenia" onClick={() => prefixLines("- [ ] ")}>
                    <CheckSquare className="size-4" />
                  </ToolButton>
                </>
              )}
            </div>
          ) : null}

          <textarea
            ref={area}
            value={body}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onSelect={(event) => {
              const el = event.currentTarget;
              setSelection(el.selectionStart !== el.selectionEnd);
            }}
            onBlur={() => {
              setSelection(false);
              if (timer.current) {
                window.clearTimeout(timer.current);
                timer.current = null;
                void flush();
              }
            }}
            aria-label="Treść dokumentu"
            placeholder={"Zacznij pisać.\nNa pustej linii wpisz „/”, żeby wstawić nagłówek albo listę."}
            className="mt-4 w-full resize-none overflow-hidden bg-transparent text-[16px] leading-[1.75] text-[var(--text-muted)] outline-none placeholder:text-[var(--text-faint)]"
          />
          <p className="mt-6 text-[12px] text-[var(--text-subtle)]">
            Skróty: „# ” nagłówek · „- ” lista · „- [ ] ” do odhaczenia · **tekst** pogrubienie · Ctrl+B
          </p>
        </>
      ) : (
        <article className="mt-5">
          <h1 className="font-heading text-[2rem] font-semibold leading-tight text-white">
            {title || "Bez tytułu"}
          </h1>
          <div className="mt-5">
            {body.trim() ? (
              <Markdown source={body} />
            ) : (
              <p className="text-[15px] text-[var(--text-subtle)]">Dokument jest pusty.</p>
            )}
          </div>
        </article>
      )}

      {deleting && docId ? (
        <Modal
          title="Usunąć ten dokument?"
          description="Zniknie z półki dla całego zespołu. Dowody celów zapisane z niego zostają, bo są osobnymi kopiami."
          onClose={() => setDeleting(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(false)}>
                Zostaw
              </Button>
              <Button
                variant="danger"
                loading={deletePending}
                onClick={async () => {
                  setDeletePending(true);
                  const result = await deleteDocument(docId);
                  setDeletePending(false);
                  if (result.error) {
                    toast({ tone: "error", title: "Nie udało się usunąć", description: result.error });
                    return;
                  }
                  if (timer.current) window.clearTimeout(timer.current);
                  timer.current = null;
                  toast({ title: "Dokument usunięty" });
                  router.push("/app/docs");
                }}
              >
                Usuń dokument
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-white">{title || "Bez tytułu"}</p>
        </Modal>
      ) : null}
    </div>
  );
}

function ToolButton({
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
      title={label}
      // Bez tego kliknięcie zabrałoby fokus z pola i zaznaczenie by zniknęło.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/[0.08] hover:text-white sm:size-9"
    >
      {children}
    </button>
  );
}
