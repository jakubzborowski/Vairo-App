-- ============================================================================
-- 005 · Silnik Stage — katalog treści + instancja startupu
-- ----------------------------------------------------------------------------
-- Katalog (stage_*) jest wspólny i wersjonowany; treść wjeżdża importem z
-- supabase/content/*.json, nigdy ręcznie.
-- Instancja (startup_stages, stage_answers) należy do konkretnego startupu.
--
-- Odpal PO 003. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Katalog treści
-- ---------------------------------------------------------------------------

create table if not exists public.stage_templates (
  id       uuid primary key default gen_random_uuid(),
  key      text not null,                -- 'ambition' | 'idea'
  version  integer not null default 1,
  title    text not null,
  subtitle text,
  intro    text,
  position integer not null,             -- kolejność na pasku etapów
  -- Etykieta przycisku kończącego etap, np. „Sprawdzam mój pomysł"
  finish_label text,
  published_at timestamptz,
  unique (key, version)
);

create table if not exists public.stage_categories (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.stage_templates (id) on delete cascade,
  key   text not null,                   -- general | saas | hardware | b2b | b2c
  title text not null,
  intro text,
  always_active boolean not null default false,
  position integer not null,
  unique (template_id, key)
);

create table if not exists public.stage_points (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.stage_categories (id) on delete cascade,
  key   text not null,
  title text not null,
  description text,
  duration_hint text,                    -- „Około 3 minut"
  guide_body    text,                    -- sekcja z „Przewodnik"
  guide_sources jsonb not null default '[]'::jsonb,
  guide_source_label text,               -- np. „StartupAccel"; puste = bez podpisu
  shared_key text,
  position integer not null,
  unique (category_id, key)
);

create table if not exists public.stage_subpoints (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.stage_points (id) on delete cascade,
  key   text not null,
  title text not null,
  description text,
  is_optional boolean not null default false,
  shared_key  text,
  position integer not null,
  unique (point_id, key)
);

create table if not exists public.stage_fields (
  id uuid primary key default gen_random_uuid(),
  subpoint_id uuid not null references public.stage_subpoints (id) on delete cascade,
  key      text not null,
  kind     text not null,
  question text not null,
  help     text,                         -- „Podpowiedź:"
  example  text,                         -- „Przykład:"
  is_required boolean not null default true,
  shared_key  text,
  config   jsonb not null default '{}'::jsonb,
  position integer not null,
  unique (subpoint_id, key),
  constraint stage_field_kind_valid check (kind in (
    'short_text','long_text','list_short','list_long','scale','select',
    'multi_select','number','date','files','links','checkmark',
    'sentence_template','summary'
  ))
);

-- Klucz logiczny odpowiedzi. Pytania współdzielone między kategoriami
-- (gwiazdka w dokumentach) mają ten sam answer_key, więc wypełnienie
-- w SaaS jest TĄ SAMĄ odpowiedzią co w B2B — nie kopią.
alter table public.stage_fields
  add column if not exists answer_key text
  generated always as (coalesce(shared_key, id::text)) stored;

create index if not exists stage_fields_answer_key_idx on public.stage_fields (answer_key);
create index if not exists stage_fields_subpoint_idx  on public.stage_fields (subpoint_id);

-- ---------------------------------------------------------------------------
-- 2. Instancja startupu
-- ---------------------------------------------------------------------------

create table if not exists public.startup_stages (
  id uuid primary key default gen_random_uuid(),
  startup_id  uuid not null references public.startups (id) on delete cascade,
  template_id uuid not null references public.stage_templates (id),
  status      text not null default 'in_progress',
  -- ostatnio otwarty podpunkt: wejście w /app prowadzi prosto tam
  last_subpoint_id uuid references public.stage_subpoints (id) on delete set null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (startup_id, template_id),
  constraint startup_stage_status_valid check (status in ('in_progress', 'completed'))
);

create index if not exists startup_stages_startup_idx on public.startup_stages (startup_id);

create table if not exists public.stage_answers (
  id uuid primary key default gen_random_uuid(),
  startup_stage_id uuid not null references public.startup_stages (id) on delete cascade,
  answer_key text not null,
  value      jsonb,
  answered_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (startup_stage_id, answer_key)
);

drop trigger if exists stage_answers_set_updated_at on public.stage_answers;
create trigger stage_answers_set_updated_at
  before update on public.stage_answers
  for each row execute function public.set_updated_at();

create table if not exists public.stage_subpoint_progress (
  startup_stage_id uuid not null references public.startup_stages (id) on delete cascade,
  subpoint_id  uuid not null references public.stage_subpoints (id) on delete cascade,
  is_complete  boolean not null default false,
  completed_at timestamptz,
  primary key (startup_stage_id, subpoint_id)
);

create index if not exists stage_subpoint_progress_stage_idx
  on public.stage_subpoint_progress (startup_stage_id) where is_complete;

-- ---------------------------------------------------------------------------
-- 3. Kaskada postępu
-- ---------------------------------------------------------------------------
-- Jeden answer_key może należeć do kilku podpunktów naraz (pytania wspólne
-- między kategoriami), dlatego przeliczamy wszystkie, których dotyczy zmiana.
-- Podpunkt bez wymaganych pól wychodzi jako ukończony — opcjonalne nie blokują.

create or replace function public.recalc_subpoint_progress()
returns trigger
language plpgsql
as $$
declare
  v_stage uuid := coalesce(new.startup_stage_id, old.startup_stage_id);
  v_key   text := coalesce(new.answer_key, old.answer_key);
  r       record;
  v_missing integer;
begin
  for r in
    select distinct f.subpoint_id
    from public.stage_fields f
    where f.answer_key = v_key
  loop
    select count(*) into v_missing
    from public.stage_fields f
    left join public.stage_answers a
      on a.answer_key = f.answer_key and a.startup_stage_id = v_stage
    where f.subpoint_id = r.subpoint_id
      and f.is_required
      and (
        a.value is null
        or a.value = 'null'::jsonb
        or a.value = '""'::jsonb
        or a.value = '[]'::jsonb
        or a.value = 'false'::jsonb
      );

    insert into public.stage_subpoint_progress
      (startup_stage_id, subpoint_id, is_complete, completed_at)
    values (v_stage, r.subpoint_id, v_missing = 0,
            case when v_missing = 0 then now() end)
    on conflict (startup_stage_id, subpoint_id) do update
    set is_complete  = excluded.is_complete,
        -- cofnięcie odpowiedzi cofa też status: kaskada działa w obie strony
        completed_at = case
          when excluded.is_complete
          then coalesce(public.stage_subpoint_progress.completed_at, now())
          else null
        end;
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists stage_answers_recalc on public.stage_answers;
create trigger stage_answers_recalc
  after insert or update or delete on public.stage_answers
  for each row execute function public.recalc_subpoint_progress();

-- ---------------------------------------------------------------------------
-- 4. Widok postępu punktów
-- ---------------------------------------------------------------------------
-- Postęp punktu i kategorii zawsze wynika z podpunktów, więc nie trzymamy
-- go osobno. Opcjonalne podpunkty nie wliczają się do licznika.

create or replace view public.stage_point_progress
with (security_invoker = true) as
select
  ss.id            as startup_stage_id,
  p.id             as point_id,
  p.category_id,
  count(*)                                           as total,
  count(*) filter (where coalesce(pr.is_complete, false)) as done,
  bool_and(coalesce(pr.is_complete, false))          as is_complete
from public.startup_stages ss
join public.stage_categories c on c.template_id = ss.template_id
join public.stage_points p     on p.category_id = c.id
join public.stage_subpoints s  on s.point_id = p.id and s.is_optional = false
left join public.stage_subpoint_progress pr
  on pr.startup_stage_id = ss.id and pr.subpoint_id = s.id
group by ss.id, p.id, p.category_id;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
-- Katalog: każdy zalogowany czyta, nikt nie pisze (import idzie przez SQL).

alter table public.stage_templates  enable row level security;
alter table public.stage_categories enable row level security;
alter table public.stage_points     enable row level security;
alter table public.stage_subpoints  enable row level security;
alter table public.stage_fields     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['stage_templates','stage_categories','stage_points',
                           'stage_subpoints','stage_fields']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_read', t);
  end loop;
end;
$$;

-- Instancja: wzorzec workspace'u.

alter table public.startup_stages          enable row level security;
alter table public.stage_answers           enable row level security;
alter table public.stage_subpoint_progress enable row level security;

drop policy if exists "startup_stages_rw" on public.startup_stages;
create policy "startup_stages_rw"
  on public.startup_stages for all to authenticated
  using (public.is_startup_member(startup_id))
  with check (public.is_startup_member(startup_id));

-- Odpowiedzi nie mają startup_id wprost — idą przez startup_stages.
create or replace function public.can_access_stage(p_startup_stage_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.startup_stages ss
    join public.startup_members m on m.startup_id = ss.startup_id
    where ss.id = p_startup_stage_id and m.profile_id = auth.uid()
  );
$$;

revoke all on function public.can_access_stage(uuid) from public;
grant execute on function public.can_access_stage(uuid) to authenticated;

drop policy if exists "stage_answers_rw" on public.stage_answers;
create policy "stage_answers_rw"
  on public.stage_answers for all to authenticated
  using (public.can_access_stage(startup_stage_id))
  with check (public.can_access_stage(startup_stage_id));

drop policy if exists "stage_progress_read" on public.stage_subpoint_progress;
create policy "stage_progress_read"
  on public.stage_subpoint_progress for select to authenticated
  using (public.can_access_stage(startup_stage_id));

-- Zapisuje wyłącznie trigger (security definer nie jest potrzebny — trigger
-- działa w kontekście właściciela funkcji), ale polityka musi istnieć,
-- żeby RLS nie odrzuciło zapisu.
drop policy if exists "stage_progress_write" on public.stage_subpoint_progress;
create policy "stage_progress_write"
  on public.stage_subpoint_progress for all to authenticated
  using (public.can_access_stage(startup_stage_id))
  with check (public.can_access_stage(startup_stage_id));

-- ---------------------------------------------------------------------------
-- 5b. Storage: pliki dołączane jako dowód w podpunktach
-- ---------------------------------------------------------------------------
-- Ścieżka: <startup_stage_id>/<answer_key>/<nazwa>. Prywatny bucket —
-- dostęp wyłącznie przez podpisane URL-e generowane po stronie serwera.

insert into storage.buckets (id, name, public, file_size_limit)
values ('stage-files', 'stage-files', false, 20971520)
on conflict (id) do update
set public = false, file_size_limit = 20971520;

drop policy if exists "stage_files_read" on storage.objects;
create policy "stage_files_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stage-files'
    and public.can_access_stage(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "stage_files_write" on storage.objects;
create policy "stage_files_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stage-files'
    and public.can_access_stage(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "stage_files_delete" on storage.objects;
create policy "stage_files_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stage-files'
    and public.can_access_stage(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 6. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
   where table_schema = 'public' and table_name like 'stage%') as tabel_stage,
  (select count(*) from information_schema.tables
   where table_schema = 'public' and table_name = 'startup_stages') as startup_stages;
