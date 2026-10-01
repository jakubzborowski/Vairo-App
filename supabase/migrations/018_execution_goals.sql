-- ============================================================================
-- 018 · Execution: Goals, taski, proof, warunki Milestones, Rozpiska
-- ----------------------------------------------------------------------------
-- Milestones zostają treścią Vairo (stage_*). Goals są celami użytkownika.
-- Subpoint zalicza Goal dopiero, gdy jest jawnie podpięty, ma właściwy typ,
-- status Ukończony i snapshot proof. Dodatkowe cele nie wchodzą do mianownika
-- postępu etapu — liczy się tylko warunek (goal_type_id + min_count).
--
-- Zamknięty etap nie jest przeliczany ponownie. Ponowne otwarcie wraca do
-- aktualnych danych, a snapshot zamknięcia zostaje w stage_closures.
--
-- Odpal PO 017. Idempotentne.
-- ============================================================================

alter table public.startups
  add column if not exists execution_unlocked_at timestamptz;

-- ---------------------------------------------------------------------------
-- Słownik typów. Identyfikatory są stałe — treść programu wskazuje je po id.
-- „Własny cel" nie spełnia warunku innego typu.
-- ---------------------------------------------------------------------------

create table if not exists public.goal_types (
  id text primary key,
  label text not null,
  description text,
  position integer not null
);

insert into public.goal_types (id, label, description, position) values
  ('custom', 'Własny cel', 'Organizacja pracy. Nie zalicza warunku programu, dopóki ten nie wymaga właśnie tego typu.', 1),
  ('product_test', 'Test produktu', 'Sprawdzenie, czy ktoś użył wersji i co z tego wynikło.', 2),
  ('build_result', 'Wynik budowy', 'Konkretna rzecz, która powstała w trakcie budowy.', 3),
  ('prototype', 'Prototyp', 'Pierwsza wersja, którą da się pokazać.', 4),
  ('customer', 'Pierwszy klient', 'Ktoś, kto naprawdę skorzystał albo zapłacił.', 5),
  ('research', 'Rozmowa z użytkownikiem', 'Zapis tego, czego dowiedzieliście się od ludzi.', 6)
on conflict (id) do update
set label = excluded.label,
    description = excluded.description,
    position = excluded.position;

-- ---------------------------------------------------------------------------
-- Goals i taski
-- ---------------------------------------------------------------------------

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  title text not null,
  description text,
  goal_type_id text not null references public.goal_types (id),
  owner_id uuid references public.profiles (id) on delete set null,
  due_date date not null,
  status text not null default 'todo',
  proof_requirement jsonb not null,
  proof_snapshot jsonb,
  note text,
  blocker_note text,
  needs_reassign boolean not null default false,
  archived_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  created_for_condition_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_status_valid check (
    status in ('todo', 'in_progress', 'blocked', 'awaiting_proof', 'completed')
  ),
  constraint goals_title_len check (char_length(trim(title)) between 1 and 180)
);

create index if not exists goals_startup_idx
  on public.goals (startup_id, status)
  where archived_at is null;

create unique index if not exists goals_origin_condition_idx
  on public.goals (created_for_condition_id)
  where created_for_condition_id is not null and archived_at is null;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null,
  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'todo',
  due_date date,
  needs_reassign boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_valid check (
    status in ('todo', 'in_progress', 'blocked', 'done')
  ),
  constraint tasks_title_len check (char_length(trim(title)) between 1 and 180)
);

create index if not exists tasks_goal_idx on public.tasks (goal_id);
create index if not exists tasks_owner_idx on public.tasks (startup_id, owner_id);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table if not exists public.goal_materials (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  kind text not null,
  file_id uuid references public.startup_files (id) on delete set null,
  file_path text,
  file_name text,
  url text,
  body text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint goal_materials_kind_valid check (kind in ('file', 'link', 'note'))
);

create index if not exists goal_materials_goal_idx on public.goal_materials (goal_id);

create table if not exists public.goal_events (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists goal_events_goal_idx
  on public.goal_events (goal_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Warunki programu (szablon) i ich kopia na otwarty etap (snapshot)
-- ---------------------------------------------------------------------------

create table if not exists public.stage_goal_conditions (
  id uuid primary key default gen_random_uuid(),
  subpoint_id uuid not null references public.stage_subpoints (id) on delete cascade,
  goal_type_id text not null references public.goal_types (id),
  min_count integer not null,
  proof_kind text,
  position integer not null default 1,
  unique (subpoint_id, goal_type_id),
  constraint stage_goal_conditions_min check (min_count >= 1)
);

create table if not exists public.startup_goal_conditions (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  startup_stage_id uuid not null references public.startup_stages (id) on delete cascade,
  subpoint_id uuid not null references public.stage_subpoints (id) on delete cascade,
  goal_type_id text not null references public.goal_types (id),
  min_count integer not null,
  proof_kind text,
  template_condition_id uuid references public.stage_goal_conditions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (startup_stage_id, subpoint_id, goal_type_id),
  constraint startup_goal_conditions_min check (min_count >= 1)
);

create index if not exists startup_goal_conditions_stage_idx
  on public.startup_goal_conditions (startup_stage_id, subpoint_id);

-- Dodane po utworzeniu tabeli warunków, żeby klucz obcy miał do czego wskazać.
alter table public.goals
  drop constraint if exists goals_created_for_condition_fkey;
alter table public.goals
  add constraint goals_created_for_condition_fkey
  foreign key (created_for_condition_id)
  references public.startup_goal_conditions (id) on delete set null;

create table if not exists public.goal_condition_links (
  condition_id uuid not null references public.startup_goal_conditions (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (condition_id, goal_id)
);

create index if not exists goal_condition_links_goal_idx
  on public.goal_condition_links (goal_id);

-- ---------------------------------------------------------------------------
-- Rozpiska: rysunek, nie silnik statusów
-- ---------------------------------------------------------------------------

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  title text not null,
  goal_id uuid references public.goals (id) on delete set null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflows_title_len check (char_length(trim(title)) between 1 and 140)
);

create index if not exists workflows_startup_idx on public.workflows (startup_id);

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

create table if not exists public.workflow_versions (
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  version integer not null,
  title text not null,
  nodes jsonb not null,
  edges jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workflow_id, version)
);

-- ---------------------------------------------------------------------------
-- Proof: format, nie ocena jakości
-- ---------------------------------------------------------------------------

create or replace function public.proof_matches(requirement jsonb, snapshot jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  kind text;
  n int;
begin
  if requirement is null or snapshot is null or jsonb_typeof(snapshot) <> 'object' then
    return false;
  end if;

  kind := requirement->>'kind';
  if snapshot->>'kind' is distinct from kind then
    return false;
  end if;

  case kind
    when 'sentence' then
      return char_length(trim(coalesce(snapshot->>'text', ''))) between 1 and 240
        and position(E'\n' in coalesce(snapshot->>'text', '')) = 0;
    when 'long_text' then
      return char_length(trim(coalesce(snapshot->>'text', ''))) between 1 and 8000;
    when 'select' then
      return coalesce(snapshot->>'option', '') <> ''
        and (
          jsonb_typeof(requirement->'options') is distinct from 'array'
          or exists (
            select 1
            from jsonb_array_elements(requirement->'options') opt
            where opt->>'value' = snapshot->>'option'
          )
        );
    when 'scale' then
      return coalesce(snapshot->>'scale', '') ~ '^[0-9]+$'
        and (snapshot->>'scale')::int >= coalesce((requirement->>'min')::int, 1)
        and (snapshot->>'scale')::int <= coalesce((requirement->>'max')::int, 5);
    when 'link' then
      return coalesce(snapshot->>'url', '') ~* '^https?://\S+$'
        and char_length(trim(coalesce(snapshot->>'note', ''))) between 1 and 500;
    when 'file' then
      return coalesce(snapshot#>>'{file,path}', '') <> ''
        and coalesce(snapshot#>>'{file,name}', '') <> '';
    when 'module_result' then
      return coalesce(snapshot->>'module', '') <> ''
        and (
          (
            coalesce(snapshot->>'workflow_id', '') ~* '^[0-9a-f-]{36}$'
            and coalesce(snapshot->>'version', '') ~ '^[0-9]+$'
          )
          or coalesce(snapshot->>'ref_id', '') <> ''
        );
    when 'goal_set' then
      if jsonb_typeof(snapshot->'goal_ids') is distinct from 'array' then
        return false;
      end if;
      select count(distinct value) into n
      from jsonb_array_elements_text(snapshot->'goal_ids') as t(value);
      return n >= greatest(coalesce((requirement->>'min_count')::int, 1), 1)
        and n = jsonb_array_length(snapshot->'goal_ids');
    else
      return false;
  end case;
end;
$$;

create or replace function public.goal_file_belongs(p_startup_id uuid, p_snapshot jsonb)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_snapshot#>>'{file,path}', '') <> ''
    and (
      exists (
        select 1 from public.startup_files f
        where f.startup_id = p_startup_id
          and f.storage_path = p_snapshot#>>'{file,path}'
      )
      or split_part(p_snapshot#>>'{file,path}', '/', 1) = p_startup_id::text
      or exists (
        select 1 from public.startup_stages ss
        where ss.startup_id = p_startup_id
          and ss.id::text = split_part(p_snapshot#>>'{file,path}', '/', 1)
      )
    );
$$;

-- Licznik warunku: różne goal_id, ten sam startup, właściwy typ, Completed,
-- niearchiwalne, proof zgodny z wymaganiem celu i (gdy podane) z warunkiem.
create or replace function public.subpoint_goals_met(p_stage uuid, p_subpoint uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(bool_and(done >= min_count), true)
  from (
    select
      gc.min_count,
      (
        select count(distinct g.id)::int
        from public.goal_condition_links l
        join public.goals g on g.id = l.goal_id
        where l.condition_id = gc.id
          and g.startup_id = gc.startup_id
          and g.goal_type_id = gc.goal_type_id
          and g.status = 'completed'
          and g.archived_at is null
          and public.proof_matches(g.proof_requirement, g.proof_snapshot)
          and (
            gc.proof_kind is null
            or g.proof_snapshot->>'kind' = gc.proof_kind
          )
      ) as done
    from public.startup_goal_conditions gc
    where gc.startup_stage_id = p_stage
      and gc.subpoint_id = p_subpoint
  ) s;
$$;

-- Jedno miejsce, które ustawia postęp podpunktu: pola + pominięcie + Goals.
-- Zamknięty etap zostawiamy w spokoju — jego dowody są w snapshotcie.
create or replace function public.refresh_one_subpoint(p_stage uuid, p_subpoint uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_startup uuid;
  v_status text;
  v_missing integer;
  v_value jsonb;
  v_skip_when jsonb;
  v_skip boolean := false;
  v_complete boolean;
begin
  select startup_id, status into v_startup, v_status
  from public.startup_stages
  where id = p_stage;

  if v_startup is null or v_status = 'completed' then
    return;
  end if;

  if not exists (select 1 from public.startups where id = v_startup) then
    return;
  end if;

  if auth.uid() is not null and not public.is_startup_member(v_startup) then
    return;
  end if;

  select skip_when into v_skip_when
  from public.stage_subpoints
  where id = p_subpoint;

  if v_skip_when is not null then
    select a.value into v_value
    from public.stage_answers a
    where a.startup_stage_id = p_stage
      and a.answer_key = v_skip_when->>'answer_key';

    if v_skip_when ? 'one_of' then
      v_skip := (v_value #>> '{}') = any (
        select jsonb_array_elements_text(v_skip_when->'one_of')
      );
    elsif v_skip_when ? 'equals' then
      v_skip := v_value = (v_skip_when->'equals');
    end if;
  end if;

  if v_skip then
    v_complete := true;
  else
    select count(*) into v_missing
    from public.stage_fields f
    left join public.stage_answers a
      on a.answer_key = f.answer_key and a.startup_stage_id = p_stage
    where f.subpoint_id = p_subpoint
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

    v_complete := v_missing = 0 and public.subpoint_goals_met(p_stage, p_subpoint);
  end if;

  insert into public.stage_subpoint_progress
    (startup_stage_id, subpoint_id, is_complete, completed_at)
  values (
    p_stage,
    p_subpoint,
    v_complete,
    case when v_complete then now() end
  )
  on conflict (startup_stage_id, subpoint_id) do update
  set is_complete = excluded.is_complete,
      completed_at = case
        when excluded.is_complete
        then coalesce(public.stage_subpoint_progress.completed_at, now())
        else null
      end;
end;
$$;

-- Odpowiedź w etapie przelicza pola i warunki Goals naraz.
create or replace function public.recalc_subpoint_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage uuid := coalesce(new.startup_stage_id, old.startup_stage_id);
  v_key text := coalesce(new.answer_key, old.answer_key);
  r record;
begin
  if not exists (select 1 from public.startup_stages where id = v_stage) then
    return coalesce(new, old);
  end if;

  for r in
    select distinct f.subpoint_id
    from public.stage_fields f
    where f.answer_key = v_key
  loop
    perform public.refresh_one_subpoint(v_stage, r.subpoint_id);
  end loop;

  for r in
    select s.id as subpoint_id
    from public.stage_subpoints s
    join public.stage_points p on p.id = s.point_id
    join public.stage_categories c on c.id = p.category_id
    join public.startup_stages ss
      on ss.template_id = c.template_id and ss.id = v_stage
    where s.skip_when is not null
  loop
    perform public.refresh_one_subpoint(v_stage, r.subpoint_id);
  end loop;

  return coalesce(new, old);
end;
$$;

-- Ponowne otwarcie etapu wraca do żywych danych. Poprzedni snapshot zostaje.
create or replace function public.refresh_stage_on_reopen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if old.status is distinct from 'completed' or new.status is distinct from 'in_progress' then
    return new;
  end if;

  if not exists (select 1 from public.startups where id = new.startup_id) then
    return new;
  end if;

  for r in
    select s.id
    from public.stage_subpoints s
    join public.stage_points p on p.id = s.point_id
    join public.stage_categories c on c.id = p.category_id
    where c.template_id = new.template_id
  loop
    perform public.refresh_one_subpoint(new.id, r.id);
  end loop;

  return new;
end;
$$;

drop trigger if exists startup_stages_refresh_on_reopen on public.startup_stages;
create trigger startup_stages_refresh_on_reopen
  after update of status on public.startup_stages
  for each row execute function public.refresh_stage_on_reopen();

-- ---------------------------------------------------------------------------
-- Strażnicy Goals
-- ---------------------------------------------------------------------------

create or replace function public.goals_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid text;
begin
  if not exists (select 1 from public.startups where id = new.startup_id) then
    return new;
  end if;

  if new.owner_id is not null and not exists (
    select 1 from public.startup_members
    where startup_id = new.startup_id and profile_id = new.owner_id
  ) then
    raise exception 'goal_owner_not_in_team';
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'completed' and new.status = 'completed' then
      if new.title is distinct from old.title
         or new.description is distinct from old.description
         or new.goal_type_id is distinct from old.goal_type_id
         or new.proof_requirement is distinct from old.proof_requirement
         or new.proof_snapshot is distinct from old.proof_snapshot
      then
        raise exception 'goal_locked_reopen_first';
      end if;
    end if;

    if new.owner_id is null and old.owner_id is not null then
      new.needs_reassign := true;
    elsif new.owner_id is distinct from old.owner_id then
      new.needs_reassign := false;
    end if;

    if old.status = 'completed' and new.status is distinct from 'completed' then
      new.completed_at := null;
      new.completed_by := null;
    end if;
  end if;

  if new.status = 'blocked' and char_length(trim(coalesce(new.blocker_note, ''))) = 0 then
    raise exception 'goal_blocker_needs_note';
  end if;

  if new.status = 'completed' then
    if new.archived_at is not null then
      raise exception 'goal_archived';
    end if;
    if not public.proof_matches(new.proof_requirement, new.proof_snapshot) then
      raise exception 'goal_proof_required';
    end if;

    if new.proof_snapshot->>'kind' = 'file'
       and not public.goal_file_belongs(new.startup_id, new.proof_snapshot) then
      raise exception 'goal_proof_file_foreign';
    end if;

    if new.proof_snapshot->>'kind' = 'module_result'
       and coalesce(new.proof_snapshot->>'workflow_id', '') ~* '^[0-9a-f-]{36}$' then
      if not exists (
        select 1
        from public.workflow_versions wv
        join public.workflows w on w.id = wv.workflow_id
        where w.startup_id = new.startup_id
          and wv.workflow_id = (new.proof_snapshot->>'workflow_id')::uuid
          and wv.version = (new.proof_snapshot->>'version')::int
      ) then
        raise exception 'goal_proof_workflow_missing';
      end if;
    end if;

    if new.proof_requirement->>'kind' = 'goal_set' then
      for gid in
        select value from jsonb_array_elements_text(new.proof_snapshot->'goal_ids')
      loop
        if gid !~* '^[0-9a-f-]{36}$' or not exists (
          select 1 from public.goals g
          where g.id = gid::uuid
            and g.startup_id = new.startup_id
            and g.id <> new.id
            and g.status = 'completed'
            and g.archived_at is null
            and public.proof_matches(g.proof_requirement, g.proof_snapshot)
        ) then
          raise exception 'goal_proof_required';
        end if;
      end loop;
    end if;

    if new.completed_at is null then
      new.completed_at := now();
    end if;
    if new.completed_by is null then
      new.completed_by := auth.uid();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists goals_before_write on public.goals;
create trigger goals_before_write
  before insert or update on public.goals
  for each row execute function public.goals_before_write();

create or replace function public.goals_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_startup uuid := coalesce(new.startup_id, old.startup_id);
begin
  if not exists (select 1 from public.startups where id = v_startup) then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE'
     and new.needs_reassign is distinct from old.needs_reassign
     and new.status is not distinct from old.status
     and new.owner_id is not distinct from old.owner_id
     and new.due_date is not distinct from old.due_date
     and new.proof_snapshot is not distinct from old.proof_snapshot
     and new.archived_at is not distinct from old.archived_at
     and new.title is not distinct from old.title
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
    values (
      new.startup_id, new.id, auth.uid(), 'created',
      jsonb_build_object('title', new.title, 'status', new.status)
    );
    perform public.push_notification(
      new.owner_id, 'goal_assigned', '/app/goals?goal=' || new.id,
      auth.uid(), new.startup_id, new.title, true
    );
  else
    if old.status = 'completed' and new.status is distinct from 'completed' then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (new.startup_id, new.id, auth.uid(), 'reopened', jsonb_build_object('status', new.status));
    elsif new.status is distinct from old.status then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (
        new.startup_id, new.id, auth.uid(), 'status',
        jsonb_build_object('from', old.status, 'to', new.status)
      );
    end if;

    if new.owner_id is distinct from old.owner_id then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (
        new.startup_id, new.id, auth.uid(), 'owner',
        jsonb_build_object('owner_id', new.owner_id)
      );
      perform public.push_notification(
        new.owner_id, 'goal_assigned', '/app/goals?goal=' || new.id,
        auth.uid(), new.startup_id, new.title, true
      );
    end if;

    if new.due_date is distinct from old.due_date then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (
        new.startup_id, new.id, auth.uid(), 'deadline',
        jsonb_build_object('due_date', new.due_date)
      );
    end if;

    if new.proof_snapshot is distinct from old.proof_snapshot then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (
        new.startup_id, new.id, auth.uid(), 'proof',
        jsonb_build_object('kind', new.proof_snapshot->>'kind')
      );
    end if;

    if new.archived_at is not null and old.archived_at is null then
      insert into public.goal_events (startup_id, goal_id, actor_id, kind, payload)
      values (new.startup_id, new.id, auth.uid(), 'archived', '{}'::jsonb);
    end if;

    if new.status = 'blocked' and old.status is distinct from 'blocked' then
      for r in
        select profile_id from public.startup_members
        where startup_id = new.startup_id and role in ('founder', 'admin')
      loop
        perform public.push_notification(
          r.profile_id, 'goal_blocked', '/app/goals?goal=' || new.id,
          auth.uid(), new.startup_id, left(coalesce(new.blocker_note, new.title), 140), true
        );
      end loop;
    end if;
  end if;

  for r in
    select gc.startup_stage_id, gc.subpoint_id
    from public.goal_condition_links l
    join public.startup_goal_conditions gc on gc.id = l.condition_id
    where l.goal_id = coalesce(new.id, old.id)
  loop
    perform public.refresh_one_subpoint(r.startup_stage_id, r.subpoint_id);
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists goals_after_write on public.goals;
create trigger goals_after_write
  after insert or update on public.goals
  for each row execute function public.goals_after_write();

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal_startup uuid;
begin
  select startup_id into v_goal_startup from public.goals where id = new.goal_id;
  if v_goal_startup is null then
    if not exists (select 1 from public.startups where id = new.startup_id) then
      return new;
    end if;
    raise exception 'task_goal_missing';
  end if;

  if v_goal_startup is distinct from new.startup_id then
    raise exception 'goal_startup_mismatch';
  end if;

  if new.owner_id is not null and not exists (
    select 1 from public.startup_members
    where startup_id = new.startup_id and profile_id = new.owner_id
  ) then
    raise exception 'goal_owner_not_in_team';
  end if;

  if tg_op = 'UPDATE' then
    if new.owner_id is null and old.owner_id is not null then
      new.needs_reassign := true;
    elsif new.owner_id is distinct from old.owner_id then
      new.needs_reassign := false;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

create or replace function public.tasks_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is not distinct from old.owner_id then
      return new;
    end if;
  end if;

  perform public.push_notification(
    new.owner_id, 'task_assigned', '/app/tasks?task=' || new.id,
    auth.uid(), new.startup_id, new.title, true
  );
  return new;
end;
$$;

drop trigger if exists tasks_after_write on public.tasks;
create trigger tasks_after_write
  after insert or update of owner_id on public.tasks
  for each row execute function public.tasks_after_write();

create or replace function public.goal_link_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal_startup uuid;
  v_goal_type text;
  v_cond_startup uuid;
  v_cond_type text;
begin
  select startup_id, goal_type_id into v_goal_startup, v_goal_type
  from public.goals where id = new.goal_id;

  select startup_id, goal_type_id into v_cond_startup, v_cond_type
  from public.startup_goal_conditions where id = new.condition_id;

  if v_goal_startup is null or v_cond_startup is null then
    raise exception 'goal_link_missing';
  end if;
  if v_goal_startup is distinct from v_cond_startup then
    raise exception 'goal_startup_mismatch';
  end if;
  if v_goal_type is distinct from v_cond_type then
    raise exception 'goal_type_mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists goal_link_guard on public.goal_condition_links;
create trigger goal_link_guard
  before insert on public.goal_condition_links
  for each row execute function public.goal_link_guard();

create or replace function public.goal_link_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_condition uuid := coalesce(new.condition_id, old.condition_id);
  v_stage uuid;
  v_subpoint uuid;
  v_startup uuid;
begin
  select startup_stage_id, subpoint_id, startup_id
    into v_stage, v_subpoint, v_startup
  from public.startup_goal_conditions
  where id = v_condition;

  if v_stage is null then
    return coalesce(new, old);
  end if;
  if not exists (select 1 from public.startups where id = v_startup) then
    return coalesce(new, old);
  end if;

  perform public.refresh_one_subpoint(v_stage, v_subpoint);
  return coalesce(new, old);
end;
$$;

drop trigger if exists goal_link_refresh on public.goal_condition_links;
create trigger goal_link_refresh
  after insert or delete on public.goal_condition_links
  for each row execute function public.goal_link_refresh();

-- Odejście z teamu nie kasuje historii. Otwarte przypisania widać jako
-- „trzeba wskazać kogoś innego". Kaskada usuwania startupu jest przepuszczana.
create or replace function public.mark_open_work_on_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.startups where id = old.startup_id) then
    return old;
  end if;

  update public.goals
  set needs_reassign = true
  where startup_id = old.startup_id
    and owner_id = old.profile_id
    and archived_at is null
    and status <> 'completed';

  update public.tasks
  set needs_reassign = true
  where startup_id = old.startup_id
    and owner_id = old.profile_id
    and status <> 'done';

  return old;
end;
$$;

drop trigger if exists startup_members_mark_open_work on public.startup_members;
create trigger startup_members_mark_open_work
  after delete on public.startup_members
  for each row execute function public.mark_open_work_on_leave();

-- ---------------------------------------------------------------------------
-- Kopia warunków przy starcie etapu. Późniejsza zmiana programu nie rusza
-- wierszy, które startup już dostał.
-- ---------------------------------------------------------------------------

create or replace function public.snapshot_goal_conditions_for_stage(p_stage uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_startup uuid;
  v_status text;
  v_template uuid;
  r record;
begin
  select startup_id, status, template_id
    into v_startup, v_status, v_template
  from public.startup_stages
  where id = p_stage;

  if v_startup is null or v_status = 'completed' then
    return;
  end if;

  insert into public.startup_goal_conditions
    (startup_id, startup_stage_id, subpoint_id, goal_type_id, min_count, proof_kind, template_condition_id)
  select v_startup, p_stage, gc.subpoint_id, gc.goal_type_id, gc.min_count, gc.proof_kind, gc.id
  from public.stage_goal_conditions gc
  join public.stage_subpoints s on s.id = gc.subpoint_id
  join public.stage_points p on p.id = s.point_id
  join public.stage_categories c on c.id = p.category_id
  where c.template_id = v_template
  on conflict (startup_stage_id, subpoint_id, goal_type_id) do nothing;

  for r in
    select distinct subpoint_id
    from public.startup_goal_conditions
    where startup_stage_id = p_stage
  loop
    perform public.refresh_one_subpoint(p_stage, r.subpoint_id);
  end loop;
end;
$$;

create or replace function public.startup_stages_snapshot_goals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.snapshot_goal_conditions_for_stage(new.id);
  return new;
end;
$$;

drop trigger if exists startup_stages_snapshot_goals on public.startup_stages;
create trigger startup_stages_snapshot_goals
  after insert on public.startup_stages
  for each row execute function public.startup_stages_snapshot_goals();

create or replace function public.ensure_goal_condition_snapshots(p_startup_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if auth.uid() is null or not public.is_startup_member(p_startup_id) then
    return;
  end if;

  for r in
    select id from public.startup_stages
    where startup_id = p_startup_id and status = 'in_progress'
  loop
    perform public.snapshot_goal_conditions_for_stage(r.id);
  end loop;
end;
$$;

revoke all on function public.ensure_goal_condition_snapshots(uuid) from public;
grant execute on function public.ensure_goal_condition_snapshots(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Wersje Rozpiski. Proof trzyma numer wersji, nie „aktualny rysunek".
-- ---------------------------------------------------------------------------

create or replace function public.workflows_bump_version()
returns trigger
language plpgsql
as $$
begin
  if new.nodes is distinct from old.nodes
     or new.edges is distinct from old.edges
     or new.title is distinct from old.title
  then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists workflows_bump_version on public.workflows;
create trigger workflows_bump_version
  before update on public.workflows
  for each row execute function public.workflows_bump_version();

create or replace function public.workflows_store_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workflow_versions
    (workflow_id, version, title, nodes, edges, created_by)
  values (new.id, new.version, new.title, new.nodes, new.edges, auth.uid())
  on conflict (workflow_id, version) do nothing;
  return new;
end;
$$;

drop trigger if exists workflows_store_version on public.workflows;
create trigger workflows_store_version
  after insert or update on public.workflows
  for each row execute function public.workflows_store_version();

-- ---------------------------------------------------------------------------
-- Zamknięcie etapu dopisuje użyte Goals do snapshotu.
-- Odblokowanie trackera zostaje nawet po ponownym otwarciu Preparation.
-- ---------------------------------------------------------------------------

create or replace function public.close_stage(
  p_startup_stage_id uuid,
  p_decision         text,
  p_note             text default null,
  p_reopen_subpoints uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_startup_id uuid;
  v_template_key text;
  v_snapshot jsonb;
  v_reopened integer := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_decision not in ('continue', 'pivot', 'pause', 'archive') then
    raise exception 'invalid_decision';
  end if;

  if not public.can_edit_stage(p_startup_stage_id) then
    raise exception 'not_allowed'
      using hint = 'Tylko Founder i Admin moga zamknac etap.';
  end if;

  select ss.startup_id, t.key
    into v_startup_id, v_template_key
  from public.startup_stages ss
  join public.stage_templates t on t.id = ss.template_id
  where ss.id = p_startup_stage_id;

  if v_startup_id is null then
    raise exception 'stage_not_found';
  end if;

  select jsonb_build_object(
    'captured_at', now(),
    'answers', coalesce((
      select jsonb_object_agg(a.answer_key, a.value)
      from public.stage_answers a
      where a.startup_stage_id = p_startup_stage_id
    ), '{}'::jsonb),
    'completed_subpoints', coalesce((
      select jsonb_agg(pr.subpoint_id)
      from public.stage_subpoint_progress pr
      where pr.startup_stage_id = p_startup_stage_id and pr.is_complete
    ), '[]'::jsonb),
    'goals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'goal_id', g.id,
        'condition_id', l.condition_id,
        'goal_type_id', g.goal_type_id,
        'title', g.title,
        'proof_snapshot', g.proof_snapshot
      ))
      from public.startup_goal_conditions gc
      join public.goal_condition_links l on l.condition_id = gc.id
      join public.goals g on g.id = l.goal_id
      where gc.startup_stage_id = p_startup_stage_id
        and g.status = 'completed'
        and g.archived_at is null
    ), '[]'::jsonb)
  ) into v_snapshot;

  insert into public.stage_closures
    (startup_stage_id, decision, note, snapshot, closed_by)
  values
    (p_startup_stage_id, p_decision, nullif(trim(coalesce(p_note, '')), ''),
     v_snapshot, uid);

  if p_decision = 'continue' then
    update public.startup_stages
    set status = 'completed', completed_at = now()
    where id = p_startup_stage_id;

    if v_template_key = 'preparation' then
      update public.startups
      set execution_unlocked_at = coalesce(execution_unlocked_at, now())
      where id = v_startup_id;
    end if;

  elsif p_decision = 'pivot' then
    if p_reopen_subpoints is not null and array_length(p_reopen_subpoints, 1) > 0 then
      delete from public.stage_answers a
      where a.startup_stage_id = p_startup_stage_id
        and a.answer_key in (
          select f.answer_key
          from public.stage_fields f
          where f.subpoint_id = any (p_reopen_subpoints)
        );
      v_reopened := array_length(p_reopen_subpoints, 1);
    end if;

    update public.startup_stages
    set status = 'in_progress', completed_at = null
    where id = p_startup_stage_id;

  elsif p_decision = 'pause' then
    update public.startups set status = 'paused' where id = v_startup_id;

  elsif p_decision = 'archive' then
    update public.startups set status = 'archived' where id = v_startup_id;
  end if;

  return jsonb_build_object(
    'decision', p_decision,
    'reopened_subpoints', v_reopened
  );
end;
$$;

-- Startupy, które Preparation już domknęły, dostają tracker bez czekania
-- na kolejne zamknięcie.
update public.startups s
set execution_unlocked_at = coalesce(s.execution_unlocked_at, now())
where exists (
  select 1
  from public.startup_stages ss
  join public.stage_templates t on t.id = ss.template_id
  where ss.startup_id = s.id
    and t.key = 'preparation'
    and ss.status = 'completed'
);

-- ---------------------------------------------------------------------------
-- Powiadomienia o przypisaniu i przeszkodzie
-- ---------------------------------------------------------------------------

alter table public.notifications drop constraint if exists notification_kind_valid;
alter table public.notifications
  add constraint notification_kind_valid check (kind in (
    'contact_received', 'contact_accepted', 'message_received',
    'join_application', 'join_invite', 'join_accepted', 'join_declined',
    'goal_assigned', 'task_assigned', 'goal_blocked'
  ));

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.goal_types enable row level security;
alter table public.goals enable row level security;
alter table public.tasks enable row level security;
alter table public.goal_materials enable row level security;
alter table public.goal_events enable row level security;
alter table public.stage_goal_conditions enable row level security;
alter table public.startup_goal_conditions enable row level security;
alter table public.goal_condition_links enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;

drop policy if exists "goal_types_read" on public.goal_types;
create policy "goal_types_read"
  on public.goal_types for select to authenticated using (true);

drop policy if exists "stage_goal_conditions_read" on public.stage_goal_conditions;
create policy "stage_goal_conditions_read"
  on public.stage_goal_conditions for select to authenticated using (true);

drop policy if exists "goals_select" on public.goals;
create policy "goals_select"
  on public.goals for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "goals_insert" on public.goals;
create policy "goals_insert"
  on public.goals for insert to authenticated
  with check (
    public.is_startup_member(startup_id)
    and (
      public.can_edit_startup(startup_id)
      or owner_id = auth.uid()
    )
    and (
      owner_id is null
      or exists (
        select 1 from public.startup_members m
        where m.startup_id = goals.startup_id and m.profile_id = owner_id
      )
    )
  );

drop policy if exists "goals_update" on public.goals;
create policy "goals_update"
  on public.goals for update to authenticated
  using (
    public.is_startup_member(startup_id)
    and (public.can_edit_startup(startup_id) or owner_id = auth.uid())
  )
  with check (
    public.is_startup_member(startup_id)
    and (public.can_edit_startup(startup_id) or owner_id = auth.uid())
  );

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select"
  on public.tasks for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert"
  on public.tasks for insert to authenticated
  with check (
    public.is_startup_member(startup_id)
    and (public.can_edit_startup(startup_id) or owner_id = auth.uid())
  );

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update"
  on public.tasks for update to authenticated
  using (
    public.is_startup_member(startup_id)
    and (
      public.can_edit_startup(startup_id)
      or owner_id = auth.uid()
    )
  )
  with check (
    public.is_startup_member(startup_id)
    and (
      public.can_edit_startup(startup_id)
      or owner_id = auth.uid()
    )
  );

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete"
  on public.tasks for delete to authenticated
  using (
    public.is_startup_member(startup_id)
    and (
      public.can_edit_startup(startup_id)
      or created_by = auth.uid()
      or owner_id = auth.uid()
    )
  );

drop policy if exists "goal_materials_select" on public.goal_materials;
create policy "goal_materials_select"
  on public.goal_materials for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "goal_materials_insert" on public.goal_materials;
create policy "goal_materials_insert"
  on public.goal_materials for insert to authenticated
  with check (public.is_startup_member(startup_id));

drop policy if exists "goal_materials_delete" on public.goal_materials;
create policy "goal_materials_delete"
  on public.goal_materials for delete to authenticated
  using (
    public.is_startup_member(startup_id)
    and (created_by = auth.uid() or public.can_edit_startup(startup_id))
  );

drop policy if exists "goal_events_select" on public.goal_events;
create policy "goal_events_select"
  on public.goal_events for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_goal_conditions_select" on public.startup_goal_conditions;
create policy "startup_goal_conditions_select"
  on public.startup_goal_conditions for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "goal_condition_links_select" on public.goal_condition_links;
create policy "goal_condition_links_select"
  on public.goal_condition_links for select to authenticated
  using (
    exists (
      select 1 from public.startup_goal_conditions c
      where c.id = condition_id and public.is_startup_member(c.startup_id)
    )
  );

drop policy if exists "goal_condition_links_insert" on public.goal_condition_links;
create policy "goal_condition_links_insert"
  on public.goal_condition_links for insert to authenticated
  with check (
    exists (
      select 1
      from public.startup_goal_conditions c
      join public.goals g on g.id = goal_id
      where c.id = condition_id
        and c.startup_id = g.startup_id
        and public.is_startup_member(c.startup_id)
        and (public.can_edit_startup(c.startup_id) or g.owner_id = auth.uid())
    )
  );

drop policy if exists "goal_condition_links_delete" on public.goal_condition_links;
create policy "goal_condition_links_delete"
  on public.goal_condition_links for delete to authenticated
  using (
    exists (
      select 1
      from public.startup_goal_conditions c
      join public.goals g on g.id = goal_id
      where c.id = condition_id
        and public.is_startup_member(c.startup_id)
        and (public.can_edit_startup(c.startup_id) or g.owner_id = auth.uid())
    )
  );

drop policy if exists "workflows_all" on public.workflows;
create policy "workflows_all"
  on public.workflows for all to authenticated
  using (public.is_startup_member(startup_id))
  with check (public.is_startup_member(startup_id));

drop policy if exists "workflow_versions_select" on public.workflow_versions;
create policy "workflow_versions_select"
  on public.workflow_versions for select to authenticated
  using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id and public.is_startup_member(w.startup_id)
    )
  );

grant select on public.goal_types to authenticated;
grant select on public.stage_goal_conditions to authenticated;
grant select, insert, update on public.goals to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, delete on public.goal_materials to authenticated;
grant select on public.goal_events to authenticated;
grant select on public.startup_goal_conditions to authenticated;
grant select, insert, delete on public.goal_condition_links to authenticated;
grant select, insert, update, delete on public.workflows to authenticated;
grant select on public.workflow_versions to authenticated;

revoke all on function public.refresh_one_subpoint(uuid, uuid) from public;
revoke all on function public.subpoint_goals_met(uuid, uuid) from public;
revoke all on function public.snapshot_goal_conditions_for_stage(uuid) from public;
revoke all on function public.goal_file_belongs(uuid, jsonb) from public;
