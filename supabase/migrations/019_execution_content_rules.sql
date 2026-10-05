-- ============================================================================
-- 019 · Reguły treści Execution
-- ----------------------------------------------------------------------------
-- Dokumenty Execution rozróżniają cel dopiero ustawiony (wynik, właściciel,
-- termin, oczekiwany dowód) od celu ukończonego. Końcowe potwierdzenie
-- czeka na wcześniejsze podpunkty. Słownik mówi „Wynik testu”.
--
-- Odpal PO 018. Idempotentne.
-- ============================================================================

update public.goal_types
set label = 'Wynik testu',
    description = 'Sprawdzenie wersji: warunki, wynik i decyzja, co z tego wynika.'
where id = 'product_test';

alter table public.stage_goal_conditions
  add column if not exists counts_when text not null default 'completed',
  add column if not exists match_any_type boolean not null default false;

alter table public.stage_goal_conditions
  drop constraint if exists stage_goal_conditions_counts;
alter table public.stage_goal_conditions
  add constraint stage_goal_conditions_counts
  check (counts_when in ('completed', 'defined'));

alter table public.startup_goal_conditions
  add column if not exists counts_when text not null default 'completed',
  add column if not exists match_any_type boolean not null default false;

alter table public.startup_goal_conditions
  drop constraint if exists startup_goal_conditions_counts;
alter table public.startup_goal_conditions
  add constraint startup_goal_conditions_counts
  check (counts_when in ('completed', 'defined'));

alter table public.stage_subpoints
  add column if not exists depends_on text[];

-- Cel „ustawiony” ma wynik, właściciela, termin i format dowodu.
-- Cel „ukończony” ma do tego status i dowód zgodny z wymaganiem.
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
          and g.archived_at is null
          and (
            gc.match_any_type
            or g.goal_type_id = gc.goal_type_id
          )
          and (
            (
              gc.counts_when = 'defined'
              and g.owner_id is not null
              and g.due_date is not null
              and nullif(g.proof_requirement->>'kind', '') is not null
            )
            or (
              gc.counts_when = 'completed'
              and g.status = 'completed'
              and public.proof_matches(g.proof_requirement, g.proof_snapshot)
              and (
                gc.proof_kind is null
                or g.proof_snapshot->>'kind' = gc.proof_kind
              )
            )
          )
      ) as done
    from public.startup_goal_conditions gc
    where gc.startup_stage_id = p_stage
      and gc.subpoint_id = p_subpoint
  ) s;
$$;

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
  v_depends text[];
  v_key text;
  v_skip boolean := false;
  v_complete boolean;
  v_waiting integer;
  v_depth integer;
  r record;
begin
  v_depth := coalesce(nullif(current_setting('vairo.refresh_depth', true), ''), '0')::int;
  if v_depth > 8 then
    return;
  end if;
  perform set_config('vairo.refresh_depth', (v_depth + 1)::text, true);

  select startup_id, status into v_startup, v_status
  from public.startup_stages
  where id = p_stage;

  if v_startup is null or v_status = 'completed'
     or not exists (select 1 from public.startups where id = v_startup)
     or (auth.uid() is not null and not public.is_startup_member(v_startup)) then
    perform set_config('vairo.refresh_depth', v_depth::text, true);
    return;
  end if;

  select s.skip_when, s.depends_on, p.key || '.' || s.key
    into v_skip_when, v_depends, v_key
  from public.stage_subpoints s
  join public.stage_points p on p.id = s.point_id
  where s.id = p_subpoint;

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

    if v_complete and coalesce(array_length(v_depends, 1), 0) > 0 then
      select count(*) into v_waiting
      from unnest(v_depends) as dep(dep_key)
      left join lateral (
        select pr.is_complete
        from public.stage_subpoints ds
        join public.stage_points dp on dp.id = ds.point_id
        join public.stage_categories dc on dc.id = dp.category_id
        join public.startup_stages ss
          on ss.id = p_stage and ss.template_id = dc.template_id
        left join public.stage_subpoint_progress pr
          on pr.startup_stage_id = p_stage and pr.subpoint_id = ds.id
        where dp.key || '.' || ds.key = dep.dep_key
        limit 1
      ) found on true
      where coalesce(found.is_complete, false) = false;

      v_complete := v_waiting = 0;
    end if;
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

  for r in
    select child.id
    from public.stage_subpoints child
    join public.stage_points cp on cp.id = child.point_id
    join public.stage_categories cc on cc.id = cp.category_id
    join public.startup_stages ss
      on ss.id = p_stage and ss.template_id = cc.template_id
    where child.depends_on is not null
      and v_key = any(child.depends_on)
      and child.id <> p_subpoint
  loop
    perform public.refresh_one_subpoint(p_stage, r.id);
  end loop;

  perform set_config('vairo.refresh_depth', v_depth::text, true);
end;
$$;

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
    (startup_id, startup_stage_id, subpoint_id, goal_type_id, min_count, proof_kind,
     counts_when, match_any_type, template_condition_id)
  select v_startup, p_stage, gc.subpoint_id, gc.goal_type_id, gc.min_count, gc.proof_kind,
         gc.counts_when, gc.match_any_type, gc.id
  from public.stage_goal_conditions gc
  join public.stage_subpoints s on s.id = gc.subpoint_id
  join public.stage_points p on p.id = s.point_id
  join public.stage_categories c on c.id = p.category_id
  where c.template_id = v_template
  on conflict (startup_stage_id, subpoint_id, goal_type_id) do update
  set min_count = excluded.min_count,
      proof_kind = excluded.proof_kind,
      counts_when = excluded.counts_when,
      match_any_type = excluded.match_any_type,
      template_condition_id = excluded.template_condition_id;

  for r in
    select distinct subpoint_id
    from public.startup_goal_conditions
    where startup_stage_id = p_stage
  loop
    perform public.refresh_one_subpoint(p_stage, r.subpoint_id);
  end loop;
end;
$$;

-- Zbliżający się termin. Jedno nieprzeczytane powiadomienie na cel.
alter table public.notifications drop constraint if exists notification_kind_valid;
alter table public.notifications
  add constraint notification_kind_valid check (kind in (
    'contact_received', 'contact_accepted', 'message_received',
    'join_application', 'join_invite', 'join_accepted', 'join_declined',
    'goal_assigned', 'task_assigned', 'goal_blocked', 'goal_due'
  ));

create or replace function public.notify_upcoming_deadlines(p_startup_id uuid)
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
    select g.id, g.owner_id, g.title, g.due_date
    from public.goals g
    where g.startup_id = p_startup_id
      and g.archived_at is null
      and g.status <> 'completed'
      and g.owner_id is not null
      and g.due_date between current_date and current_date + 2
      and not exists (
        select 1 from public.notifications n
        where n.profile_id = g.owner_id
          and n.kind = 'goal_due'
          and n.href = '/app/goals?goal=' || g.id
          and n.created_at > now() - interval '3 days'
      )
  loop
    perform public.push_notification(
      r.owner_id, 'goal_due', '/app/goals?goal=' || r.id,
      null, p_startup_id, left(r.title, 140), true
    );
  end loop;
end;
$$;

revoke all on function public.notify_upcoming_deadlines(uuid) from public;
grant execute on function public.notify_upcoming_deadlines(uuid) to authenticated;

-- Prosty dokument zespołu. Nie jest edytorem na żywo.
create table if not exists public.startup_documents (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  title text not null,
  body text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint startup_documents_title_len check (char_length(trim(title)) between 1 and 140)
);

create index if not exists startup_documents_startup_idx
  on public.startup_documents (startup_id, updated_at desc);

alter table public.startup_documents enable row level security;

drop policy if exists "startup_documents_select" on public.startup_documents;
create policy "startup_documents_select"
  on public.startup_documents for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_documents_insert" on public.startup_documents;
create policy "startup_documents_insert"
  on public.startup_documents for insert to authenticated
  with check (public.is_startup_member(startup_id) and created_by = auth.uid());

drop policy if exists "startup_documents_update" on public.startup_documents;
create policy "startup_documents_update"
  on public.startup_documents for update to authenticated
  using (
    public.is_startup_member(startup_id)
    and (created_by = auth.uid() or public.can_edit_startup(startup_id))
  )
  with check (public.is_startup_member(startup_id));

drop policy if exists "startup_documents_delete" on public.startup_documents;
create policy "startup_documents_delete"
  on public.startup_documents for delete to authenticated
  using (
    public.is_startup_member(startup_id)
    and (created_by = auth.uid() or public.can_edit_startup(startup_id))
  );

grant select, insert, update, delete on public.startup_documents to authenticated;
