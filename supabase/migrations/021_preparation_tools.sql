-- ============================================================================
-- 021 · Narzędzia Preparation
-- ----------------------------------------------------------------------------
-- Bloczki (kilka pól w powtarzanej pozycji), pomijanie podpunktu po odpowiedzi,
-- przycisk do Plików albo Social, wybór prawdziwych profili oraz biblioteka
-- plików startupu.
--
-- Odpal PO 020. Idempotentne. Treść etapu (022) wymaga tej migracji.
-- ============================================================================

alter table public.stage_subpoints
  add column if not exists skip_when jsonb;

alter table public.stage_fields drop constraint if exists stage_field_kind_valid;
alter table public.stage_fields
  add constraint stage_field_kind_valid check (kind in (
    'short_text','long_text','list_short','list_long','scale','select',
    'multi_select','number','date','files','links','checkmark',
    'sentence_template','summary','records','action','people'
  ));

-- ---------------------------------------------------------------------------
-- Kaskada: pominięty podpunkt jest ukończony i nie blokuje etapu
-- ---------------------------------------------------------------------------

create or replace function public.recalc_subpoint_progress()
returns trigger
language plpgsql
as $$
declare
  v_stage uuid := coalesce(new.startup_stage_id, old.startup_stage_id);
  v_key   text := coalesce(new.answer_key, old.answer_key);
  r       record;
  v_missing integer;
  v_value jsonb;
  v_skip boolean;
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
      and not (
        coalesce(f.config->>'empty_ok', 'false') = 'true'
        and a.value is not null
        and jsonb_typeof(a.value) in ('object', 'array')
      )
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
        completed_at = case
          when excluded.is_complete
          then coalesce(public.stage_subpoint_progress.completed_at, now())
          else null
        end;
  end loop;

  for r in
    select s.id as subpoint_id, s.skip_when
    from public.stage_subpoints s
    join public.stage_points p on p.id = s.point_id
    join public.stage_categories c on c.id = p.category_id
    join public.startup_stages ss
      on ss.template_id = c.template_id and ss.id = v_stage
    where s.skip_when is not null
  loop
    select a.value into v_value
    from public.stage_answers a
    where a.startup_stage_id = v_stage
      and a.answer_key = r.skip_when->>'answer_key';

    v_skip := false;
    if r.skip_when ? 'one_of' then
      v_skip := (v_value #>> '{}') = any (
        select jsonb_array_elements_text(r.skip_when->'one_of')
      );
    elsif r.skip_when ? 'equals' then
      v_skip := v_value = (r.skip_when->'equals');
    end if;

    if v_skip then
      insert into public.stage_subpoint_progress
        (startup_stage_id, subpoint_id, is_complete, completed_at)
      values (v_stage, r.subpoint_id, true, now())
      on conflict (startup_stage_id, subpoint_id) do update
      set is_complete = true,
          completed_at = coalesce(public.stage_subpoint_progress.completed_at, now());
    else
      select count(*) into v_missing
      from public.stage_fields f
      left join public.stage_answers a
        on a.answer_key = f.answer_key and a.startup_stage_id = v_stage
      where f.subpoint_id = r.subpoint_id
        and f.is_required
        and not (
          coalesce(f.config->>'empty_ok', 'false') = 'true'
          and a.value is not null
          and jsonb_typeof(a.value) in ('object', 'array')
        )
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
      set is_complete = excluded.is_complete,
          completed_at = case
            when excluded.is_complete
            then coalesce(public.stage_subpoint_progress.completed_at, now())
            else null
          end;
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- Biblioteka plików startupu
-- ---------------------------------------------------------------------------
-- Pliki dowodu w podpunkcie dalej leżą pod <startup_stage_id>/…
-- Biblioteka projektu leży pod <startup_id>/library/… w tym samym buckecie.

create table if not exists public.startup_files (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  storage_path text not null,
  name text not null,
  size_bytes bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (startup_id, storage_path)
);

create index if not exists startup_files_startup_idx
  on public.startup_files (startup_id, created_at desc);

alter table public.startup_files enable row level security;

drop policy if exists "startup_files_select" on public.startup_files;
create policy "startup_files_select"
  on public.startup_files for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_files_insert" on public.startup_files;
create policy "startup_files_insert"
  on public.startup_files for insert to authenticated
  with check (public.is_startup_member(startup_id));

drop policy if exists "startup_files_delete" on public.startup_files;
create policy "startup_files_delete"
  on public.startup_files for delete to authenticated
  using (
    public.is_startup_member(startup_id)
    and (uploaded_by = auth.uid() or public.can_edit_startup(startup_id))
  );

grant select, insert, delete on public.startup_files to authenticated;

drop policy if exists "startup_library_read" on storage.objects;
create policy "startup_library_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stage-files'
    and coalesce((storage.foldername(name))[2], '') = 'library'
    and public.is_startup_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "startup_library_write" on storage.objects;
create policy "startup_library_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stage-files'
    and coalesce((storage.foldername(name))[2], '') = 'library'
    and public.is_startup_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "startup_library_delete" on storage.objects;
create policy "startup_library_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stage-files'
    and coalesce((storage.foldername(name))[2], '') = 'library'
    and public.is_startup_member(((storage.foldername(name))[1])::uuid)
  );
