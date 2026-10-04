"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export type LibraryFile = {
  id: string;
  name: string;
  path: string;
  size: number;
  source: "library" | "stage";
  uploadedBy: string | null;
};

const MAX_MB = 20;

export function FileLibrary({
  startupId,
  userId,
  canManage,
  files,
}: {
  startupId: string;
  userId: string;
  canManage: boolean;
  files: LibraryFile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async (path: string) => {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("stage-files")
      .createSignedUrl(path, 60);
    if (signError || !data?.signedUrl) {
      setError("Nie udało się otworzyć pliku.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();

    for (const file of Array.from(list)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`„${file.name}” przekracza ${MAX_MB} MB.`);
        continue;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${startupId}/library/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("stage-files")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { error: rowError } = await supabase.from("startup_files").insert({
        startup_id: startupId,
        storage_path: path,
        name: file.name,
        size_bytes: file.size,
        uploaded_by: userId,
      });
      if (rowError) setError(rowError.message);
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  const remove = async (file: LibraryFile) => {
    if (file.source !== "library") return;
    const supabase = createClient();
    await supabase.storage.from("stage-files").remove([file.path]);
    const { error: rowError } = await supabase
      .from("startup_files")
      .delete()
      .eq("id", file.id);
    if (rowError) {
      setError(rowError.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => upload(event.target.files)}
        />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Dodaj pliki
        </Button>
        <p className="text-[13px] text-[var(--text-subtle)]">
          Do {MAX_MB} MB. Widzą je osoby z tego teamu.
        </p>
      </div>

      {error ? <p className="text-[13px] text-[var(--warning)]">{error}</p> : null}

      {files.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-[14px] text-[var(--text-muted)]">
          Nie ma jeszcze plików. Dodaj opis pomysłu, wnioski z rozmów albo wynik
          dotychczasowej pracy.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => {
            const own = file.uploadedBy === userId;
            const canDelete = file.source === "library" && (own || canManage);
            return (
              <li
                key={`${file.source}-${file.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--surface-2)] px-3 py-2.5"
              >
                <FileText className="size-4 shrink-0 text-[var(--text-faint)]" />
                <button
                  type="button"
                  onClick={() => open(file.path)}
                  className="min-w-0 flex-1 truncate text-left text-[14px] text-white hover:underline"
                >
                  {file.name}
                </button>
                <span className="shrink-0 text-[12px] text-[var(--text-faint)]">
                  {file.source === "stage" ? "Z etapu" : formatSize(file.size)}
                </span>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => remove(file)}
                    aria-label={`Usuń ${file.name}`}
                    className="rounded-md p-1.5 text-[var(--text-faint)] hover:bg-white/6 hover:text-white"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
