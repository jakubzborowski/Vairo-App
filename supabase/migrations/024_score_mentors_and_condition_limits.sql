-- SCORE: re-review changed task snapshots, bounded GoalCondition slots,
-- operator-appointed programme mentors. Apply after 023; then 025 for cron.
begin;

create table if not exists public.program_mentors (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  operator_note text not null check(char_length(trim(operator_note))>=3)
);
create table if not exists public.startup_mentors (
  startup_id uuid not null references public.startups(id) on delete cascade,
  mentor_id uuid not null references public.program_mentors(profile_id) on delete cascade,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key(startup_id,mentor_id)
);
create index if not exists startup_mentors_active_mentor on public.startup_mentors(mentor_id) where revoked_at is null;
alter table public.program_mentors enable row level security;
alter table public.startup_mentors enable row level security;
revoke all on public.program_mentors,public.startup_mentors from public,anon,authenticated;
grant select on public.program_mentors,public.startup_mentors to authenticated;
drop policy if exists mentor_self_read on public.program_mentors;
create policy mentor_self_read on public.program_mentors for select to authenticated using(profile_id=auth.uid());
drop policy if exists mentor_assignments_read on public.startup_mentors;
create policy mentor_assignments_read on public.startup_mentors for select to authenticated using(mentor_id=auth.uid() or public.is_startup_member(startup_id));

create or replace function public.score_reviewer_allowed(p_startup uuid,p_reviewer uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select p_reviewer is not null and (exists(select 1 from public.startup_members where startup_id=p_startup and profile_id=p_reviewer and role in ('founder','admin'))
    or exists(select 1 from public.program_mentors m join public.startup_mentors sm on sm.mentor_id=m.profile_id
      where m.profile_id=p_reviewer and sm.startup_id=p_startup and m.revoked_at is null and sm.revoked_at is null));
$$;
create or replace function public.score_can_review_startup(p_startup uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.score_reviewer_allowed(p_startup,auth.uid());
$$;

alter table public.score_reviews add column if not exists review_key text;
-- Old reviews did not retain task titles/full hashes. Only reconstruct hashes
-- when the stored completed-task snapshot still matches and nothing is newer.
update public.score_reviews r set review_key=public.score_goal_review_key(r.goal_id)
where r.review_key is null and r.revoked_at is null and exists(select 1 from public.goals g
  where g.id=r.goal_id and g.owner_id=r.owner_id and g.proof_snapshot=r.proof_snapshot and g.status='completed' and g.archived_at is null
    and r.proof_key=public.score_proof_key(g.startup_id,g.proof_snapshot))
  and not exists(select 1 from public.tasks t where t.goal_id=r.goal_id and (t.status<>'done' or t.created_at>r.created_at
    or coalesce((to_jsonb(t)->>'updated_at')::timestamptz,t.created_at)>r.created_at))
  and coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'owner_id',t.owner_id) order by t.created_at,t.id)
    from public.tasks t where t.goal_id=r.goal_id and t.status='done'),'[]')=r.tasks_snapshot;

-- No FK to goals/startups: deleting/recreating a source must not release slots.
create table if not exists public.score_condition_slots (
  goal_id uuid primary key,
  startup_id uuid not null,
  template_condition_id uuid not null,
  condition_id uuid not null,
  slot_number integer not null check(slot_number>0),
  reserved_at timestamptz not null default now(),
  unique(startup_id,template_condition_id,slot_number)
);
alter table public.score_condition_slots enable row level security;
revoke all on public.score_condition_slots from public,anon,authenticated;
grant select on public.score_condition_slots to authenticated;
drop policy if exists score_slots_read on public.score_condition_slots;
create policy score_slots_read on public.score_condition_slots for select to authenticated using(public.is_startup_member(startup_id) or public.score_can_review_startup(startup_id));

create or replace function public.score_goal_conditions(p_goal uuid)
returns table(condition_id uuid,template_condition_id uuid,startup_id uuid,capacity integer)
language sql stable security definer set search_path=public as $$
  select distinct c.id,tc.id,c.startup_id,least(c.min_count,tc.min_count)
  from public.goals g join public.goal_condition_links l on l.goal_id=g.id join public.startup_goal_conditions c on c.id=l.condition_id and c.startup_id=g.startup_id
    join public.startup_stages ss on ss.id=c.startup_stage_id and ss.startup_id=g.startup_id
    join public.stage_templates st on st.id=ss.template_id and st.published_at is not null
    join public.stage_goal_conditions tc on tc.id=c.template_condition_id and tc.subpoint_id=c.subpoint_id and tc.goal_type_id=c.goal_type_id
    join public.stage_subpoints sp on sp.id=tc.subpoint_id join public.stage_points pt on pt.id=sp.point_id
    join public.stage_categories cat on cat.id=pt.category_id and cat.template_id=ss.template_id
  where g.id=p_goal and (tc.match_any_type or tc.goal_type_id=g.goal_type_id)
    and (tc.proof_kind is null or tc.proof_kind=g.proof_snapshot->>'kind');
$$;
create or replace function public.score_goal_has_capacity(p_goal uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.score_goal_conditions(p_goal) c where exists(
    select 1 from public.score_condition_slots s where s.goal_id=p_goal and s.startup_id=c.startup_id and s.template_condition_id=c.template_condition_id)
    or (not exists(select 1 from public.score_condition_slots where goal_id=p_goal)
      and (select count(*) from public.score_condition_slots s where s.startup_id=c.startup_id and s.template_condition_id=c.template_condition_id)<c.capacity));
$$;
create or replace function public.score_reserve_condition_slot(p_goal uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare c record; v_slot integer;
begin
  if exists(select 1 from public.score_condition_slots where goal_id=p_goal) then return public.score_goal_has_capacity(p_goal); end if;
  for c in select * from public.score_goal_conditions(p_goal) order by startup_id,template_condition_id,condition_id loop
    perform pg_advisory_xact_lock(hashtextextended('score:condition:'||c.startup_id::text||':'||c.template_condition_id::text,0));
    select n into v_slot from generate_series(1,c.capacity) n where not exists(select 1 from public.score_condition_slots s
      where s.startup_id=c.startup_id and s.template_condition_id=c.template_condition_id and s.slot_number=n) order by n limit 1;
    if v_slot is not null then
      insert into public.score_condition_slots(goal_id,startup_id,template_condition_id,condition_id,slot_number)
        values(p_goal,c.startup_id,c.template_condition_id,c.condition_id,v_slot) on conflict(goal_id) do nothing;
      return public.score_goal_has_capacity(p_goal);
    end if;
  end loop;
  return false;
end $$;
-- Reserve historical verified results first, including pending awards. Already
-- paid history stays intact; the cap applies to future awards and settlements.
do $$ declare g record; begin
  for g in select goal_id,min(created_at) first_review from public.score_reviews where goal_id is not null group by goal_id order by first_review,goal_id loop
    perform public.score_reserve_condition_slot(g.goal_id);
  end loop;
end $$;

create or replace function public.score_assess(p_kind text,p_source uuid,p_weight text)
returns void language plpgsql security definer set search_path=public as $$
declare v_startup uuid; v_status text; v_owner uuid;
begin
  if p_kind='goal' then select startup_id,status,owner_id into v_startup,v_status,v_owner from public.goals where id=p_source for update;
  elsif p_kind='task' then select startup_id,status,owner_id into v_startup,v_status,v_owner from public.tasks where id=p_source for update;
  else raise exception 'Nieprawidłowy rodzaj pracy.'; end if;
  if auth.uid() is null or v_startup is null or not public.score_can_review_startup(v_startup) then raise exception 'Skalę ustala inny Founder/Admin lub przypisany mentor programu.'; end if;
  if v_owner is null or v_owner=auth.uid() then raise exception 'Nie możesz zatwierdzić skali własnej pracy.'; end if;
  if v_status<>'todo' or exists(select 1 from public.score_assessments where kind=p_kind and source_id=p_source and frozen) then raise exception 'Skalę ustalasz przed rozpoczęciem pracy.'; end if;
  if p_weight is null or p_weight not in ('standard','large') then raise exception 'Nieprawidłowa skala.'; end if;
  insert into public.score_assessments(kind,source_id,startup_id,weight,assessed_by) values(p_kind,p_source,v_startup,p_weight,auth.uid())
  on conflict(kind,source_id) do update set weight=excluded.weight,assessed_by=excluded.assessed_by;
end $$;
create or replace function public.score_review_goal(p_goal uuid,p_note text,p_expected text)
returns void language plpgsql security definer set search_path=public as $$
declare g public.goals; r record; v_review uuid; v_key text; v_existing uuid; v_weight text; v_budget integer; v_points integer;
begin
  select * into g from public.goals where id=p_goal for update;
  if auth.uid() is null or g.id is null or not public.score_can_review_startup(g.startup_id) then raise exception 'Akceptacji dokonuje inny Founder/Admin lub przypisany mentor programu.'; end if;
  if g.owner_id=auth.uid() then raise exception 'Nie możesz zaakceptować własnego wyniku.'; end if;
  perform 1 from public.tasks where goal_id=g.id order by id for update;
  if p_expected is null or p_expected is distinct from public.score_goal_review_key(g.id) then raise exception 'Dowód lub zadania zmieniły się. Odśwież i sprawdź aktualny wynik.'; end if;
  if not public.score_goal_eligible(g.id) then raise exception 'Cel wymaga jawnego powiązania z programem i treściwego, poprawnego dowodu.'; end if;
  if not public.score_text_quality(p_note,80,12) then raise exception 'Opisz sprawdzony rezultat: minimum 80 znaków, 12 słów i różnorodne słownictwo.'; end if;
  if exists(select 1 from public.tasks where goal_id=g.id and status='done' and owner_id=auth.uid())
    or exists(select 1 from public.startup_files where startup_id=g.startup_id and storage_path=g.proof_snapshot#>>'{file,path}' and uploaded_by=auth.uid()) then
    raise exception 'Recenzent nie może otrzymywać nagrody za zadania ani plik z tego wyniku.';
  end if;
  if not public.score_reserve_condition_slot(g.id) then raise exception 'Limit SCORE tego warunku programu jest wyczerpany (min_count). Dodatkowe cele nie dają nagród za cel, jego zadania ani plik.'; end if;
  v_key:=public.score_proof_key(g.startup_id,g.proof_snapshot);
  insert into public.score_proof_claims(profile_id,proof_key,goal_id) values(g.owner_id,v_key,g.id) on conflict do nothing;
  select goal_id into v_existing from public.score_proof_claims where profile_id=g.owner_id and proof_key=v_key;
  if v_existing<>g.id then raise exception 'Ten dowód został już wykorzystany do punktacji innego celu.'; end if;
  update public.score_reward_queue set state='cancelled',reason='Poprzednia akceptacja zastąpiona nową.' where state='pending'
    and review_id in(select id from public.score_reviews where goal_id=g.id and revoked_at is null);
  update public.score_reviews set revoked_at=now() where goal_id=g.id and revoked_at is null;
  insert into public.score_reviews(goal_id,startup_id,owner_id,reviewer_id,proof_snapshot,proof_key,note,tasks_snapshot,review_key)
    values(g.id,g.startup_id,g.owner_id,auth.uid(),g.proof_snapshot,v_key,trim(p_note),coalesce((select jsonb_agg(jsonb_build_object('id',id,'owner_id',owner_id) order by created_at,id)
      from public.tasks where goal_id=g.id and status='done'),'[]'),p_expected) returning id into v_review;
  select coalesce((select weight from public.score_assessments where kind='goal' and source_id=g.id and assessed_by<>g.owner_id),'standard') into v_weight;
  perform public.score_enqueue(g.owner_id,g.startup_id,'goal',g.id::text,case when v_weight='large' then 80 else 40 end,g.title,null,auth.uid(),v_review);
  for r in select t.*,case when a.weight='large' and a.assessed_by<>t.owner_id then 15 else 5 end as amount
    from public.tasks t left join public.score_assessments a on a.kind='task' and a.source_id=t.id where t.goal_id=g.id and t.status='done' and t.owner_id is not null order by t.created_at,t.id loop
    select 30-coalesce(sum(points),0) into v_budget from public.score_reward_queue where kind='task' and parent_key=g.id::text and state<>'cancelled' and source_key<>r.id::text;
    v_points:=least(r.amount,v_budget);
    if v_points>0 then perform public.score_enqueue(r.owner_id,g.startup_id,'task',r.id::text,v_points,r.title,g.id::text,auth.uid(),v_review); end if;
  end loop;
  if g.proof_snapshot->>'kind'='file' then
    for r in select * from public.startup_files where startup_id=g.startup_id and storage_path=g.proof_snapshot#>>'{file,path}' loop
      perform public.score_enqueue(r.uploaded_by,g.startup_id,'document',r.uploaded_by::text||':'||v_key,10,r.name,g.id::text,auth.uid(),v_review);
    end loop;
  end if;
  for r in select distinct profile_id from public.score_reward_queue where review_id=v_review order by profile_id loop perform public.score_process_queue(r.profile_id); end loop;
end $$;
create or replace function public.score_review_program(p_claim uuid,p_note text,p_expected text)
returns void language plpgsql security definer set search_path=public as $$
declare c record;
begin
  select cl.*,b.startup_id,b.startup_stage_id,b.point_id,b.kind,b.scope_key,b.label into c from public.score_program_claims cl join public.score_program_batches b on b.id=cl.batch_id where cl.id=p_claim for update of cl;
  if auth.uid() is null or c.id is null or not public.score_can_review_startup(c.startup_id) then raise exception 'Akceptacji dokonuje inny Founder/Admin lub przypisany mentor programu.'; end if;
  if c.profile_id=auth.uid() then raise exception 'Nie możesz zaakceptować własnej części bonusu.'; end if;
  if p_expected is null or p_expected is distinct from public.score_program_evidence(c.startup_stage_id,c.point_id) then raise exception 'Odpowiedzi lub dowody programu zmieniły się. Odśwież i sprawdź aktualny wynik.'; end if;
  if not public.score_text_quality(p_note,80,12) then raise exception 'Opisz sprawdzone wyniki: minimum 80 znaków i 12 słów.'; end if;
  if not(case when c.kind='point' then public.score_point_ready(c.startup_stage_id,c.point_id) else public.score_stage_ready(c.startup_stage_id) end) then raise exception 'Wymagania programu nie są spełnione.'; end if;
  update public.score_program_claims set reviewer_id=auth.uid(),note=trim(p_note),reviewed_at=now(),evidence_key=public.score_program_evidence(c.startup_stage_id,c.point_id) where id=c.id;
  perform public.score_enqueue(c.profile_id,c.startup_id,c.kind,c.profile_id::text||':'||c.scope_key,c.points,c.label,null,auth.uid(),null,c.id);
  perform public.score_process_queue(c.profile_id);
end $$;

-- Preserve the tested v2 settlement validator and add quota/mentor revocation.
do $$ begin
  if to_regprocedure('public.score_queue_valid_v2(uuid)') is null then alter function public.score_queue_valid(uuid) rename to score_queue_valid_v2; end if;
  if to_regprocedure('public.score_process_queue_v2(uuid)') is null then alter function public.score_process_queue(uuid) rename to score_process_queue_v2; end if;
end $$;
create or replace function public.score_queue_valid(p_id uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare q public.score_reward_queue; v_goal uuid;
begin
  select * into q from public.score_reward_queue where id=p_id;
  if q.startup_id is not null and not public.score_reviewer_allowed(q.startup_id,q.confirmed_by) then return false; end if;
  if q.review_id is not null then
    select goal_id into v_goal from public.score_reviews where id=q.review_id;
    if v_goal is null or not exists(select 1 from public.score_condition_slots where goal_id=v_goal)
      or not public.score_goal_has_capacity(v_goal) then return false; end if;
  end if;
  return public.score_queue_valid_v2(p_id);
end $$;
alter table public.score_reward_queue add column if not exists last_checked_at timestamptz;
create index if not exists score_queue_worker_scan on public.score_reward_queue(state,last_checked_at,profile_id);
create or replace function public.score_process_queue(p_user uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_user is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('score:user:'||p_user::text,0));
  update public.score_reward_queue set last_checked_at=now() where profile_id=p_user and state='pending';
  perform public.score_process_queue_v2(p_user);
end $$;
create or replace function public.score_flush_due_rewards()
returns void language plpgsql security definer set search_path=public as $$
declare r record;
begin
  -- Only serialize the cron worker itself, never ordinary user awards.
  if not pg_try_advisory_xact_lock(hashtextextended('score:queue-worker',0)) then return; end if;
  for r in select profile_id from (
    select profile_id,min(last_checked_at) last_check from public.score_reward_queue where state='pending'
    group by profile_id order by min(last_checked_at) nulls first,profile_id limit 100
  ) pending_users order by profile_id loop
    if pg_try_advisory_xact_lock(hashtextextended('score:user:'||r.profile_id::text,0)) then perform public.score_process_queue(r.profile_id); end if;
  end loop;
end $$;

create or replace function public.score_program_review_context(p_stage uuid,p_point uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('answers',coalesce((select jsonb_agg(to_jsonb(r)) from (
    select distinct f.question,a.value from public.stage_fields f join public.stage_subpoints s on s.id=f.subpoint_id
      join public.stage_answers a on a.answer_key=f.answer_key and a.startup_stage_id=p_stage
    where (p_point is null or s.point_id=p_point)) r),'[]'),
    'goals',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select distinct g.id,g.title,g.proof_requirement,coalesce(g.proof_snapshot,'{}') as proof_snapshot from public.goals g
      join public.goal_condition_links l on l.goal_id=g.id join public.startup_goal_conditions c on c.id=l.condition_id
      join public.stage_subpoints s on s.id=c.subpoint_id where c.startup_stage_id=p_stage and (p_point is null or s.point_id=p_point)) r),'[]'));
$$;
create or replace function public.score_review_candidates(p_startup uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('goals',coalesce((select jsonb_agg(to_jsonb(r)) from (
    select g.id,g.title,g.owner_id,p.full_name as owner_name,g.proof_requirement,coalesce(g.proof_snapshot,'{}') as proof_snapshot,
      public.score_goal_eligible(g.id) and public.score_goal_has_capacity(g.id) as eligible,
      case when not public.score_goal_eligible(g.id) then 'Potrzebny treściwy dowód i jawne powiązanie z opublikowanym programem.'
        when not public.score_goal_has_capacity(g.id) then 'Limit punktowanych celów tego warunku (min_count) został wykorzystany.' else null end as eligibility_reason,
      public.score_goal_review_key(g.id) as review_key,
      exists(select 1 from public.score_reviews sr where sr.goal_id=g.id) as rereview,
      coalesce((select jsonb_agg(jsonb_build_object('title',t.title,'owner_name',tp.full_name) order by t.created_at,t.id)
        from public.tasks t left join public.profiles tp on tp.id=t.owner_id where t.goal_id=g.id and t.status='done'),'[]') as tasks
    from public.goals g join public.profiles p on p.id=g.owner_id
    where public.score_can_review_startup(p_startup) and g.startup_id=p_startup and g.status='completed' and g.archived_at is null and g.owner_id<>auth.uid()
      and not exists(select 1 from public.score_reviews sr where sr.goal_id=g.id and sr.revoked_at is null and sr.review_key=public.score_goal_review_key(g.id))
    order by g.created_at,g.id limit 50) r),'[]'),
    'program',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select c.id,c.points,c.profile_id,p.full_name as owner_name,b.label,b.kind,b.startup_stage_id,b.point_id,t.key as stage_key,
        public.score_program_evidence(b.startup_stage_id,b.point_id) as review_key,public.score_program_review_context(b.startup_stage_id,b.point_id) as context
      from public.score_program_claims c join public.score_program_batches b on b.id=c.batch_id join public.profiles p on p.id=c.profile_id
        join public.startup_stages ss on ss.id=b.startup_stage_id join public.stage_templates t on t.id=ss.template_id
      where public.score_can_review_startup(p_startup) and b.startup_id=p_startup and c.profile_id<>auth.uid()
        and not exists(select 1 from public.score_reward_queue q where q.kind=b.kind and q.source_key=c.profile_id::text||':'||b.scope_key and q.state in ('pending','awarded'))
      order by b.created_at,c.id limit 50) r),'[]'));
$$;
create or replace function public.score_review_workspaces()
returns table(id uuid,name text,is_mentor boolean) language sql stable security definer set search_path=public as $$
  select s.id,s.name,not public.can_edit_startup(s.id) from public.startups s
  where auth.uid() is not null and public.score_can_review_startup(s.id) order by s.name,s.id;
$$;
create or replace function public.score_assessment_candidates(p_startup uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(r)),'[]') from (
    select g.id,g.title,'goal'::text kind,coalesce(a.weight,'standard') weight from public.goals g
      left join public.score_assessments a on a.kind='goal' and a.source_id=g.id
      where public.score_can_review_startup(p_startup) and g.startup_id=p_startup and g.owner_id<>auth.uid() and g.status='todo' and g.archived_at is null and not coalesce(a.frozen,false)
    union all
    select t.id,t.title,'task',coalesce(a.weight,'standard') from public.tasks t
      left join public.score_assessments a on a.kind='task' and a.source_id=t.id
      where public.score_can_review_startup(p_startup) and t.startup_id=p_startup and t.owner_id<>auth.uid() and t.status='todo' and not coalesce(a.frozen,false)
    limit 100) r;
$$;

-- Mentors can sign/read assigned team's proof files, not write to Storage.
create or replace function public.score_mentor_file_allowed(p_path text)
returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and exists(select 1 from public.program_mentors m join public.startup_mentors sm on sm.mentor_id=m.profile_id
    where m.profile_id=auth.uid() and m.revoked_at is null and sm.revoked_at is null and (
      p_path like sm.startup_id::text||'/%' or exists(select 1 from public.startup_files f where f.startup_id=sm.startup_id and f.storage_path=p_path)
      or exists(select 1 from public.startup_stages ss where ss.startup_id=sm.startup_id and p_path like ss.id::text||'/%')));
$$;
drop policy if exists score_mentor_proof_read on storage.objects;
create policy score_mentor_proof_read on storage.objects for select to authenticated using(bucket_id='stage-files' and public.score_mentor_file_allowed(name));

-- Keep the v2 overview's tested settlement/totals, replace only review status.
create or replace function public.score_cron_configured()
returns boolean language plpgsql stable security definer set search_path=public as $$
declare v_active boolean;
begin
  if to_regclass('cron.job') is null then return false; end if;
  execute 'select exists(select 1 from cron.job where jobname=$1 and active and schedule=$2 and command=$3)'
    into v_active using 'vairo-score-reward-queue','*/5 * * * *','select public.score_flush_due_rewards();';
  return coalesce(v_active,false);
end $$;
do $$ begin if to_regprocedure('public.score_overview_v2()') is null then alter function public.score_overview() rename to score_overview_v2; end if; end $$;
create or replace function public.score_overview()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
  v_result:=public.score_overview_v2();
  v_result:=jsonb_set(v_result,'{policy_revision}','3'::jsonb);
  v_result:=jsonb_set(v_result,'{queue_scheduled}',to_jsonb(public.score_cron_configured()));
  return jsonb_set(v_result,'{awaiting_review}',coalesce((select jsonb_agg(to_jsonb(r)) from (
    select g.id,g.title as label,case when not public.score_goal_eligible(g.id) then 'Potrzebny treściwy proof i jawne powiązanie z programem.'
      when not public.score_goal_has_capacity(g.id) then 'Wykorzystano limit punktowanych celów warunku programu (min_count).'
      when exists(select 1 from public.score_reviews sr where sr.goal_id=g.id) then 'Zmieniony zakres zadań wymaga ponownej recenzji — bez otwierania celu.'
      else 'Wynik czeka na drugiego Foundera/Admina lub przypisanego mentora programu.' end as reason
    from public.goals g where g.owner_id=auth.uid() and g.status='completed' and g.archived_at is null
      and not exists(select 1 from public.score_reviews sr where sr.goal_id=g.id and sr.revoked_at is null and sr.review_key=public.score_goal_review_key(g.id))
    union all
    select c.id,b.label,'Twoja część bonusu czeka na drugiego Foundera/Admina lub przypisanego mentora programu.' from public.score_program_claims c join public.score_program_batches b on b.id=c.batch_id
      where c.profile_id=auth.uid() and not exists(select 1 from public.score_reward_queue q where q.kind=b.kind and q.source_key=c.profile_id::text||':'||b.scope_key and q.state in ('pending','awarded'))
    limit 50) r),'[]'));
end $$;

revoke all on function public.score_reviewer_allowed(uuid,uuid),public.score_goal_conditions(uuid),public.score_goal_has_capacity(uuid),
  public.score_reserve_condition_slot(uuid),public.score_queue_valid(uuid),public.score_queue_valid_v2(uuid),public.score_process_queue(uuid),
  public.score_process_queue_v2(uuid),public.score_program_review_context(uuid,uuid),public.score_overview_v2(),public.score_cron_configured() from public,anon,authenticated;
revoke all on function public.score_can_review_startup(uuid),public.score_assess(text,uuid,text),public.score_review_goal(uuid,text,text),
  public.score_review_program(uuid,text,text),public.score_review_candidates(uuid),public.score_review_workspaces(),public.score_assessment_candidates(uuid),
  public.score_mentor_file_allowed(text),public.score_overview() from public,anon;
grant execute on function public.score_can_review_startup(uuid),public.score_assess(text,uuid,text),public.score_review_goal(uuid,text,text),
  public.score_review_program(uuid,text,text),public.score_review_candidates(uuid),public.score_review_workspaces(),public.score_assessment_candidates(uuid),
  public.score_mentor_file_allowed(text),public.score_overview() to authenticated;
revoke all on function public.score_flush_due_rewards() from public,anon,authenticated;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then
  grant select,insert,update,delete on public.program_mentors,public.startup_mentors to service_role;
  grant execute on function public.score_flush_due_rewards() to service_role;
end if; end $$;
commit;
