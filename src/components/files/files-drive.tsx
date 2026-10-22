"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Lock,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateDbError } from "@/lib/db-errors";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { ModuleHeader } from "@/components/ui/module-header";
import { useToast } from "@/components/ui/toast";
import { formatDay, formatMoment, plural } from "@/components/goals/goal-format";
import { cn } from "@/lib/utils";
import type { DriveFile, DriveFolder } from "@/lib/files";
import { Field, Input } from "@/components/ui/input";
import {
  createFolder,
  deleteFolder,
  moveFile,
  renameFile,
  renameFolder,
} from "@/app/app/files/actions";

const MAX_MB = 20;
const VIEW_KEY = "vairo:files:view";

type Place =
  | { kind: "all" }
  | { kind: "library" }
  | { kind: "folder"; id: string }
  | { kind: "stages" }
  | { kind: "stage"; title: string };

type Upload = {
  id: string;
  name: string;
  state: "sending" | "done" | "error";
  message?: string;
  file?: globalThis.File;
  /** 0–100, gdy znamy postęp (wysyłka przez podpisany link). */
  progress?: number;
};

/**
 * Wysyłka z postępem: podpisany link do jednorazowego zapisu + XHR, bo
 * `upload()` z supabase-js nie mówi, ile już poszło. Gdy cokolwiek się nie
 * uda (stara wersja Storage, sieć), wracamy do zwykłego `upload()` — plik ma
 * trafić na miejsce, procenty są dodatkiem.
 */
async function uploadWithProgress(
  path: string,
  file: globalThis.File,
  onProgress: (percent: number) => void
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const signed = await supabase.storage.from("stage-files").createSignedUploadUrl(path);
  if (signed.error || !signed.data?.signedUrl) {
    const { error } = await supabase.storage
      .from("stage-files")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    return { error: error?.message ?? null };
  }
  const url = signed.data.signedUrl;
  const viaXhr = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
  if (viaXhr) return { error: null };
  const { error } = await supabase.storage
    .from("stage-files")
    .uploadToSignedUrl(path, signed.data.token, file, { contentType: file.type || undefined });
  return { error: error?.message ?? null };
}

type SortKey = "name" | "date" | "size";

const subscribeNoop = () => () => {};
function readView(): "grid" | "list" {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return FileImage;
  if (["xls", "xlsx", "csv", "numbers", "ods"].includes(ext)) return FileSpreadsheet;
  if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt", "pages"].includes(ext)) return FileText;
  return File;
}

function kindLabel(name: string) {
  const ext = name.split(".").pop()?.toUpperCase();
  return ext && ext.length <= 5 ? ext : "Plik";
}

/**
 * Pliki — układ znany z dysku w komputerze: po lewej miejsca, na górze
 * ścieżka i przełącznik widoku, w środku foldery i pliki, a po wybraniu
 * pliku — szczegóły: kto, kiedy, skąd.
 *
 * Foldery „Z etapów" tworzą się same z danych: każdy etap to folder, a plik
 * pamięta pytanie, przy którym go dodano. Upuszczenie pliku w dowolnym
 * miejscu listy też go dodaje; postęp wysyłania pokazuje okienko w prawym
 * dolnym rogu.
 */
export function FilesDrive({
  startupId,
  userId,
  canManage,
  files,
  folders = [],
  foldersAvailable = false,
}: {
  startupId: string;
  userId: string;
  canManage: boolean;
  files: DriveFile[];
  /** Własne foldery (030). Bez migracji lista jest pusta, a akcje schowane. */
  folders?: DriveFolder[];
  foldersAvailable?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [place, setPlace] = useState<Place>({ kind: "all" });
  const persistedView = useSyncExternalStore(subscribeNoop, readView, () => "grid" as const);
  const [viewOverride, setViewOverride] = useState<"grid" | "list" | null>(null);
  const view = viewOverride ?? persistedView;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "date", desc: true });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<DriveFile | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [context, setContext] = useState<{ x: number; y: number; file: DriveFile } | null>(null);
  const [areaMenu, setAreaMenu] = useState<{ x: number; y: number } | null>(null);
  const dragDepth = useRef(0);
  const [naming, setNaming] = useState<
    | { kind: "new-folder" }
    | { kind: "rename-folder"; folder: DriveFolder }
    | { kind: "rename-file"; file: DriveFile }
    | null
  >(null);
  const [moving, setMoving] = useState<DriveFile | null>(null);
  const [busy, startBusy] = useTransition();
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const currentFolderId = place.kind === "folder" ? place.id : null;

  const setView = (next: "grid" | "list") => {
    setViewOverride(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // bez zapamiętania — widok i tak działa
    }
  };

  const stageFolders = useMemo(() => {
    const map = new Map<string, { title: string; position: number; count: number }>();
    for (const file of files) {
      if (file.source !== "stage" || !file.stageTitle) continue;
      const entry = map.get(file.stageTitle) ?? {
        title: file.stageTitle,
        position: file.stagePosition ?? 0,
        count: 0,
      };
      entry.count += 1;
      map.set(file.stageTitle, entry);
    }
    return [...map.values()].sort((a, b) => a.position - b.position);
  }, [files]);

  const library = files.filter((file) => file.source === "library");
  const stageCount = files.length - library.length;

  const visible = useMemo(() => {
    const list = files.filter((file) => {
      if (place.kind === "library") return file.source === "library" && (!foldersAvailable || !file.folderId);
      if (place.kind === "folder") return file.source === "library" && file.folderId === place.id;
      if (place.kind === "stages") return false;
      if (place.kind === "stage") return file.source === "stage" && file.stageTitle === place.title;
      return true;
    });
    const dir = sort.desc ? -1 : 1;
    return list.sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name, "pl") * dir;
      if (sort.key === "size") return (a.size - b.size) * dir;
      return ((a.createdAt ?? "") < (b.createdAt ?? "") ? -1 : 1) * dir;
    });
  }, [files, place, sort, foldersAvailable]);

  const selected = files.find((file) => file.id === selectedId) ?? null;

  const canDelete = (file: DriveFile) =>
    file.source === "library" && (file.uploadedBy === userId || canManage);

  const signedUrl = async (file: DriveFile, download = false) => {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("stage-files")
      .createSignedUrl(file.path, 3600, download ? { download: file.name } : undefined);
    if (error || !data?.signedUrl) {
      toast({
        tone: "error",
        title: "Nie udało się otworzyć pliku",
        description: "Odśwież stronę. Jeśli wraca, plik mógł zostać usunięty.",
      });
      return null;
    }
    return data.signedUrl;
  };

  const open = async (file: DriveFile) => {
    const url = await signedUrl(file);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const download = async (file: DriveFile) => {
    const url = await signedUrl(file, true);
    if (url) window.location.href = url;
  };
  const copyLink = async (file: DriveFile) => {
    const url = await signedUrl(file);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link skopiowany", description: "Działa przez godzinę — potem trzeba skopiować nowy." });
    } catch {
      toast({ tone: "error", title: "Nie udało się skopiować linku" });
    }
  };

  const sendOne = async (file: globalThis.File, id: string) => {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, state: "sending", message: undefined } : item))
    );
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploads((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                state: "error",
                message: `Za duży — limit to ${MAX_MB} MB. Zmniejsz plik albo podziel go na części.`,
              }
            : item
        )
      );
      return false;
    }
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${startupId}/library/${Date.now()}-${safeName}`;
    const { error: uploadMessage } = await uploadWithProgress(path, file, (percent) =>
      setUploads((current) => current.map((item) => (item.id === id ? { ...item, progress: percent } : item)))
    );
    const uploadError = uploadMessage ? { message: uploadMessage } : null;
    const { error: rowError } = uploadError
      ? { error: null }
      : await supabase.from("startup_files").insert({
          startup_id: startupId,
          storage_path: path,
          name: file.name,
          size_bytes: file.size,
          uploaded_by: userId,
          // Plik wrzucony we wnętrzu folderu trafia do tego folderu.
          ...(currentFolderId ? { folder_id: currentFolderId } : {}),
        });
    // Plik jest już w buckecie, ale bez wiersza nikt go nie zobaczy na liście
    // ani nie usunie — sprzątamy go od razu.
    if (rowError) await supabase.storage.from("stage-files").remove([path]);
    const problem = uploadError?.message ?? rowError?.message ?? null;
    setUploads((current) =>
      current.map((item) =>
        item.id === id
          ? problem
            ? { ...item, state: "error", message: translateDbError(problem) ?? undefined }
            : { ...item, state: "done" }
          : item
      )
    );
    return !problem;
  };

  const upload = async (list: FileList | globalThis.File[] | null) => {
    const chosen = list ? Array.from(list) : [];
    if (chosen.length === 0) return;
    const batch = chosen.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      state: "sending" as const,
      file,
    }));
    setUploads((current) => [...current.filter((item) => item.state !== "done"), ...batch]);
    // Nowe pliki trafiają do „Od zespołu" — tam je widać od razu.
    if (place.kind === "stage" || place.kind === "stages" || place.kind === "all") setPlace({ kind: "library" });
    let sent = 0;
    for (const item of batch) {
      if (await sendOne(item.file, item.id)) sent += 1;
    }
    if (inputRef.current) inputRef.current.value = "";
    if (sent > 0) {
      toast({ title: sent === 1 ? "Plik dodany" : `Dodano ${sent} ${plural(sent, "plik", "pliki", "plików")}` });
      router.refresh();
    }
  };

  const remove = async (file: DriveFile) => {
    setDeletePending(true);
    const supabase = createClient();
    // Najpierw plik w Storage, potem wiersz — odwrotna kolejność zostawiłaby
    // sierotę w buckecie, której nikt już nie zobaczy na liście.
    const { error: storageError } = await supabase.storage.from("stage-files").remove([file.path]);
    const { data: removed, error: rowError } = storageError
      ? { data: null, error: storageError }
      : await supabase.from("startup_files").delete().eq("id", file.id).select("id");
    setDeletePending(false);
    if (rowError || !removed || removed.length === 0) {
      toast({
        tone: "error",
        title: "Nie udało się usunąć pliku",
        // RLS przy cudzym pliku nie zwraca błędu, tylko zero usuniętych wierszy.
        description: rowError
          ? (translateDbError(rowError.message) ?? undefined)
          : "Plik usuwa osoba, która go dodała, albo Founder lub Admin.",
      });
      return;
    }
    setDeleting(null);
    if (selectedId === file.id) setSelectedId(null);
    toast({ title: "Plik usunięty", description: file.name });
    router.refresh();
  };

  useEffect(() => {
    if (!context) return;
    const close = () => setContext(null);
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", close);
    };
  }, [context]);

  // Podgląd obrazu i PDF w panelu — podpisany link tylko dla wybranego pliku.
  useEffect(() => {
    if (!selected || !previewable(selected.name)) return;
    let alive = true;
    const supabase = createClient();
    void supabase.storage
      .from("stage-files")
      .createSignedUrl(selected.path, 600)
      .then(({ data }) => {
        if (alive && data?.signedUrl) setPreview({ id: selected.id, url: data.signedUrl });
      });
    return () => {
      alive = false;
    };
  }, [selected]);

  // Ctrl+Shift+N zakłada folder — jak w eksploratorze plików.
  useEffect(() => {
    if (!foldersAvailable) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "n") {
        if (place.kind !== "library" && place.kind !== "folder") return;
        event.preventDefault();
        setNaming({ kind: "new-folder" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [foldersAvailable, place.kind]);

  const crumbs: { label: string; place: Place }[] = [{ label: "Wszystkie pliki", place: { kind: "all" } }];
  if (place.kind === "library" || place.kind === "folder") {
    crumbs.push({ label: "Od zespołu", place: { kind: "library" } });
  }
  if (place.kind === "folder") {
    const chain: DriveFolder[] = [];
    let cursor = folders.find((folder) => folder.id === place.id) ?? null;
    while (cursor && chain.length < 8) {
      chain.unshift(cursor);
      cursor = folders.find((folder) => folder.id === cursor?.parentId) ?? null;
    }
    for (const folder of chain) crumbs.push({ label: folder.name, place: { kind: "folder", id: folder.id } });
  }
  if (place.kind === "stages" || place.kind === "stage") crumbs.push({ label: "Z etapów", place: { kind: "stages" } });
  if (place.kind === "stage") crumbs.push({ label: place.title, place });

  const fileActions = (file: DriveFile, close: () => void) => (
    <>
      <MenuItem icon={ExternalLink} onClick={() => { close(); void open(file); }}>
        Otwórz
      </MenuItem>
      <MenuItem icon={Download} onClick={() => { close(); void download(file); }}>
        Pobierz
      </MenuItem>
      <MenuItem icon={Copy} onClick={() => { close(); void copyLink(file); }}>
        Kopiuj link
      </MenuItem>
      {foldersAvailable ? (
        <>
          <MenuSeparator />
          <MenuItem
            icon={Pencil}
            disabled={!canDelete(file)}
            hint={
              file.source === "stage"
                ? "Nazwę ustala odpowiedź w etapie."
                : canDelete(file)
                  ? undefined
                  : "Zmienić nazwę cudzego pliku może Founder albo Admin."
            }
            onClick={() => { close(); setNaming({ kind: "rename-file", file }); }}
          >
            Zmień nazwę
          </MenuItem>
          <MenuItem
            icon={FolderInput}
            disabled={!canDelete(file)}
            hint={
              file.source === "stage"
                ? "Należy do odpowiedzi w etapie — zostaje w jego folderze."
                : canDelete(file)
                  ? undefined
                  : "Przenieść cudzy plik może Founder albo Admin."
            }
            onClick={() => { close(); setMoving(file); }}
          >
            Przenieś do…
          </MenuItem>
        </>
      ) : null}
      <MenuSeparator />
      <MenuItem
        icon={Trash2}
        tone="danger"
        disabled={!canDelete(file)}
        hint={
          file.source === "stage"
            ? "Należy do odpowiedzi w etapie. Usuniesz go, zmieniając tę odpowiedź."
            : canDelete(file)
              ? undefined
              : "Usunąć cudzy plik może Founder albo Admin."
        }
        onClick={() => { close(); setDeleting(file); }}
      >
        Usuń
      </MenuItem>
    </>
  );

  const places: { id: string; label: string; count: number; place: Place; icon: typeof Folder; indent?: boolean }[] = [
    { id: "all", label: "Wszystkie pliki", count: files.length, place: { kind: "all" }, icon: FolderOpen },
    { id: "library", label: "Od zespołu", count: library.length, place: { kind: "library" }, icon: Folder },
    ...folders
      .filter((folder) => !folder.parentId)
      .map((folder) => ({
        id: `folder-${folder.id}`,
        label: folder.name,
        count: files.filter((file) => file.folderId === folder.id).length,
        place: { kind: "folder", id: folder.id } as Place,
        icon: Folder,
        indent: true,
      })),
    { id: "stages", label: "Z etapów", count: stageCount, place: { kind: "stages" }, icon: Folder },
    ...stageFolders.map((folder) => ({
      id: `stage-${folder.title}`,
      label: folder.title,
      count: folder.count,
      place: { kind: "stage", title: folder.title } as Place,
      icon: Folder,
      indent: true,
    })),
  ];
  const isPlace = (candidate: Place) =>
    candidate.kind === place.kind &&
    (candidate.kind !== "stage" || (place.kind === "stage" && candidate.title === place.title)) &&
    (candidate.kind !== "folder" || (place.kind === "folder" && candidate.id === place.id));

  // Podfoldery bieżącego miejsca — kafelki nad plikami, jak na dysku.
  const childFolders =
    place.kind === "library"
      ? folders.filter((folder) => !folder.parentId)
      : place.kind === "folder"
        ? folders.filter((folder) => folder.parentId === place.id)
        : [];
  const canCreateFolder = foldersAvailable && (place.kind === "library" || place.kind === "folder");

  const submitName = (value: string) => {
    if (!naming) return;
    startBusy(async () => {
      const result =
        naming.kind === "new-folder"
          ? await createFolder({ startupId, name: value, parentId: currentFolderId })
          : naming.kind === "rename-folder"
            ? await renameFolder(startupId, naming.folder.id, value)
            : await renameFile(startupId, naming.file.id, value);
      if (result.error) {
        toast({ tone: "error", title: "Nie udało się zapisać", description: result.error });
        return;
      }
      toast({
        title:
          naming.kind === "new-folder" ? "Folder założony" : naming.kind === "rename-folder" ? "Folder przemianowany" : "Nazwa zmieniona",
        description: value,
      });
      setNaming(null);
      router.refresh();
    });
  };

  return (
    <div className="page-wide">
      <ModuleHeader
        title="Pliki"
        subtitle={
          files.length === 0
            ? "Materiały zespołu i pliki z odpowiedzi w etapach."
            : `${files.length} ${plural(files.length, "plik", "pliki", "plików")} · ${library.length} od zespołu, ${stageCount} z etapów.`
        }
        action={
          <div className="flex flex-wrap gap-2">
            {foldersAvailable ? (
              <Button
                variant="secondary"
                disabled={!canCreateFolder}
                title={canCreateFolder ? "Ctrl+Shift+N" : "Foldery zakładasz w „Od zespołu”. Foldery etapów tworzą się same."}
                onClick={() => setNaming({ kind: "new-folder" })}
              >
                <FolderPlus className="size-4" />
                Nowy folder
              </Button>
            ) : null}
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              Dodaj plik
            </Button>
          </div>
        }
      />
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => void upload(event.target.files)}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Miejsca */}
        <nav aria-label="Miejsca" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
          {places.map((item) => {
            const on = isPlace(item.place);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPlace(item.place);
                  setSelectedId(null);
                }}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium transition-colors lg:h-8 lg:min-h-0",
                  item.indent && "lg:pl-7",
                  on ? "bg-white/[0.08] text-white" : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
                <span className="tabular ml-auto pl-2 text-[12px] font-normal text-[var(--text-subtle)]">
                  {item.count}
                </span>
              </button>
            );
          })}
          <p className="hidden px-2.5 pt-3 text-[12px] leading-relaxed text-[var(--text-subtle)] lg:block">
            Do {MAX_MB} MB na plik. Widzą je tylko osoby z tego teamu.
          </p>
        </nav>

        {/* Zawartość */}
        <section
          className="relative min-w-0"
          onDragEnter={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes("Files")) event.preventDefault();
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            void upload(event.dataTransfer.files);
          }}
          onContextMenu={(event) => {
            // Prawy przycisk na pustym miejscu: „Nowy folder" i „Dodaj plik".
            // Na pliku menu otwiera sam plik (stopPropagation niżej).
            if ((event.target as HTMLElement).closest("button, a, input")) return;
            event.preventDefault();
            setAreaMenu({ x: event.clientX, y: event.clientY });
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {crumbs.length > 1 ? (
              <button
                type="button"
                onClick={() => setPlace(crumbs[crumbs.length - 2]!.place)}
                aria-label="Poziom wyżej"
                title="Poziom wyżej"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[var(--text-muted)] transition-colors hover:border-white/22 hover:text-white sm:size-8"
              >
                <ArrowUp className="size-4" />
              </button>
            ) : null}
            <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[13.5px]">
              {crumbs.map((crumb, index) => (
                <li key={crumb.label} className="inline-flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="size-3.5 text-[var(--text-subtle)]" aria-hidden="true" /> : null}
                  {index === crumbs.length - 1 ? (
                    <span className="font-medium text-white">{crumb.label}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlace(crumb.place)}
                      className="rounded px-1 text-[var(--text-muted)] hover:text-white"
                    >
                      {crumb.label}
                    </button>
                  )}
                </li>
              ))}
            </ol>
            <div role="tablist" aria-label="Widok" className="inline-flex rounded-lg border border-white/[0.07] bg-[var(--surface)] p-0.5">
              {(
                [
                  ["grid", LayoutGrid, "Kafelki"],
                  ["list", ListIcon, "Lista"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(id)}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md sm:size-8",
                    view === id ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)] hover:text-white"
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {childFolders.length > 0 ? (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {childFolders.map((folder) => {
                  const count = files.filter((file) => file.folderId === folder.id).length;
                  const mayEdit = canManage || folder.createdBy === userId;
                  return (
                    <li key={folder.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setPlace({ kind: "folder", id: folder.id })}
                        className="flex w-full flex-col items-start gap-2 rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4 pr-10 text-left lift-1 transition-colors hover:border-white/15"
                      >
                        <Folder className="size-7 text-[var(--text-muted)]" strokeWidth={1.5} />
                        <span className="w-full truncate text-[14px] font-medium text-white">{folder.name}</span>
                        <span className="text-[12px] text-[var(--text-subtle)]">
                          {count} {plural(count, "plik", "pliki", "plików")}
                        </span>
                      </button>
                      {mayEdit ? (
                        <div className="absolute right-2 top-2">
                          <Menu label={`Akcje folderu ${folder.name}`}>
                            {(close) => (
                              <>
                                <MenuItem
                                  icon={Pencil}
                                  onClick={() => {
                                    close();
                                    setNaming({ kind: "rename-folder", folder });
                                  }}
                                >
                                  Zmień nazwę
                                </MenuItem>
                                <MenuSeparator />
                                <MenuItem
                                  icon={Trash2}
                                  tone="danger"
                                  hint="Pliki z folderu wrócą do „Od zespołu”. Nic nie zniknie."
                                  onClick={() => {
                                    close();
                                    startBusy(async () => {
                                      const result = await deleteFolder(startupId, folder.id);
                                      if (result.error) {
                                        toast({ tone: "error", title: "Nie udało się usunąć folderu", description: result.error });
                                        return;
                                      }
                                      toast({ title: "Folder usunięty", description: "Pliki wróciły do „Od zespołu”." });
                                      router.refresh();
                                    });
                                  }}
                                >
                                  Usuń folder
                                </MenuItem>
                              </>
                            )}
                          </Menu>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {place.kind === "stages" ? (
              stageFolders.length === 0 ? (
                <EmptyFolder text="Żaden etap nie ma jeszcze plików. Pojawią się tu same, gdy dodacie plik w odpowiedzi na pytanie w etapie." />
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {stageFolders.map((folder) => (
                    <li key={folder.title}>
                      <button
                        type="button"
                        onClick={() => setPlace({ kind: "stage", title: folder.title })}
                        className="flex w-full flex-col items-start gap-2 rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4 text-left lift-1 transition-colors hover:border-white/15"
                      >
                        <Folder className="size-7 text-[var(--text-muted)]" strokeWidth={1.5} />
                        <span className="text-[14px] font-medium text-white">{folder.title}</span>
                        <span className="text-[12px] text-[var(--text-subtle)]">
                          {folder.count} {plural(folder.count, "plik", "pliki", "plików")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : visible.length === 0 ? (
              files.length === 0 ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="topo flex w-full flex-col items-center gap-2 rounded-[25px] border border-dashed border-white/12 px-6 py-12 text-center transition-colors hover:border-white/25"
                >
                  <Upload className="size-7 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span className="font-heading text-[17px] font-semibold text-white">Upuść tu pliki albo wybierz z dysku</span>
                  <span className="max-w-md text-[13px] leading-relaxed text-[var(--text-subtle)]">
                    Opis pomysłu, notatki z rozmów, umowy. Do {MAX_MB} MB na plik. Pliki dodane
                    w odpowiedziach w etapach też się tu pojawią.
                  </span>
                </button>
              ) : (
                <EmptyFolder
                  text={
                    place.kind === "library"
                      ? childFolders.length > 0
                        ? "Luzem nie ma tu plików — są w folderach wyżej."
                        : "Zespół nie dodał jeszcze żadnego pliku. Przeciągnij plik tutaj albo użyj „Dodaj plik”."
                      : place.kind === "folder"
                        ? "Ten folder jest pusty. Przeciągnij tu plik, użyj „Dodaj plik” albo przenieś plik z menu ⋮ „Przenieś do…”."
                        : "Ten folder jest pusty."
                  }
                />
              )
            ) : view === "grid" ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((file) => {
                  const Icon = iconFor(file.name);
                  const on = selectedId === file.id;
                  return (
                    <li key={file.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setSelectedId(file.id)}
                        onDoubleClick={() => void open(file)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setSelectedId(file.id);
                          setContext({ x: event.clientX, y: event.clientY, file });
                        }}
                        className={cn(
                          "flex w-full flex-col gap-3 rounded-2xl border bg-[var(--surface)] p-3.5 text-left lift-1 transition-colors",
                          on ? "border-transparent ring-2 ring-[var(--vairo)]/70" : "border-white/[0.07] hover:border-white/15"
                        )}
                      >
                        <span className="flex h-16 items-center justify-center rounded-xl bg-[var(--bg)]/60">
                          <Icon className="size-7 text-[var(--text-muted)]" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-medium text-white">{file.name}</span>
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--text-subtle)]">
                            {file.source === "stage" ? `Z etapu ${file.stageTitle}` : formatSize(file.size)}
                            {file.createdAt ? ` · ${formatDay(file.createdAt)}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-[var(--surface)]">
                <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_96px_80px] gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[12px] font-medium text-[var(--text-subtle)] md:grid">
                  <SortHeader label="Nazwa" active={sort.key === "name"} desc={sort.desc} onClick={() => setSort({ key: "name", desc: sort.key === "name" ? !sort.desc : false })} />
                  <span>Skąd</span>
                  <span>Kto dodał</span>
                  <SortHeader label="Data" active={sort.key === "date"} desc={sort.desc} onClick={() => setSort({ key: "date", desc: sort.key === "date" ? !sort.desc : true })} />
                  <SortHeader label="Rozmiar" active={sort.key === "size"} desc={sort.desc} onClick={() => setSort({ key: "size", desc: sort.key === "size" ? !sort.desc : true })} />
                </div>
                <ul className="divide-y divide-white/[0.05]">
                  {visible.map((file) => {
                    const Icon = iconFor(file.name);
                    const on = selectedId === file.id;
                    return (
                      <li key={file.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(file.id)}
                          onDoubleClick={() => void open(file)}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            setSelectedId(file.id);
                            setContext({ x: event.clientX, y: event.clientY, file });
                          }}
                          className={cn(
                            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_96px_80px]",
                            on ? "bg-[var(--vairo)]/[0.07]" : "hover:bg-white/[0.03]"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Icon className="size-4 shrink-0 text-[var(--text-muted)]" />
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] text-white">{file.name}</span>
                              <span className="block truncate text-[12px] text-[var(--text-subtle)] md:hidden">
                                {formatSize(file.size)}
                                {file.createdAt ? ` · ${formatDay(file.createdAt)}` : ""}
                              </span>
                            </span>
                          </span>
                          <span className="hidden truncate text-[12.5px] text-[var(--text-muted)] md:block">
                            {file.source === "stage" ? (file.question ?? `Etap ${file.stageTitle}`) : "Dodany tutaj"}
                          </span>
                          <span className="hidden truncate text-[12.5px] text-[var(--text-muted)] md:block">
                            {file.uploaderName ?? "—"}
                          </span>
                          <span className="hidden text-[12.5px] text-[var(--text-muted)] md:block">
                            {file.createdAt ? formatDay(file.createdAt) : "—"}
                          </span>
                          <span className="tabular text-right text-[12.5px] text-[var(--text-muted)]">
                            {formatSize(file.size)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {dragging ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--vairo)]/60 bg-[var(--bg)]/85 backdrop-blur-sm">
              <Upload className="size-8 text-[var(--vairo)]" strokeWidth={1.5} />
              <p className="font-heading text-[17px] font-semibold text-white">
                Upuść, żeby dodać do „{place.kind === "folder" ? (folders.find((folder) => folder.id === place.id)?.name ?? "folderu") : "Od zespołu"}”
              </p>
              <p className="text-[13px] text-[var(--text-muted)]">Do {MAX_MB} MB na plik</p>
            </div>
          ) : null}
        </section>
      </div>

      {selected ? (
        <Drawer
          title={selected.name}
          eyebrow={kindLabel(selected.name)}
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void open(selected)}>
                <ExternalLink className="size-3.5" />
                Otwórz
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void download(selected)}>
                <Download className="size-3.5" />
                Pobierz
              </Button>
              <Menu label="Więcej akcji">{(close) => fileActions(selected, close)}</Menu>
            </div>
          }
        >
          {previewable(selected.name) ? (
            <div className="mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--bg)]">
              {preview?.id === selected.id ? (
                isImage(selected.name) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt={`Podgląd: ${selected.name}`} className="max-h-72 w-full object-contain" />
                ) : (
                  <iframe src={preview.url} title={`Podgląd: ${selected.name}`} className="h-72 w-full" />
                )
              ) : (
                <div className="flex h-40 items-center justify-center text-[12.5px] text-[var(--text-subtle)]">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Ładuję podgląd…
                </div>
              )}
            </div>
          ) : null}
          <dl className="flex flex-col gap-4 text-[13.5px]">
            <div>
              <dt className="text-[12px] text-[var(--text-subtle)]">Skąd</dt>
              <dd className="mt-0.5 text-white">
                {selected.source === "stage" ? (
                  <>
                    Odpowiedź w etapie {selected.stageTitle}
                    {selected.question ? (
                      <span className="mt-0.5 block text-[13px] text-[var(--text-muted)]">„{selected.question}”</span>
                    ) : null}
                  </>
                ) : (
                  "Dodany tutaj, w Plikach"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--text-subtle)]">Kto dodał</dt>
              <dd className="mt-1 flex items-center gap-2 text-white">
                {selected.uploaderName ? <Avatar name={selected.uploaderName} size="xs" /> : null}
                {selected.uploaderName ?? "Osoba spoza teamu"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--text-subtle)]">Kiedy</dt>
              <dd className="mt-0.5 text-white">{selected.createdAt ? formatMoment(selected.createdAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--text-subtle)]">Rozmiar</dt>
              <dd className="tabular mt-0.5 text-white">{formatSize(selected.size)}</dd>
            </div>
            {selected.source === "stage" ? (
              <p className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Ten plik należy do odpowiedzi w etapie — usuniesz go, zmieniając tę odpowiedź.
              </p>
            ) : null}
          </dl>
        </Drawer>
      ) : null}

      {areaMenu ? (
        <>
          <button
            type="button"
            aria-label="Zamknij menu"
            className="fixed inset-0 z-[54] cursor-default"
            onClick={() => setAreaMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setAreaMenu(null);
            }}
          />
          <div
            role="menu"
            style={{ top: Math.min(areaMenu.y, window.innerHeight - 120), left: Math.min(areaMenu.x, window.innerWidth - 230) }}
            className="fixed z-[55] min-w-[210px] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 lift-3"
          >
            <MenuItem
              icon={FolderPlus}
              disabled={!canCreateFolder}
              hint={
                !foldersAvailable
                  ? "Foldery potrzebują migracji 030."
                  : canCreateFolder
                    ? undefined
                    : "Foldery zakładasz w „Od zespołu”."
              }
              onClick={() => {
                setAreaMenu(null);
                setNaming({ kind: "new-folder" });
              }}
            >
              Nowy folder
            </MenuItem>
            <MenuItem
              icon={Upload}
              onClick={() => {
                setAreaMenu(null);
                inputRef.current?.click();
              }}
            >
              Dodaj plik
            </MenuItem>
          </div>
        </>
      ) : null}

      {context ? (
        <div
          role="menu"
          style={{ top: Math.min(context.y, window.innerHeight - 220), left: Math.min(context.x, window.innerWidth - 230) }}
          onPointerDown={(event) => event.stopPropagation()}
          className="fixed z-[55] min-w-[210px] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-2)] py-1 lift-3"
        >
          {fileActions(context.file, () => setContext(null))}
        </div>
      ) : null}

      {naming ? (
        <NameModal
          title={
            naming.kind === "new-folder"
              ? "Nowy folder"
              : naming.kind === "rename-folder"
                ? "Zmień nazwę folderu"
                : "Zmień nazwę pliku"
          }
          initial={
            naming.kind === "new-folder" ? "" : naming.kind === "rename-folder" ? naming.folder.name : naming.file.name
          }
          pending={busy}
          onClose={() => setNaming(null)}
          onSubmit={submitName}
        />
      ) : null}

      {moving ? (
        <Modal title="Przenieś do…" description={moving.name} onClose={() => setMoving(null)}>
          <ul className="flex flex-col gap-1.5">
            {[{ id: null as string | null, name: "Od zespołu (luzem)", depth: 0 }, ...folderTree(folders)].map((target) => {
              const here = (moving.folderId ?? null) === target.id;
              return (
                <li key={target.id ?? "root"}>
                  <button
                    type="button"
                    disabled={here || busy}
                    onClick={() =>
                      startBusy(async () => {
                        const result = await moveFile(startupId, moving.id, target.id);
                        if (result.error) {
                          toast({ tone: "error", title: "Nie udało się przenieść", description: result.error });
                          return;
                        }
                        toast({ title: "Plik przeniesiony", description: `Do: ${target.name}` });
                        setMoving(null);
                        router.refresh();
                      })
                    }
                    style={{ paddingLeft: 14 + target.depth * 18 }}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[var(--surface)] pr-3.5 text-left text-[14px] text-white transition-colors hover:border-white/20 disabled:opacity-50"
                  >
                    <Folder className="size-4 shrink-0 text-[var(--text-muted)]" />
                    <span className="min-w-0 flex-1 truncate">{target.name}</span>
                    {here ? <span className="text-[12px] text-[var(--text-subtle)]">tu jest teraz</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal>
      ) : null}

      {/* Telefon: „Dodaj plik" przypięty do dołu, w zasięgu kciuka. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent px-4 pb-4 pt-6 sm:hidden">
        <Button block size="lg" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" />
          Dodaj plik
        </Button>
        <p className="mt-1.5 text-center text-[12px] text-[var(--text-subtle)]">Do {MAX_MB} MB na plik</p>
      </div>

      {uploads.length > 0 ? (
        <UploadPanel
          uploads={uploads}
          onRetry={(item) => item.file && void sendOne(item.file, item.id).then((ok) => ok && router.refresh())}
          onClose={() => setUploads((current) => current.filter((item) => item.state === "sending"))}
        />
      ) : null}

      {deleting ? (
        <Modal
          title="Usunąć ten plik?"
          description="Zniknie z biblioteki dla całego zespołu. Dowody celów, które go użyły, zostają — trzymają kopię opisu."
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Zostaw
              </Button>
              <Button variant="danger" loading={deletePending} onClick={() => void remove(deleting)}>
                Usuń plik
              </Button>
            </>
          }
        >
          <p className="text-[14px] text-white">{deleting.name}</p>
        </Modal>
      ) : null}
    </div>
  );
}

function SortHeader({
  label,
  active,
  desc,
  onClick,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 text-left hover:text-white", active && "text-white")}
      aria-label={`Sortuj: ${label}${active ? (desc ? ", malejąco" : ", rosnąco") : ""}`}
    >
      {label}
      {active ? <ArrowDownUp className="size-3" aria-hidden="true" /> : null}
    </button>
  );
}

function EmptyFolder({ text }: { text: string }) {
  return (
    <p className="rounded-[18px] border border-dashed border-white/10 px-5 py-8 text-center text-[13.5px] leading-relaxed text-[var(--text-subtle)]">
      {text}
    </p>
  );
}

/** Okienko wysyłania w prawym dolnym rogu, jak na dysku. */
function UploadPanel({
  uploads,
  onRetry,
  onClose,
}: {
  uploads: Upload[];
  onRetry: (item: Upload) => void;
  onClose: () => void;
}) {
  const sending = uploads.filter((item) => item.state === "sending").length;
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)] lift-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[340px]">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <p className="flex-1 text-[13px] font-medium text-white">
          {sending > 0 ? `Wysyłam ${sending} ${plural(sending, "plik", "pliki", "plików")}…` : "Wysyłanie zakończone"}
        </p>
        {sending === 0 ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--text-subtle)] hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <ul className="max-h-60 overflow-y-auto">
        {uploads.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 px-4 py-2.5">
            {item.state === "sending" ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--text-muted)]" />
            ) : item.state === "done" ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-white">{item.name}</p>
              {item.state === "sending" && typeof item.progress === "number" ? (
                <span className="mt-1.5 flex items-center gap-2" aria-label={`Wysłano ${item.progress}%`}>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full bg-[var(--text-muted)] transition-[width] duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </span>
                  <span className="tabular text-[11.5px] text-[var(--text-subtle)]">{item.progress}%</span>
                </span>
              ) : null}
              {item.message ? (
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--danger-text)]">{item.message}</p>
              ) : null}
            </div>
            {item.state === "error" && item.message && !item.message.startsWith("Za duży") ? (
              <button
                type="button"
                onClick={() => onRetry(item)}
                className="shrink-0 text-[12px] font-medium text-white underline underline-offset-4"
              >
                Ponów
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}
function previewable(name: string) {
  return isImage(name) || /\.pdf$/i.test(name);
}

/** Foldery w kolejności drzewa, z głębokością do wcięcia w „Przenieś do…". */
function folderTree(folders: DriveFolder[]) {
  const out: { id: string | null; name: string; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const folder of folders.filter((item) => (item.parentId ?? null) === parent)) {
      out.push({ id: folder.id, name: folder.name, depth: depth + 1 });
      if (depth < 6) walk(folder.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function NameModal({
  title,
  initial,
  pending,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!value.trim()) {
      setError("Nazwa nie może być pusta.");
      return;
    }
    onSubmit(value.trim());
  };
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={pending} onClick={submit}>
            Zapisz
          </Button>
        </>
      }
    >
      <Field error={error}>
        {({ id, invalid }) => (
          <Input
            id={id}
            aria-invalid={invalid}
            aria-label="Nazwa"
            autoFocus
            value={value}
            maxLength={200}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
          />
        )}
      </Field>
    </Modal>
  );
}
