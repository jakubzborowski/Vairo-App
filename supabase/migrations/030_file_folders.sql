-- =============================================================================
-- 030 — Pliki: własne foldery, zmiana nazwy, przenoszenie
--
-- Odpal PO 029 (zależy tylko od 021, ale numer musi być wyższy niż ostatni
-- odpalony). Idempotentna.
--
-- Redesign Plików (Claude Design, 14a–14f) to układ dysku: „Nowy folder",
-- „Przenieś do…", „Zmień nazwę". W 021 biblioteka była płaską listą i nie
-- miała prawa UPDATE, więc żadna z tych rzeczy nie miała gdzie się zapisać.
--
-- Foldery są tylko porządkiem w bazie — plik w Storage się NIE przenosi
-- (ścieżka `<startup>/library/...` zostaje), więc sprzątanie Storage
-- (`purgeStartupFiles`) nie wymaga żadnej zmiany. Usunięcie folderu nie
-- kasuje plików: wracają do „Od zespołu" (`on delete set null`).
-- =============================================================================

create table if not exists public.startup_file_folders (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  parent_id uuid references public.startup_file_folders (id) on delete cascade,
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint startup_file_folders_name_len check (char_length(trim(name)) between 1 and 80)
);

create index if not exists startup_file_folders_startup_idx
  on public.startup_file_folders (startup_id, parent_id);

alter table public.startup_files
  add column if not exists folder_id uuid references public.startup_file_folders (id) on delete set null;

alter table public.startup_file_folders enable row level security;

drop policy if exists "startup_file_folders_select" on public.startup_file_folders;
create policy "startup_file_folders_select"
  on public.startup_file_folders for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_file_folders_insert" on public.startup_file_folders;
create policy "startup_file_folders_insert"
  on public.startup_file_folders for insert to authenticated
  with check (public.is_startup_member(startup_id) and created_by = auth.uid());

drop policy if exists "startup_file_folders_update" on public.startup_file_folders;
create policy "startup_file_folders_update"
  on public.startup_file_folders for update to authenticated
  using (
    public.is_startup_member(startup_id)
    and (created_by = auth.uid() or public.can_edit_startup(startup_id))
  )
  with check (public.is_startup_member(startup_id));

drop policy if exists "startup_file_folders_delete" on public.startup_file_folders;
create policy "startup_file_folders_delete"
  on public.startup_file_folders for delete to authenticated
  using (
    public.is_startup_member(startup_id)
    and (created_by = auth.uid() or public.can_edit_startup(startup_id))
  );

grant select, insert, update, delete on public.startup_file_folders to authenticated;

-- Zmiana nazwy i przeniesienie pliku: ta sama reguła co usuwanie w 021 —
-- autor albo Founder/Admin.
drop policy if exists "startup_files_update" on public.startup_files;
create policy "startup_files_update"
  on public.startup_files for update to authenticated
  using (
    public.is_startup_member(startup_id)
    and (uploaded_by = auth.uid() or public.can_edit_startup(startup_id))
  )
  with check (public.is_startup_member(startup_id));

grant update (name, folder_id) on public.startup_files to authenticated;

-- Folder musi należeć do tego samego startupu co plik i co folder nadrzędny.
-- Bez tego dałoby się „przenieść" plik do folderu cudzego teamu.
create or replace function public.startup_files_check_folder()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from public.startup_file_folders f
    where f.id = new.folder_id and f.startup_id = new.startup_id
  ) then
    raise exception 'Folder należy do innego startupu.';
  end if;
  return new;
end;
$$;

drop trigger if exists startup_files_check_folder on public.startup_files;
create trigger startup_files_check_folder
  before insert or update of folder_id on public.startup_files
  for each row execute function public.startup_files_check_folder();

create or replace function public.startup_file_folders_check_parent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.startup_file_folders f
    where f.id = new.parent_id and f.startup_id = new.startup_id
  ) then
    raise exception 'Folder nadrzędny należy do innego startupu.';
  end if;
  if new.parent_id = new.id then
    raise exception 'Folder nie może być swoim własnym folderem nadrzędnym.';
  end if;
  return new;
end;
$$;

drop trigger if exists startup_file_folders_check_parent on public.startup_file_folders;
create trigger startup_file_folders_check_parent
  before insert or update of parent_id on public.startup_file_folders
  for each row execute function public.startup_file_folders_check_parent();
