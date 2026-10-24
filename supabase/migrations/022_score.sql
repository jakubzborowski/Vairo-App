-- SCORE v1. Forward-only awards from real events after migration, no backfill.
begin;

create table if not exists public.score_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete set null,
  kind text not null check (kind in ('task','goal','document','point','stage','feedback','help')),
  source_key text not null,
  parent_key text,
  points integer not null check (points > 0),
  track text not null check (track in ('work','reputation')),
  label text not null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(kind, source_key)
);
create index if not exists score_events_profile_idx on public.score_events(profile_id, created_at);
alter table public.score_events enable row level security;
revoke all on public.score_events from anon, authenticated;
grant select on public.score_events to authenticated;
drop policy if exists score_read_own on public.score_events;
create policy score_read_own on public.score_events for select to authenticated using(profile_id = auth.uid());

-- Frozen assessment: no client-editable score columns on goals/tasks.
create table if not exists public.score_assessments (
  kind text not null check(kind in ('task','goal')),
  source_id uuid not null,
  startup_id uuid not null references public.startups(id) on delete cascade,
  weight text not null check(weight in ('standard','large')),
  assessed_by uuid not null references public.profiles(id),
  frozen boolean not null default false,
  primary key(kind, source_id)
);
alter table public.score_assessments enable row level security;
revoke all on public.score_assessments from anon, authenticated;
grant select on public.score_assessments to authenticated;
drop policy if exists score_assessments_read on public.score_assessments;
create policy score_assessments_read on public.score_assessments for select to authenticated
using(public.is_startup_member(startup_id));

create or replace function public.score_assess(p_kind text, p_source uuid, p_weight text)
returns void language plpgsql security definer set search_path = public as $$
declare v_startup uuid; v_status text;
begin
  if p_kind = 'task' then
    select startup_id, status into v_startup, v_status from public.tasks where id=p_source for update;
  elsif p_kind = 'goal' then
    select startup_id, status into v_startup, v_status from public.goals where id=p_source for update;
  else raise exception 'Nieprawidłowy rodzaj pracy.'; end if;
  if v_startup is null or auth.uid() is null or not public.can_edit_startup(v_startup) then
    raise exception 'Tylko Founder/Admin tego teamu może ustalić skalę pracy.';
  end if;
  if v_status <> 'todo' or exists(select 1 from public.score_assessments where kind=p_kind and source_id=p_source and frozen)
    or exists(select 1 from public.score_events where kind=p_kind and source_key=p_source::text) then
    raise exception 'Skalę ustalasz przed rozpoczęciem pracy.';
  end if;
  if p_weight not in ('standard','large') then raise exception 'Nieprawidłowa skala.'; end if;
  insert into public.score_assessments(kind,source_id,startup_id,weight,assessed_by)
  values(p_kind,p_source,v_startup,p_weight,auth.uid())
  on conflict(kind,source_id) do update set weight=excluded.weight, assessed_by=excluded.assessed_by;
end $$;
revoke all on function public.score_assess(text,uuid,text) from public;
grant execute on function public.score_assess(text,uuid,text) to authenticated;

create or replace function public.score_freeze_assessment()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_kind text := case when tg_table_name='tasks' then 'task' else 'goal' end;
begin
  if new.status<>'todo' and auth.uid() is not null then
    insert into public.score_assessments(kind,source_id,startup_id,weight,assessed_by,frozen)
    values(v_kind,new.id,new.startup_id,'standard',auth.uid(),true)
    on conflict(kind,source_id) do update set frozen=true;
  end if;
  return new;
end $$;
revoke all on function public.score_freeze_assessment() from public;
drop trigger if exists score_freeze on public.tasks;
create trigger score_freeze before insert or update on public.tasks for each row execute function public.score_freeze_assessment();
drop trigger if exists score_freeze on public.goals;
create trigger score_freeze before insert or update on public.goals for each row execute function public.score_freeze_assessment();

-- Internal only. Serializing all awards avoids races around quotas/deduplication.
create or replace function public.score_award(p_user uuid,p_startup uuid,p_kind text,p_source text,
  p_points integer,p_label text,p_parent text default null,p_confirmer uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_today timestamptz := date_trunc('day',now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw';
  v_total integer; v_cap integer;
begin
  if p_user is null then return; end if;
  perform pg_advisory_xact_lock(226022);
  if exists(select 1 from public.score_events where kind=p_kind and source_key=p_source) then return; end if;
  if p_startup is not null and not exists(select 1 from public.startup_members where startup_id=p_startup and profile_id=p_user) then return; end if;
  if p_kind='task' then
    select coalesce(sum(points),0) into v_total from public.score_events where kind='task' and parent_key=p_parent;
    if v_total+p_points>30 then return; end if;
  end if;
  v_cap := case p_kind when 'document' then 30 when 'feedback' then 15 when 'help' then 20
    when 'task' then 60 when 'goal' then 200 else 2147483647 end;
  select coalesce(sum(points),0) into v_total from public.score_events
    where profile_id=p_user and kind=p_kind and created_at>=v_today;
  if v_total+p_points>v_cap then return; end if;
  insert into public.score_events(profile_id,startup_id,kind,source_key,points,track,label,parent_key,confirmed_by)
  values(p_user,p_startup,p_kind,p_source,p_points,
    case when p_kind in ('feedback','help') then 'reputation' else 'work' end,p_label,p_parent,p_confirmer)
  on conflict(kind,source_key) do nothing;
end $$;
revoke all on function public.score_award(uuid,uuid,text,text,integer,text,text,uuid) from public,anon,authenticated;

create or replace function public.score_work_completed()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_large boolean; v_file record; v_parent record; v_proof text;
begin
  if tg_table_name='tasks' then
    if new.status <> 'done' then return new; end if;
    if tg_op='UPDATE' then if old.status='done' then return new; end if; end if;
    select * into v_parent from public.goals where id=new.goal_id;
    if v_parent.status='completed' and v_parent.archived_at is null
      and exists(select 1 from public.score_events where kind='goal' and source_key=v_parent.id::text)
      and public.proof_matches(v_parent.proof_requirement,v_parent.proof_snapshot) then
      select coalesce((select weight='large' from public.score_assessments where kind='task' and source_id=new.id),false) into v_large;
      perform public.score_award(new.owner_id,new.startup_id,'task',new.id::text,
        case when v_large then 15 else 5 end,new.title,new.goal_id::text);
    end if;
    return new;
  end if;
  if new.status <> 'completed' or new.archived_at is not null
    or not public.proof_matches(new.proof_requirement,new.proof_snapshot) then return new; end if;
  if tg_op='UPDATE' then if old.status='completed' then return new; end if; end if;
  if new.proof_snapshot->>'kind'='file' and not exists(
    select 1 from public.startup_files f join storage.objects o
      on o.bucket_id='stage-files' and o.name=f.storage_path
    where f.startup_id=new.startup_id and f.storage_path=new.proof_snapshot#>>'{file,path}'
      and f.size_bytes>0 and coalesce((o.metadata->>'size')::bigint,0)>0
  ) then return new; end if;
  v_proof := new.startup_id::text||':'||md5(regexp_replace(lower(
    case new.proof_snapshot->>'kind'
      when 'file' then coalesce((select o.metadata->>'eTag' from storage.objects o
        where o.bucket_id='stage-files' and o.name=new.proof_snapshot#>>'{file,path}'),new.proof_snapshot#>>'{file,path}')
      when 'sentence' then new.proof_snapshot->>'text'
      when 'long_text' then new.proof_snapshot->>'text'
      when 'link' then new.proof_snapshot->>'url'
      else (new.proof_snapshot - 'captured_at' - 'captured_by' - 'title')::text
    end),'\s+',' ','g'));
  perform pg_advisory_xact_lock(226022);
  if exists(select 1 from public.score_events where kind='goal' and parent_key=v_proof) then return new; end if;
  select coalesce((select weight='large' from public.score_assessments where kind='goal' and source_id=new.id),false) into v_large;
  perform public.score_award(new.owner_id,new.startup_id,'goal',new.id::text,
    case when v_large then 80 else 40 end,new.title,v_proof);
  if not exists(select 1 from public.score_events where kind='goal' and source_key=new.id::text) then return new; end if;
  -- Stable task order and a shared 30pt budget prevent splitting work to farm XP.
  for v_file in select t.*,coalesce(a.weight='large',false) as is_large
    from public.tasks t left join public.score_assessments a on a.kind='task' and a.source_id=t.id
    where t.goal_id=new.id and t.status='done' order by t.created_at,t.id
  loop
    perform public.score_award(v_file.owner_id,new.startup_id,'task',v_file.id::text,
      case when v_file.is_large then 15 else 5 end,v_file.title,new.id::text);
  end loop;
  -- Reward a real non-empty stored file only once, across versions/goals.
  if new.proof_snapshot->>'kind'='file' then
    for v_file in select f.* from public.startup_files f join storage.objects o
      on o.bucket_id='stage-files' and o.name=f.storage_path
      where f.startup_id=new.startup_id and f.storage_path=new.proof_snapshot#>>'{file,path}'
        and f.size_bytes>0 and coalesce((o.metadata->>'size')::bigint,0)>0
    loop
      perform public.score_award(v_file.uploaded_by,new.startup_id,'document',
        new.startup_id::text||':'||v_file.storage_path,10,v_file.name);
    end loop;
  end if;
  return new;
end $$;
revoke all on function public.score_work_completed() from public;
drop trigger if exists score_goal_completed on public.goals;
create trigger score_goal_completed after insert or update on public.goals
for each row execute function public.score_work_completed();
drop trigger if exists score_task_completed on public.tasks;
create trigger score_task_completed after insert or update on public.tasks
for each row execute function public.score_work_completed();

-- Match the existing stage engine's conditional-skip rule. Skips cannot earn XP.
create or replace function public.score_subpoint_skipped(p_stage uuid,p_subpoint uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select case
    when s.skip_when ? 'one_of' then exists(select 1 from jsonb_array_elements_text(s.skip_when->'one_of') v where v.value=a.value#>>'{}')
    when s.skip_when ? 'equals' then a.value=s.skip_when->'equals'
    else false end
  from public.stage_subpoints s left join public.stage_answers a
    on a.startup_stage_id=p_stage and a.answer_key=s.skip_when->>'answer_key'
  where s.id=p_subpoint),false);
$$;
revoke all on function public.score_subpoint_skipped(uuid,uuid) from public;

create or replace function public.score_point_completed()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_point uuid; v_startup uuid; v_key text; v_title text;
begin
  if not new.is_complete or auth.uid() is null then return new; end if;
  select s.point_id,ss.startup_id,t.key,p.title into v_point,v_startup,v_key,v_title
    from public.stage_subpoints s join public.stage_points p on p.id=s.point_id
    join public.stage_categories c on c.id=p.category_id
    join public.startup_stages ss on ss.id=new.startup_stage_id and ss.template_id=c.template_id
    join public.stage_templates t on t.id=ss.template_id
    where s.id=new.subpoint_id and (c.always_active or exists(
      select 1 from public.startup_categories sc where sc.startup_id=ss.startup_id and sc.category=c.key));
  if v_point is null then return new; end if;
  if not exists(select 1 from public.stage_subpoints s where s.point_id=v_point and not s.is_optional and not public.score_subpoint_skipped(new.startup_stage_id,s.id)) then return new; end if;
  if exists(select 1 from public.stage_subpoints s left join public.stage_subpoint_progress pr
    on pr.subpoint_id=s.id and pr.startup_stage_id=new.startup_stage_id
    where s.point_id=v_point and not s.is_optional and not public.score_subpoint_skipped(new.startup_stage_id,s.id) and not coalesce(pr.is_complete,false)) then return new; end if;
  -- Recheck the underlying answers/Goals, not only the writable progress row.
  if exists(select 1 from public.stage_subpoints s where s.point_id=v_point and not s.is_optional and not public.score_subpoint_skipped(new.startup_stage_id,s.id)
    and (not public.subpoint_goals_met(new.startup_stage_id,s.id) or exists(
      select 1 from public.stage_fields f left join public.stage_answers a
        on a.startup_stage_id=new.startup_stage_id and a.answer_key=f.answer_key
      where f.subpoint_id=s.id and f.is_required and (
        a.value is null or a.value in ('null'::jsonb,'""'::jsonb,'[]'::jsonb,'false'::jsonb)
        or a.value->>'skipped'='true'
      )
    ))) then return new; end if;
  perform public.score_award(auth.uid(),v_startup,'point',v_startup::text||':'||v_key||':'||v_point::text,25,v_title);
  return new;
end $$;
revoke all on function public.score_point_completed() from public;
drop trigger if exists score_point_completed on public.stage_subpoint_progress;
create trigger score_point_completed after insert or update on public.stage_subpoint_progress
for each row execute function public.score_point_completed();

create or replace function public.score_stage_completed()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_key text; v_title text;
begin
  if new.status<>'completed' or old.status='completed' or auth.uid() is null then return new; end if;
  select key,title into v_key,v_title from public.stage_templates where id=new.template_id and published_at is not null;
  if v_key is null then return new; end if;
  if not exists(select 1 from public.stage_closures where startup_stage_id=new.id and decision='continue' and closed_by=auth.uid()) then return new; end if;
  -- A stage bonus requires every active point to have earned a completion award.
  if not exists(select 1 from public.stage_points p join public.stage_categories c on c.id=p.category_id where c.template_id=new.template_id) then return new; end if;
  if not exists(select 1 from public.score_events where kind='point' and startup_id=new.startup_id and source_key like new.startup_id::text||':'||v_key||':%') then return new; end if;
  if exists(select 1 from public.stage_points p join public.stage_categories c on c.id=p.category_id
    where c.template_id=new.template_id and (c.always_active or exists(select 1 from public.startup_categories sc where sc.startup_id=new.startup_id and sc.category=c.key))
    and exists(select 1 from public.stage_subpoints s where s.point_id=p.id and not s.is_optional and not public.score_subpoint_skipped(new.id,s.id))
    and not exists(select 1 from public.score_events e where e.kind='point' and e.source_key=new.startup_id::text||':'||v_key||':'||p.id::text)) then return new; end if;
  perform public.score_award(auth.uid(),new.startup_id,'stage',new.startup_id::text||':'||v_key,150,v_title);
  return new;
end $$;
revoke all on function public.score_stage_completed() from public;
drop trigger if exists score_stage_completed on public.startup_stages;
create trigger score_stage_completed after update on public.startup_stages for each row execute function public.score_stage_completed();

-- A recipient acknowledges an actual substantial message. No self awards,
-- shared conversation required, one award/message, weekly pair limits.
create or replace function public.score_thank_message(p_message uuid,p_kind text)
returns void language plpgsql security definer set search_path=public as $$
declare v_message record; v_total integer;
begin
  if auth.uid() is null or p_kind not in ('feedback','help') then raise exception 'Nieprawidłowe potwierdzenie.'; end if;
  perform pg_advisory_xact_lock(226022);
  select * into v_message from public.messages where id=p_message;
  if v_message.id is null or v_message.sender_id=auth.uid() or char_length(trim(v_message.body))<80
    or not exists(select 1 from public.conversation_participants where conversation_id=v_message.conversation_id and profile_id=auth.uid()) then
    raise exception 'Możesz docenić otrzymaną, treściwą wiadomość.';
  end if;
  if exists(select 1 from public.score_events where source_key=p_message::text and track='reputation') then raise exception 'Ta wiadomość została już doceniona.'; end if;
  select coalesce(sum(points),0) into v_total from public.score_events where profile_id=v_message.sender_id and confirmed_by=auth.uid() and track='reputation' and created_at>now()-interval '7 days';
  if v_total+(case when p_kind='help' then 10 else 5 end)>10 then raise exception 'Limit: 10 punktów dla tej osoby w ciągu 7 dni.'; end if;
  if exists(select 1 from public.score_events where profile_id=auth.uid() and confirmed_by=v_message.sender_id and track='reputation' and created_at>now()-interval '7 days') then raise exception 'Wzajemna wymiana ocen nie daje punktów.'; end if;
  select coalesce(sum(points),0) into v_total from public.score_events where profile_id=v_message.sender_id and kind=p_kind and created_at >= (date_trunc('day',now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw');
  if v_total+(case when p_kind='help' then 10 else 5 end)>(case when p_kind='help' then 20 else 15 end) then raise exception 'Dzienny limit reputacji odbiorcy został osiągnięty.'; end if;
  perform public.score_award(v_message.sender_id,null,p_kind,p_message::text,
    case when p_kind='help' then 10 else 5 end,
    case when p_kind='help' then 'Potwierdzona pomoc' else 'Przydatny feedback' end,null,auth.uid());
end $$;
revoke all on function public.score_thank_message(uuid,text) from public;
grant execute on function public.score_thank_message(uuid,text) to authenticated;
create or replace function public.score_overview()
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'work',coalesce(sum(points) filter(where track='work'),0),
    'reputation',coalesce(sum(points) filter(where track='reputation'),0),
    'events',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select id,kind,points,track,label,created_at from public.score_events
      where profile_id=auth.uid() order by created_at desc,id desc limit 50
    ) r),'[]'::jsonb)
  ) from public.score_events where profile_id=auth.uid();
$$;
revoke all on function public.score_overview() from public;
grant execute on function public.score_overview() to authenticated;
create or replace function public.score_feedback_candidates()
returns table(id uuid,body text,sender_name text)
language sql stable security definer set search_path=public as $$
  select m.id,m.body,coalesce(p.full_name,'Użytkownik Vairo') from public.messages m
    join public.profiles p on p.id=m.sender_id
  where m.sender_id<>auth.uid() and char_length(trim(m.body))>=80
    and exists(select 1 from public.conversation_participants cp where cp.conversation_id=m.conversation_id and cp.profile_id=auth.uid())
    and not exists(select 1 from public.score_events e where e.track='reputation' and e.source_key=m.id::text)
  order by m.created_at desc,m.id desc limit 30;
$$;
revoke all on function public.score_feedback_candidates() from public;
grant execute on function public.score_feedback_candidates() to authenticated;
commit;

