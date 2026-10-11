"use client";

import { useState, useTransition } from "react";
import { deleteDocument, saveDocument } from "./actions";
import { Button } from "@/components/ui/button";

export type DocItem = { id: string; title: string; body: string };

export function DocsEditor({ documents }: { documents: DocItem[] }) {
  const [currentId, setCurrentId] = useState<string | null>(documents[0]?.id ?? null);
  const current = documents.find((doc) => doc.id === currentId) ?? null;
  const [title, setTitle] = useState(current?.title ?? "");
  const [body, setBody] = useState(current?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = (doc: DocItem | null) => {
    setCurrentId(doc?.id ?? null);
    setTitle(doc?.title ?? "");
    setBody(doc?.body ?? "");
    setError(null);
  };

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={() => open(null)}>
          Nowy dokument
        </Button>
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => open(doc)}
            className="rounded-xl border border-white/10 px-3 py-2 text-left text-[13.5px] text-white hover:border-white/20"
          >
            {doc.title}
          </button>
        ))}
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          start(async () => {
            const result = await saveDocument({
              id: currentId ?? undefined,
              title,
              body,
            });
            setError(result.error ?? null);
          });
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tytuł"
          className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[14px] text-white"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={14}
          placeholder="Nagłówki, listy i linki zapisujesz jako tekst."
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[14px] leading-relaxed text-white"
        />
        {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            Zapisz
          </Button>
          {currentId ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                start(async () => {
                  const result = await deleteDocument(currentId);
                  if (result.error) setError(result.error ?? null);
                  else open(null);
                });
              }}
            >
              Usuń
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
