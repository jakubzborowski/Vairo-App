"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FieldInputProps } from "./field-inputs";

type StoredFile = { path: string; name: string; size: number };

const asFiles = (value: unknown): StoredFile[] =>
  Array.isArray(value)
    ? (value.filter(
        (v) => typeof v === "object" && v !== null && "path" in v
      ) as StoredFile[])
    : [];

/**
 * Załączniki podpunktu.
 *
 * Bucket `stage-files` jest prywatny — pliki leżą pod ścieżką
 * `<startup_stage_id>/…`, a RLS sprawdza członkostwo w startupie.
 * Podgląd otwieramy podpisanym URL-em ważnym przez minutę.
 */
export function StageFilesInput({
  field,
  value,
  onChange,
  disabled,
  startupStageId,
}: FieldInputProps & { startupStageId: string }) {
  const files = asFiles(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxFiles = field.config.max_files ?? 10;
  const maxMb = field.config.max_mb ?? 20;

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);
    setBusy(true);

    const supabase = createClient();
    const uploaded: StoredFile[] = [];

    for (const file of Array.from(list)) {
      if (file.size > maxMb * 1024 * 1024) {
        setError(`„${file.name}” przekracza ${maxMb} MB.`);
        continue;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${startupStageId}/${field.answerKey}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("stage-files")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      uploaded.push({ path, name: file.name, size: file.size });
    }

    if (uploaded.length > 0) {
      onChange([...files, ...uploaded].slice(0, maxFiles));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (target: StoredFile) => {
    const supabase = createClient();
    await supabase.storage.from("stage-files").remove([target.path]);
    onChange(files.filter((f) => f.path !== target.path));
  };

  const open = async (target: StoredFile) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("stage-files")
      .createSignedUrl(target.path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={field.config.accept}
        className="sr-only"
        onChange={(e) => void upload(e.target.files)}
      />

      {files.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={file.path}
              className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-[var(--surface-2)] px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-[var(--text-faint)]" />
              <button
                type="button"
                onClick={() => void open(file)}
                className="min-w-0 flex-1 truncate text-left text-[13px] text-white hover:underline"
              >
                {file.name}
              </button>
              <span className="tabular shrink-0 text-[12px] text-[var(--text-faint)]">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => void remove(file)}
                disabled={disabled}
                aria-label={`Usuń ${file.name}`}
                className="rounded-md p-1 text-[var(--text-faint)] transition-colors hover:bg-white/6 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {files.length < maxFiles ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
          {busy ? "Wysyłanie…" : "Dodaj plik"}
        </button>
      ) : null}

      {error ? (
        <p className="mt-2 text-[12px] text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
