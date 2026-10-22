import { Fragment } from "react";

/**
 * Bardzo mały Markdown dla Dokumentów: nagłówki (#, ##, ###), listy (-),
 * listy do odhaczenia (- [ ] / - [x]), pogrubienie (**…**) i linki.
 *
 * Bez `dangerouslySetInnerHTML` — każdy fragment jest elementem Reacta, więc
 * tekst wpisany przez członka zespołu nie może wstrzyknąć HTML-a innym.
 */

type Block =
  | { kind: "h1" | "h2" | "h3" | "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "todo"; items: { done: boolean; text: string }[] };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "p", text: paragraph.join("\n") });
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const todo = /^\s*[-*] \[( |x|X)\] (.*)$/.exec(line);
    const bullet = /^\s*[-*] (.*)$/.exec(line);
    const heading = /^(#{1,3}) (.*)$/.exec(line);

    if (!line.trim()) {
      flush();
      continue;
    }
    if (heading) {
      flush();
      const level = heading[1]!.length as 1 | 2 | 3;
      blocks.push({ kind: `h${level}` as "h1" | "h2" | "h3", text: heading[2]! });
      continue;
    }
    if (todo) {
      flush();
      const last = blocks[blocks.length - 1];
      const item = { done: todo[1] !== " ", text: todo[2]! };
      if (last?.kind === "todo") last.items.push(item);
      else blocks.push({ kind: "todo", items: [item] });
      continue;
    }
    if (bullet) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(bullet[1]!);
      else blocks.push({ kind: "ul", items: [bullet[1]!] });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Pogrubienie i linki wewnątrz linijki. */
function inline(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {token}
        </a>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="flex flex-col gap-3 text-[16px] leading-[1.75] text-[var(--text-muted)]">
      {blocks.map((block, index) => {
        if (block.kind === "h1") {
          return (
            <h2 key={index} className="mt-4 font-heading text-[1.45rem] font-semibold leading-snug text-white first:mt-0">
              {inline(block.text)}
            </h2>
          );
        }
        if (block.kind === "h2") {
          return (
            <h3 key={index} className="mt-3 font-heading text-[1.15rem] font-semibold leading-snug text-white first:mt-0">
              {inline(block.text)}
            </h3>
          );
        }
        if (block.kind === "h3") {
          return (
            <h4 key={index} className="mt-2 text-[16px] font-semibold text-white first:mt-0">
              {inline(block.text)}
            </h4>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={index} className="flex list-disc flex-col gap-1 pl-6 marker:text-[var(--text-subtle)]">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "todo") {
          return (
            <ul key={index} className="flex flex-col gap-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={
                      "mt-[7px] inline-flex size-4 shrink-0 items-center justify-center rounded border text-[10px] " +
                      (item.done
                        ? "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]"
                        : "border-white/30")
                    }
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span className={item.done ? "text-[var(--text-subtle)] line-through" : undefined}>
                    {inline(item.text)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {block.text.split("\n").map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? "\n" : null}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Zwykły tekst do podglądu na karcie: bez znaczników, linijka po linijce. */
export function plainPreview(source: string, lines = 3) {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,3} /, "")
        .replace(/^\s*[-*] \[( |x|X)\] /, "")
        .replace(/^\s*[-*] /, "• ")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .trim()
    )
    .filter(Boolean)
    .slice(0, lines);
}

/** Tytuł z pierwszej linijki, gdy ktoś wyszedł bez nadania nazwy. */
export function titleFromBody(source: string) {
  const first = plainPreview(source, 1)[0]?.replace(/^• /, "") ?? "";
  return first.slice(0, 120) || "Bez tytułu";
}
