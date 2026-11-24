-- 053 · Panel testowy: przeskakiwanie etapów bez wypełniania pytań
--
-- Kto: wyłącznie osoby z listy `platform_testers` (po adresie e-mail konta).
-- Lista nie ma żadnych polityk RLS — nikt nie odczyta jej ani nie zmieni
-- z aplikacji. Testerów dopisuje się ręcznie w SQL Editorze:
--
--   insert into public.platform_testers (email, note)
--   values ('ktos@example.com', 'testy etapów')
--   on conflict (email) do nothing;
--
--   delete from public.platform_testers where email = 'ktos@example.com';
--
-- Co: `tester_jump_to_stage(startup, etap)` ustawia wybrany etap jako
-- bieżący w DOWOLNYM startupie:
--   • etapy przed nim → domknięte (z zapisem w stage_closures, decyzja
--     „continue”, notatka „Panel testowy”), domknięcie Preparation
--     odblokowuje tracker celów jak przy zwykłym zamknięciu;
--   • wybrany etap → rozpoczęty (in_progress);
--   • etapy za nim → USUNIĘTE razem z odpowiedziami i postępem, bo program
--     liczy bieżący etap jako najdalszy rozpoczęty. Inaczej cofnięcie
--     nie byłoby możliwe.
-- `p_stage_key = '__complete__'` domyka wszystkie etapy (ekran końca programu).
--
-- SCORE: przeskoczenie nie nalicza punktów — `score_stage_completed`
-- wymaga gotowości etapu (`score_stage_ready`), której pominięty etap nie ma.
--
-- Wymaga 010 (stage_closures) i 025 (execution_unlocked_at). Idempotentne.

begin;

create table if not exists public.platform_testers (
  email    text primary key,
  note     text,
  added_at timestamptz not null default now(),
  constraint platform_testers_email_lower check (email = lower(trim(email)))
);

alter table public.platform_testers enable row level security;
revoke all on public.platform_testers from anon, authenticated;

-- Czy zalogowana osoba jest testerem. Bez wyjątku dla niezalogowanych —
-- po prostu `false`.
create or replace function public.is_platform_tester()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_testers t
    join auth.users u on lower(u.email) = t.email
    where u.id = auth.uid()
  );
$$;

revoke all on function public.is_platform_tester() from public;
grant execute on function public.is_platform_tester() to authenticated;

-- Lista wszystkich startupów z postępem w etapach. Omija RLS (security
-- definer), więc sama sprawdza, czy pyta tester.
drop function if exists public.tester_startups();
create function public.tester_startups()
returns table (
  id uuid,
  name text,
  status text,
  created_at timestamptz,
  member_count integer,
  is_member boolean,
  stages jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_tester() then
    raise exception 'not_tester';
  end if;

  return query
  with latest as (
    select distinct on (t.key) t.id, t.key
    from public.stage_templates t
    order by t.key, t.version desc
  )
  select
    s.id,
    s.name,
    s.status,
    s.created_at,
    (select count(*)::integer from public.startup_members m where m.startup_id = s.id),
    exists (
      select 1 from public.startup_members m
      where m.startup_id = s.id and m.profile_id = auth.uid()
    ),
    coalesce((
      select jsonb_object_agg(l.key, ss.status)
      from public.startup_stages ss
      join latest l on l.id = ss.template_id
      where ss.startup_id = s.id
    ), '{}'::jsonb)
  from public.startups s
  order by s.created_at desc;
end;
$$;

revoke all on function public.tester_startups() from public;
grant execute on function public.tester_startups() to authenticated;

create or replace function public.tester_jump_to_stage(
  p_startup_id uuid,
  p_stage_key  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_target_position integer;
  v_all_done boolean := p_stage_key = '__complete__';
  r record;
  v_stage_id uuid;
  v_completed integer := 0;
  v_removed integer := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_platform_tester() then
    raise exception 'not_tester';
  end if;

  if not exists (select 1 from public.startups where id = p_startup_id) then
    raise exception 'tester_startup_not_found';
  end if;

  if not v_all_done then
    select t.position into v_target_position
    from public.stage_templates t
    where t.key = p_stage_key
    order by t.version desc
    limit 1;

    if v_target_position is null then
      raise exception 'tester_stage_not_found';
    end if;
  end if;

  for r in
    select distinct on (t.key) t.id, t.key, t.position
    from public.stage_templates t
    order by t.key, t.version desc
  loop
    if v_all_done or r.position < v_target_position then
      -- Etap przed wybranym: domknięty.
      select ss.id into v_stage_id
      from public.startup_stages ss
      where ss.startup_id = p_startup_id and ss.template_id = r.id;

      if v_stage_id is null then
        insert into public.startup_stages (startup_id, template_id, status, completed_at)
        values (p_startup_id, r.id, 'completed', now())
        returning id into v_stage_id;
        v_completed := v_completed + 1;
      elsif exists (
        select 1 from public.startup_stages
        where id = v_stage_id and status <> 'completed'
      ) then
        update public.startup_stages
        set status = 'completed', completed_at = now()
        where id = v_stage_id;
        v_completed := v_completed + 1;
      else
        v_stage_id := null; -- już był domknięty, bez nowego wpisu w historii
      end if;

      if v_stage_id is not null then
        insert into public.stage_closures
          (startup_stage_id, decision, note, snapshot, closed_by)
        values (
          v_stage_id, 'continue', 'Panel testowy',
          jsonb_build_object(
            'captured_at', now(),
            'tester_skip', true,
            'answers', coalesce((
              select jsonb_object_agg(a.answer_key, a.value)
              from public.stage_answers a
              where a.startup_stage_id = v_stage_id
            ), '{}'::jsonb),
            'completed_subpoints', coalesce((
              select jsonb_agg(pr.subpoint_id)
              from public.stage_subpoint_progress pr
              where pr.startup_stage_id = v_stage_id and pr.is_complete
            ), '[]'::jsonb),
            'goals', '[]'::jsonb
          ),
          uid
        );
      end if;

      if r.key = 'preparation' then
        update public.startups
        set execution_unlocked_at = coalesce(execution_unlocked_at, now())
        where id = p_startup_id;
      end if;

    elsif r.position = v_target_position then
      -- Wybrany etap: bieżący.
      insert into public.startup_stages (startup_id, template_id, status)
      values (p_startup_id, r.id, 'in_progress')
      on conflict (startup_id, template_id)
      do update set status = 'in_progress', completed_at = null
      where public.startup_stages.status <> 'in_progress';

    else
      -- Etapy za wybranym: usuwane (każda wersja treści tego etapu).
      with gone as (
        delete from public.startup_stages ss
        using public.stage_templates t
        where ss.template_id = t.id
          and ss.startup_id = p_startup_id
          and t.key = r.key
        returning ss.id
      )
      select v_removed + count(*)::integer into v_removed from gone;
    end if;
  end loop;

  return jsonb_build_object(
    'stage', p_stage_key,
    'completed', v_completed,
    'removed', v_removed
  );
end;
$$;

revoke all on function public.tester_jump_to_stage(uuid, text) from public;
grant execute on function public.tester_jump_to_stage(uuid, text) to authenticated;

commit;

-- Kontrola: tabela i trzy funkcje.
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'platform_testers') as tabela,
  (select count(*) from information_schema.routines
    where routine_schema = 'public'
      and routine_name in ('is_platform_tester', 'tester_startups', 'tester_jump_to_stage')) as funkcje;
