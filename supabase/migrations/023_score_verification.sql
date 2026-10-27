-- SCORE v2: independent review, program-linked evidence, fair team pools,
-- durable daily-limit queue. Apply after 022. Existing entries stay auditable.
begin;

alter table public.score_events add column if not exists rules_version integer not null default 1;
alter table public.score_events drop constraint if exists score_events_kind_source_key_key;
create unique index if not exists score_events_source_version on public.score_events(kind,source_key,rules_version);

create table if not exists public.score_reviews (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.goals(id) on delete set null,
  startup_id uuid not null references public.startups(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  proof_snapshot jsonb not null,
  proof_key text not null,
  tasks_snapshot jsonb not null default '[]',
  note text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check(owner_id<>reviewer_id)
);
create unique index if not exists score_reviews_active on public.score_reviews(goal_id) where revoked_at is null;
create table if not exists public.score_proof_claims (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  proof_key text not null,
  goal_id uuid not null, -- retain deduplication even if the original goal is deleted
  primary key(profile_id,proof_key)
);
create table if not exists public.score_program_batches (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  startup_stage_id uuid not null references public.startup_stages(id) on delete cascade,
  point_id uuid references public.stage_points(id) on delete cascade,
  kind text not null check(kind in ('point','stage')),
  scope_key text not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique(startup_stage_id,kind,scope_key)
);
create table if not exists public.score_program_claims (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.score_program_batches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check(points>0),
  reviewer_id uuid references public.profiles(id),
  evidence_key text,
  note text,
  reviewed_at timestamptz,
  unique(batch_id,profile_id),
  check(reviewer_id is null or reviewer_id<>profile_id)
);
create table if not exists public.score_reward_queue (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete set null,
  kind text not null check(kind in ('goal','task','document','point','stage','help','feedback')),
  source_key text not null,
  parent_key text,
  points integer not null check(points>0),
  label text not null,
  confirmed_by uuid references public.profiles(id),
  review_id uuid references public.score_reviews(id) on delete cascade,
  program_claim_id uuid references public.score_program_claims(id) on delete cascade,
  state text not null default 'pending' check(state in ('pending','awarded','cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(kind,source_key)
);
create index if not exists score_queue_pending on public.score_reward_queue(profile_id,created_at,id) where state='pending';
create index if not exists score_queue_review on public.score_reward_queue(review_id);
create index if not exists score_queue_parent on public.score_reward_queue(kind,parent_key);

alter table public.score_reviews enable row level security;
alter table public.score_proof_claims enable row level security;
alter table public.score_program_batches enable row level security;
alter table public.score_program_claims enable row level security;
alter table public.score_reward_queue enable row level security;
revoke all on public.score_reviews,public.score_proof_claims,public.score_program_batches,public.score_program_claims,public.score_reward_queue from anon,authenticated;
grant select on public.score_reviews,public.score_program_batches,public.score_program_claims,public.score_reward_queue to authenticated;
drop policy if exists score_reviews_read on public.score_reviews;
create policy score_reviews_read on public.score_reviews for select to authenticated using(public.is_startup_member(startup_id));
drop policy if exists score_batches_read on public.score_program_batches;
create policy score_batches_read on public.score_program_batches for select to authenticated using(public.is_startup_member(startup_id));
drop policy if exists score_claims_read on public.score_program_claims;
create policy score_claims_read on public.score_program_claims for select to authenticated using(profile_id=auth.uid() or exists(select 1 from public.score_program_batches b where b.id=batch_id and public.can_edit_startup(b.startup_id)));
drop policy if exists score_queue_read on public.score_reward_queue;
create policy score_queue_read on public.score_reward_queue for select to authenticated using(profile_id=auth.uid());

-- A lexical floor is an anti-spam check, not a semantic quality guarantee.
create or replace function public.score_text_quality(p_text text,p_chars integer default 80,p_words integer default 12)
returns boolean language sql immutable set search_path=public as $$
  select coalesce(char_length(trim(p_text))>=p_chars
    and (select count(*)>=p_words and count(distinct token)>=least(p_words,6)
      from regexp_split_to_table(lower(regexp_replace(trim(p_text),'[^[:alnum:][:space:]]',' ','g')),'[[:space:]]+') token where char_length(token)>=2)
    and (select count(distinct c)>=8 from regexp_split_to_table(lower(p_text),'') c),false);
$$;
create or replace function public.score_proof_key(p_startup uuid,p_proof jsonb)
returns text language plpgsql stable security definer set search_path=public as $$
declare v_text text;
begin
  case p_proof->>'kind'
    when 'sentence','long_text' then
      v_text:=regexp_replace(lower(p_proof->>'text'),'[^[:alnum:]]','','g');
    when 'link' then v_text:=lower(trim(p_proof->>'url'));
    when 'file' then
      select coalesce(o.metadata->>'eTag',o.metadata->>'etag',o.name) into v_text
        from storage.objects o where o.bucket_id='stage-files' and o.name=p_proof#>>'{file,path}';
    when 'module_result' then v_text:=(p_proof-'captured_at'-'captured_by'-'workflow_id'-'ref_id'-'version'-'title')::text;
    else v_text:=(p_proof-'captured_at'-'captured_by')::text;
  end case;
  return md5(coalesce(v_text,''));
end $$;
create or replace function public.score_goal_eligible(p_goal uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select g.status='completed' and g.archived_at is null and g.owner_id is not null
    and exists(select 1 from public.startup_members m where m.startup_id=g.startup_id and m.profile_id=g.owner_id)
    and public.proof_matches(g.proof_requirement,g.proof_snapshot)
    and exists(select 1 from public.goal_condition_links l join public.startup_goal_conditions c on c.id=l.condition_id
      join public.startup_stages ss on ss.id=c.startup_stage_id and ss.startup_id=g.startup_id
      join public.stage_templates t on t.id=ss.template_id and t.published_at is not null
      join public.stage_goal_conditions tc on tc.id=c.template_condition_id and tc.subpoint_id=c.subpoint_id
      join public.stage_subpoints sp on sp.id=tc.subpoint_id join public.stage_points p on p.id=sp.point_id
      join public.stage_categories cat on cat.id=p.category_id and cat.template_id=ss.template_id
      where l.goal_id=g.id and c.startup_id=g.startup_id and c.goal_type_id=tc.goal_type_id
        and (tc.match_any_type or tc.goal_type_id=g.goal_type_id)
        and (tc.proof_kind is null or tc.proof_kind=g.proof_snapshot->>'kind'))
    and case g.proof_snapshot->>'kind'
      when 'sentence' then public.score_text_quality(g.proof_snapshot->>'text',40,8)
      when 'long_text' then public.score_text_quality(g.proof_snapshot->>'text',80,12)
      when 'link' then public.score_text_quality(g.proof_snapshot->>'note',40,8)
      when 'file' then exists(select 1 from public.startup_files f join storage.objects o on o.bucket_id='stage-files' and o.name=f.storage_path
        where f.startup_id=g.startup_id and f.storage_path=g.proof_snapshot#>>'{file,path}' and f.size_bytes>0 and coalesce((o.metadata->>'size')::bigint,0)>0)
      when 'module_result' then case when jsonb_typeof(g.proof_snapshot->'nodes')='array' then jsonb_array_length(g.proof_snapshot->'nodes')>0 else false end
      when 'goal_set' then case when jsonb_typeof(g.proof_snapshot->'goal_ids')='array' then jsonb_array_length(g.proof_snapshot->'goal_ids')>0 and not exists(
        select 1 from jsonb_array_elements_text(g.proof_snapshot->'goal_ids') child
        where not exists(select 1 from public.score_reviews r join public.goals cg on cg.id=r.goal_id
          where cg.id::text=child.value and cg.id<>g.id and cg.startup_id=g.startup_id and cg.status='completed' and cg.archived_at is null
            and r.revoked_at is null and r.proof_snapshot=cg.proof_snapshot and r.owner_id=cg.owner_id)) else false end
      when 'select' then true -- reviewer must still supply a substantial written assessment
      when 'scale' then true
      else false end
    from public.goals g where g.id=p_goal),false);
$$;
create or replace function public.score_goal_review_key(p_goal uuid)
returns text language sql stable security definer set search_path=public as $$
  select md5(jsonb_build_object('owner',g.owner_id,'proof',g.proof_snapshot,'proof_version',public.score_proof_key(g.startup_id,g.proof_snapshot),'status',g.status,'title',g.title,'archived',g.archived_at,
    'tasks',coalesce((select jsonb_agg(jsonb_build_array(t.id,t.owner_id,t.title,t.status) order by t.id) from public.tasks t where t.goal_id=g.id),'[]'))::text)
  from public.goals g where g.id=p_goal;
$$;

-- Re-evaluate real stage state; never infer completion from XP history.
create or replace function public.score_point_ready(p_stage uuid,p_point uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.stage_points p join public.stage_categories c on c.id=p.category_id
      join public.startup_stages ss on ss.template_id=c.template_id and ss.id=p_stage
      where p.id=p_point and (c.always_active or exists(select 1 from public.startup_categories sc where sc.startup_id=ss.startup_id and sc.category=c.key)))
    and exists(select 1 from public.stage_subpoints s where s.point_id=p_point and not s.is_optional and not public.score_subpoint_skipped(p_stage,s.id))
    and not exists(select 1 from public.stage_subpoints s left join public.stage_subpoint_progress pr on pr.startup_stage_id=p_stage and pr.subpoint_id=s.id
      where s.point_id=p_point and not s.is_optional and not public.score_subpoint_skipped(p_stage,s.id)
      and (not coalesce(pr.is_complete,false) or not public.subpoint_goals_met(p_stage,s.id) or exists(
        select 1 from public.stage_fields f left join public.stage_answers a on a.startup_stage_id=p_stage and a.answer_key=f.answer_key
        where f.subpoint_id=s.id and f.is_required and (a.value is null or a.value in ('null'::jsonb,'""'::jsonb,'[]'::jsonb,'false'::jsonb) or a.value->>'skipped'='true'))));
$$;
create or replace function public.score_stage_ready(p_stage uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.startup_stages ss join public.stage_templates t on t.id=ss.template_id
      where ss.id=p_stage and ss.status='completed' and t.published_at is not null
      and exists(select 1 from public.stage_closures cl where cl.startup_stage_id=ss.id and cl.decision='continue'))
    and exists(select 1 from public.stage_points p join public.stage_categories c on c.id=p.category_id
      join public.startup_stages ss on ss.template_id=c.template_id where ss.id=p_stage and public.score_point_ready(p_stage,p.id))
    and not exists(select 1 from public.stage_points p join public.stage_categories c on c.id=p.category_id
      join public.startup_stages ss on ss.template_id=c.template_id
      where ss.id=p_stage and (c.always_active or exists(select 1 from public.startup_categories sc where sc.startup_id=ss.startup_id and sc.category=c.key))
      and exists(select 1 from public.stage_subpoints s where s.point_id=p.id and not s.is_optional and not public.score_subpoint_skipped(p_stage,s.id))
      and not public.score_point_ready(p_stage,p.id));
$$;
create or replace function public.score_program_evidence(p_stage uuid,p_point uuid)
returns text language sql stable security definer set search_path=public as $$
  select md5(jsonb_build_object('answers',coalesce((
    select jsonb_agg(jsonb_build_array(a.answer_key,a.value) order by a.answer_key)
    from public.stage_answers a where a.startup_stage_id=p_stage and exists(
      select 1 from public.stage_fields f join public.stage_subpoints s on s.id=f.subpoint_id
      where f.answer_key=a.answer_key and (p_point is null or s.point_id=p_point))),'[]'),
    'goals',coalesce((select jsonb_agg(jsonb_build_array(g.id,g.status,g.owner_id,g.proof_snapshot,g.archived_at,public.score_proof_key(g.startup_id,g.proof_snapshot)) order by g.id)
      from public.goals g where exists(select 1 from public.goal_condition_links l join public.startup_goal_conditions c on c.id=l.condition_id
        join public.stage_subpoints s on s.id=c.subpoint_id where l.goal_id=g.id and c.startup_stage_id=p_stage and (p_point is null or s.point_id=p_point))),'[]'))::text);
$$;

-- Disable status-based awards. Status transitions merely invalidate stale reviews.
drop trigger if exists score_goal_completed on public.goals;
drop trigger if exists score_task_completed on public.tasks;
create or replace function public.score_invalidate_goal()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status<>'completed' or new.archived_at is not null or new.owner_id is distinct from old.owner_id or new.proof_snapshot is distinct from old.proof_snapshot then
    update public.score_reviews set revoked_at=now() where goal_id=new.id and revoked_at is null;
    update public.score_reward_queue q set state='cancelled',reason='Wynik zmieniony lub ponownie otwarty; potrzebna nowa akceptacja.'
      where q.state='pending' and q.review_id in(select id from public.score_reviews where goal_id=new.id and revoked_at is not null);
  end if;
  return new;
end $$;
drop trigger if exists score_review_invalidate on public.goals;
create trigger score_review_invalidate after update on public.goals for each row execute function public.score_invalidate_goal();

-- Existing self-assessments cannot grant a large award under the new policy.
update public.score_assessments a set weight='standard' where weight='large' and (
  (kind='goal' and exists(select 1 from public.goals g where g.id=a.source_id and g.owner_id=a.assessed_by)) or
  (kind='task' and exists(select 1 from public.tasks t where t.id=a.source_id and t.owner_id=a.assessed_by)));
create or replace function public.score_assess(p_kind text,p_source uuid,p_weight text)
returns void language plpgsql security definer set search_path=public as $$
declare v_startup uuid; v_status text; v_owner uuid;
begin
  if p_kind='goal' then select startup_id,status,owner_id into v_startup,v_status,v_owner from public.goals where id=p_source for update;
  elsif p_kind='task' then select startup_id,status,owner_id into v_startup,v_status,v_owner from public.tasks where id=p_source for update;
  else raise exception 'Nieprawidłowy rodzaj pracy.'; end if;
  if auth.uid() is null or v_startup is null or not public.can_edit_startup(v_startup) then raise exception 'Tylko Founder/Admin tego teamu może ustalić skalę.'; end if;
  if v_owner is null or v_owner=auth.uid() then raise exception 'Skalę własnej pracy musi zatwierdzić drugi Founder/Admin.'; end if;
  if v_status<>'todo' or exists(select 1 from public.score_assessments where kind=p_kind and source_id=p_source and frozen) then raise exception 'Skalę ustalasz przed rozpoczęciem pracy.'; end if;
  if p_weight is null or p_weight not in ('standard','large') then raise exception 'Nieprawidłowa skala.'; end if;
  insert into public.score_assessments(kind,source_id,startup_id,weight,assessed_by) values(p_kind,p_source,v_startup,p_weight,auth.uid())
  on conflict(kind,source_id) do update set weight=excluded.weight,assessed_by=excluded.assessed_by;
end $$;

-- A bounded pool is split equally over the team's membership at completion.
-- Each recipient's share requires another person's review. Personal program
-- scope keys span startups, so cloning startups cannot multiply bonuses.
create or replace function public.score_capture_program(p_stage uuid,p_point uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_startup uuid; v_scope text; v_kind text; v_label text; v_budget integer; v_batch uuid; v_count integer; r record;
begin
  select ss.startup_id,t.key,t.title into v_startup,v_scope,v_label from public.startup_stages ss join public.stage_templates t on t.id=ss.template_id and t.published_at is not null where ss.id=p_stage;
  if v_startup is null then return; end if;
  if p_point is null then
    if not public.score_stage_ready(p_stage) then return; end if;
    v_kind:='stage'; v_budget:=150;
  else
    if not public.score_point_ready(p_stage,p_point) then return; end if;
    select v_scope||':'||coalesce(p.shared_key,c.key||':'||p.key),p.title into v_scope,v_label from public.stage_points p join public.stage_categories c on c.id=p.category_id where p.id=p_point;
    v_kind:='point'; v_budget:=25;
  end if;
  insert into public.score_program_batches(startup_id,startup_stage_id,point_id,kind,scope_key,label)
    values(v_startup,p_stage,p_point,v_kind,v_scope,v_label)
    on conflict(startup_stage_id,kind,scope_key) do nothing returning id into v_batch;
  if v_batch is null then return; end if;
  select count(*) into v_count from public.startup_members where startup_id=v_startup;
  if v_count=0 then return; end if;
  for r in select profile_id,row_number() over(order by profile_id) n from public.startup_members where startup_id=v_startup loop
    if v_budget/v_count + (case when r.n<=v_budget%v_count then 1 else 0 end)>0 then
      insert into public.score_program_claims(batch_id,profile_id,points)
        values(v_batch,r.profile_id,v_budget/v_count+case when r.n<=v_budget%v_count then 1 else 0 end);
    end if;
  end loop;
end $$;
create or replace function public.score_point_completed()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_point uuid;
begin
  if new.is_complete then
    select point_id into v_point from public.stage_subpoints where id=new.subpoint_id;
    perform public.score_capture_program(new.startup_stage_id,v_point);
  end if;
  return new;
end $$;
create or replace function public.score_stage_completed()
returns trigger language plpgsql security definer set search_path=public as $$
declare r record;
begin
  if new.status='completed' and old.status<>'completed' and public.score_stage_ready(new.id) then
    -- Covers points completed before SCORE was deployed, without rewriting XP.
    for r in select p.id from public.stage_points p join public.stage_categories c on c.id=p.category_id where c.template_id=new.template_id loop
      perform public.score_capture_program(new.id,r.id);
    end loop;
    perform public.score_capture_program(new.id,null);
  end if;
  return new;
end $$;

create or replace function public.score_enqueue(p_user uuid,p_startup uuid,p_kind text,p_source text,p_points integer,p_label text,
  p_parent text default null,p_confirmer uuid default null,p_review uuid default null,p_program uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_user is null or p_points<=0 then return; end if;
  if exists(select 1 from public.score_events where kind=p_kind and source_key=p_source and rules_version=2) then return; end if;
  insert into public.score_reward_queue(profile_id,startup_id,kind,source_key,parent_key,points,label,confirmed_by,review_id,program_claim_id)
  values(p_user,p_startup,p_kind,p_source,p_parent,p_points,p_label,p_confirmer,p_review,p_program)
  on conflict(kind,source_key) do update set profile_id=excluded.profile_id,review_id=excluded.review_id,program_claim_id=excluded.program_claim_id,
    state='pending',reason=null,points=excluded.points,confirmed_by=excluded.confirmed_by
    where score_reward_queue.state='cancelled';
end $$;
create or replace function public.score_queue_valid(p_id uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare q public.score_reward_queue; r public.score_reviews; g public.goals; c record;
begin
  select * into q from public.score_reward_queue where id=p_id;
  if q.profile_id is null or q.confirmed_by is null or q.confirmed_by=q.profile_id then return false; end if;
  if q.startup_id is not null and not exists(select 1 from public.startup_members where startup_id=q.startup_id and profile_id=q.profile_id) then return false; end if;
  if q.review_id is not null then
    select * into r from public.score_reviews where id=q.review_id and revoked_at is null;
    if r.id is null then return false; end if;
    select * into g from public.goals where id=r.goal_id;
    if not public.score_goal_eligible(g.id) or g.owner_id<>r.owner_id or g.proof_snapshot is distinct from r.proof_snapshot or r.proof_key is distinct from public.score_proof_key(g.startup_id,g.proof_snapshot) then return false; end if;
    if q.kind='task' then return exists(select 1 from public.tasks t where t.id::text=q.source_key and t.goal_id=g.id and t.status='done' and t.owner_id=q.profile_id); end if;
    if q.kind='document' then return exists(select 1 from public.startup_files f join storage.objects o on o.bucket_id='stage-files' and o.name=f.storage_path
      where f.startup_id=g.startup_id and f.uploaded_by=q.profile_id and f.storage_path=g.proof_snapshot#>>'{file,path}' and f.size_bytes>0 and coalesce((o.metadata->>'size')::bigint,0)>0); end if;
    return q.kind='goal' and q.profile_id=r.owner_id;
  elsif q.program_claim_id is not null then
    select cl.*,b.startup_stage_id,b.point_id,b.kind as batch_kind into c from public.score_program_claims cl join public.score_program_batches b on b.id=cl.batch_id where cl.id=q.program_claim_id;
    return c.reviewed_at is not null and c.reviewer_id=q.confirmed_by and c.profile_id=q.profile_id
      and c.evidence_key=public.score_program_evidence(c.startup_stage_id,c.point_id)
      and case when c.batch_kind='point' then public.score_point_ready(c.startup_stage_id,c.point_id) else public.score_stage_ready(c.startup_stage_id) end;
  end if;
  return q.kind in ('help','feedback'); -- only the recipient RPC creates these
end $$;
create or replace function public.score_process_queue(p_user uuid)
returns void language plpgsql security definer set search_path=public as $$
declare q record; v_cap integer; v_sum integer; v_total integer; v_day timestamptz:=date_trunc('day',now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw';
begin
  if p_user is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('score:user:'||p_user::text,0));
  for q in select * from public.score_reward_queue where profile_id=p_user and state='pending' order by created_at,id for update loop
    if not public.score_queue_valid(q.id) then
      update public.score_reward_queue set state='cancelled',reason='Wynik lub właściciel zmieniony; potrzebna ponowna akceptacja.' where id=q.id;
      if q.review_id is not null then
        update public.score_reviews set revoked_at=now() where id=q.review_id and revoked_at is null;
        update public.score_reward_queue set state='cancelled',reason='Wynik zmieniony; potrzebna ponowna akceptacja.' where review_id=q.review_id and state='pending';
      end if;
      continue;
    end if;
    v_cap:=case q.kind when 'goal' then 200 when 'task' then 60 when 'document' then 30 when 'point' then 50 when 'stage' then 150 when 'help' then 20 else 15 end;
    select coalesce(sum(points),0) into v_sum from public.score_events where profile_id=p_user and kind=q.kind and rules_version=2 and created_at>=v_day;
    select coalesce(sum(points),0) into v_total from public.score_events where profile_id=p_user and track='work' and rules_version=2 and created_at>=v_day;
    if v_sum+q.points>v_cap or (q.kind not in ('help','feedback') and v_total+q.points>260) then
      update public.score_reward_queue set reason='Dzienny limit — punkty czekają na kolejny dzień.' where id=q.id;
      continue;
    end if;
    insert into public.score_events(profile_id,startup_id,kind,source_key,parent_key,points,track,label,confirmed_by,rules_version)
      values(q.profile_id,q.startup_id,q.kind,q.source_key,q.parent_key,q.points,
        case when q.kind in ('help','feedback') then 'reputation' else 'work' end,q.label,q.confirmed_by,2)
      on conflict(kind,source_key,rules_version) do nothing;
    update public.score_reward_queue set state='awarded',processed_at=now(),reason=null where id=q.id;
  end loop;
end $$;

drop function if exists public.score_review_goal(uuid,text);
create or replace function public.score_review_goal(p_goal uuid,p_note text,p_expected text)
returns void language plpgsql security definer set search_path=public as $$
declare g public.goals; r record; v_review uuid; v_key text; v_existing uuid; v_weight text; v_budget integer:=30; v_points integer;
begin
  select * into g from public.goals where id=p_goal for update;
  if auth.uid() is null or g.id is null or not public.can_edit_startup(g.startup_id) then raise exception 'Akceptacji dokonuje Founder/Admin tego teamu.'; end if;
  if g.owner_id=auth.uid() then raise exception 'Własny wynik musi zaakceptować inny Founder/Admin.'; end if;
  perform 1 from public.tasks where goal_id=g.id order by id for update;
  if p_expected is null or p_expected is distinct from public.score_goal_review_key(g.id) then raise exception 'Dowód lub zadania zmieniły się od otwarcia formularza. Odśwież i sprawdź aktualny wynik.'; end if;
  if not public.score_goal_eligible(g.id) then raise exception 'Cel wymaga jawnego powiązania z programem i treściwego, poprawnego dowodu. Zdanie: min. 40 znaków i 8 słów; długi tekst: 80 znaków i 12 słów.'; end if;
  if not public.score_text_quality(p_note,80,12) then raise exception 'Opisz sprawdzony rezultat: minimum 80 znaków, 12 słów i różnorodne słownictwo.'; end if;
  -- Review must be independent for every person receiving this bundle.
  if exists(select 1 from public.tasks where goal_id=g.id and status='done' and owner_id=auth.uid())
    or exists(select 1 from public.startup_files where startup_id=g.startup_id and storage_path=g.proof_snapshot#>>'{file,path}' and uploaded_by=auth.uid()) then
    raise exception 'Recenzent nie może być beneficjentem zadań ani pliku w tym wyniku. Poproś inną osobę.';
  end if;
  v_key:=public.score_proof_key(g.startup_id,g.proof_snapshot);
  insert into public.score_proof_claims(profile_id,proof_key,goal_id) values(g.owner_id,v_key,g.id) on conflict do nothing;
  select goal_id into v_existing from public.score_proof_claims where profile_id=g.owner_id and proof_key=v_key;
  if v_existing<>g.id then raise exception 'Ten dowód został już wykorzystany do punktacji innego celu — także w innym teamie.'; end if;
  update public.score_reward_queue set state='cancelled',reason='Poprzednia akceptacja zastąpiona nową.'
    where state='pending' and review_id in(select id from public.score_reviews where goal_id=g.id and revoked_at is null);
  update public.score_reviews set revoked_at=now() where goal_id=g.id and revoked_at is null;
  insert into public.score_reviews(goal_id,startup_id,owner_id,reviewer_id,proof_snapshot,proof_key,note,tasks_snapshot)
    values(g.id,g.startup_id,g.owner_id,auth.uid(),g.proof_snapshot,v_key,trim(p_note),coalesce((select jsonb_agg(jsonb_build_object('id',id,'owner_id',owner_id) order by created_at,id) from public.tasks where goal_id=g.id and status='done'),'[]')) returning id into v_review;
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
drop function if exists public.score_review_program(uuid,text);
create or replace function public.score_review_program(p_claim uuid,p_note text,p_expected text)
returns void language plpgsql security definer set search_path=public as $$
declare c record;
begin
  select cl.*,b.startup_id,b.startup_stage_id,b.point_id,b.kind,b.scope_key,b.label into c from public.score_program_claims cl join public.score_program_batches b on b.id=cl.batch_id where cl.id=p_claim for update of cl;
  if auth.uid() is null or c.id is null or not public.can_edit_startup(c.startup_id) then raise exception 'Akceptacji dokonuje Founder/Admin tego teamu.'; end if;
  if c.profile_id=auth.uid() then raise exception 'Nie możesz zaakceptować własnej części bonusu.'; end if;
  if p_expected is null or p_expected is distinct from public.score_program_evidence(c.startup_stage_id,c.point_id) then raise exception 'Odpowiedzi lub dowody programu zmieniły się. Odśwież i sprawdź aktualny wynik.'; end if;
  if not public.score_text_quality(p_note,80,12) then raise exception 'Opisz sprawdzone wyniki: minimum 80 znaków i 12 słów.'; end if;
  if not(case when c.kind='point' then public.score_point_ready(c.startup_stage_id,c.point_id) else public.score_stage_ready(c.startup_stage_id) end) then raise exception 'Wymagania programu nie są już spełnione.'; end if;
  update public.score_program_claims set reviewer_id=auth.uid(),note=trim(p_note),reviewed_at=now(),evidence_key=public.score_program_evidence(c.startup_stage_id,c.point_id) where id=c.id;
  perform public.score_enqueue(c.profile_id,c.startup_id,c.kind,c.profile_id::text||':'||c.scope_key,c.points,c.label,null,auth.uid(),null,c.id);
  perform public.score_process_queue(c.profile_id);
end $$;

-- Social: recipient acknowledgement plus lexical anti-spam. No global lock.
create or replace function public.score_thank_message(p_message uuid,p_kind text)
returns void language plpgsql security definer set search_path=public as $$
declare m public.messages; v_sum integer;
begin
  select * into m from public.messages where id=p_message;
  if auth.uid() is null or p_kind is null or p_kind not in ('help','feedback') or m.id is null or m.sender_id=auth.uid()
    or not public.score_text_quality(m.body,80,12) or not exists(select 1 from public.conversation_participants where conversation_id=m.conversation_id and profile_id=auth.uid()) then
    raise exception 'Możesz docenić otrzymaną, treściwą wiadomość: minimum 80 znaków i 12 słów. Powtarzane znaki nie wystarczą.';
  end if;
  -- Ordered pair locks serialize reciprocal attempts without blocking other users.
  perform pg_advisory_xact_lock(hashtextextended('score:pair:'||least(auth.uid(),m.sender_id)::text||':'||greatest(auth.uid(),m.sender_id)::text,0));
  if exists(select 1 from public.score_reward_queue where source_key=p_message::text and kind in ('help','feedback')) then raise exception 'Ta wiadomość została już doceniona.'; end if;
  select coalesce(sum(points),0) into v_sum from public.score_reward_queue where profile_id=m.sender_id and confirmed_by=auth.uid() and kind in ('help','feedback') and state<>'cancelled' and created_at>now()-interval '7 days';
  if v_sum+(case when p_kind='help' then 10 else 5 end)>10 then raise exception 'Limit: 10 punktów dla tej osoby w ciągu 7 dni.'; end if;
  if exists(select 1 from public.score_reward_queue where profile_id=auth.uid() and confirmed_by=m.sender_id and kind in ('help','feedback') and state<>'cancelled' and created_at>now()-interval '7 days') then raise exception 'Wzajemna wymiana ocen nie daje punktów.'; end if;
  perform public.score_enqueue(m.sender_id,null,p_kind,m.id::text,case when p_kind='help' then 10 else 5 end,
    case when p_kind='help' then 'Potwierdzona pomoc' else 'Przydatny feedback' end,null,auth.uid());
  perform public.score_process_queue(m.sender_id);
end $$;
create or replace function public.score_feedback_candidates()
returns table(id uuid,body text,sender_name text) language sql stable security definer set search_path=public as $$
  select m.id,m.body,coalesce(p.full_name,'Użytkownik Vairo') from public.messages m join public.profiles p on p.id=m.sender_id
  where m.sender_id<>auth.uid() and public.score_text_quality(m.body,80,12)
    and exists(select 1 from public.conversation_participants cp where cp.conversation_id=m.conversation_id and cp.profile_id=auth.uid())
    and not exists(select 1 from public.score_reward_queue q where q.source_key=m.id::text and q.kind in ('help','feedback'))
  order by m.created_at desc,m.id desc limit 30;
$$;

create or replace function public.score_review_candidates(p_startup uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('goals',coalesce((select jsonb_agg(to_jsonb(r)) from (
    select g.id,g.title,g.owner_id,p.full_name as owner_name,g.proof_snapshot,public.score_goal_eligible(g.id) as eligible,public.score_goal_review_key(g.id) as review_key,
      coalesce((select jsonb_agg(jsonb_build_object('title',t.title,'owner_name',tp.full_name) order by t.created_at,t.id)
        from public.tasks t left join public.profiles tp on tp.id=t.owner_id where t.goal_id=g.id and t.status='done'),'[]') as tasks
    from public.goals g join public.profiles p on p.id=g.owner_id
    where public.can_edit_startup(p_startup) and g.startup_id=p_startup and g.status='completed' and g.archived_at is null and g.owner_id<>auth.uid()
      and not exists(select 1 from public.score_reviews sr where sr.goal_id=g.id and sr.revoked_at is null)
    order by g.created_at,g.id limit 50) r),'[]'),
    'program',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select c.id,c.points,c.profile_id,p.full_name as owner_name,b.label,b.kind,b.startup_stage_id,b.point_id,t.key as stage_key,public.score_program_evidence(b.startup_stage_id,b.point_id) as review_key
      from public.score_program_claims c join public.score_program_batches b on b.id=c.batch_id join public.profiles p on p.id=c.profile_id
        join public.startup_stages ss on ss.id=b.startup_stage_id join public.stage_templates t on t.id=ss.template_id
      where public.can_edit_startup(p_startup) and b.startup_id=p_startup and c.profile_id<>auth.uid()
        and not exists(select 1 from public.score_reward_queue q where q.kind=b.kind and q.source_key=c.profile_id::text||':'||b.scope_key and q.state in ('pending','awarded'))
      order by b.created_at,c.id limit 50) r),'[]'));
$$;
create or replace function public.score_overview()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
  perform public.score_process_queue(auth.uid());
  select jsonb_build_object('rules_version',2,'work',coalesce(sum(points) filter(where track='work' and rules_version=2),0),
    'reputation',coalesce(sum(points) filter(where track='reputation' and rules_version=2),0),
    'legacy',coalesce(sum(points) filter(where rules_version=1),0),
    'pending',coalesce((select sum(points) from public.score_reward_queue where profile_id=auth.uid() and state='pending'),0),
    'queue',coalesce((select jsonb_agg(to_jsonb(r)) from(select id,label,points,state,reason,created_at from public.score_reward_queue where profile_id=auth.uid() and state<>'awarded' order by created_at,id limit 50) r),'[]'),
    'awaiting_review',coalesce((select jsonb_agg(to_jsonb(r)) from(
      select g.id,g.title as label,case when public.score_goal_eligible(g.id) then 'Wynik czeka na drugiego Foundera/Admina.' else 'Potrzebny treściwy proof i jawne powiązanie z programem.' end as reason
      from public.goals g where g.owner_id=auth.uid() and g.status='completed' and g.archived_at is null and not exists(select 1 from public.score_reviews r where r.goal_id=g.id and r.revoked_at is null)
      union all
      select c.id,b.label,'Twoja część bonusu czeka na drugiego Foundera/Admina.' from public.score_program_claims c join public.score_program_batches b on b.id=c.batch_id
      where c.profile_id=auth.uid() and not exists(select 1 from public.score_reward_queue q where q.kind=b.kind and q.source_key=c.profile_id::text||':'||b.scope_key and q.state in ('pending','awarded'))
      limit 50) r),'[]'),
    'events',coalesce((select jsonb_agg(to_jsonb(r)) from(select id,kind,points,track,label,created_at from public.score_events where profile_id=auth.uid() and rules_version=2 order by created_at desc,id desc limit 50) r),'[]'))
    into v_result from public.score_events where profile_id=auth.uid();
  return v_result;
end $$;

-- Can be called by a service worker/cron. Opening SCORE also settles the user's
-- due queue, so no re-opening or re-completing goals is needed after a limit.
create or replace function public.score_flush_due_rewards()
returns void language plpgsql security definer set search_path=public as $$
declare r record;
begin
  for r in select distinct profile_id from public.score_reward_queue where state='pending' order by profile_id loop
    perform public.score_process_queue(r.profile_id);
  end loop;
end $$;

-- Retire the old award helper, including accidental calls by old integrations.
create or replace function public.score_award(p_user uuid,p_startup uuid,p_kind text,p_source text,p_points integer,p_label text,p_parent text default null,p_confirmer uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin raise exception 'SCORE wymaga niezależnej akceptacji wyniku (zasady v2).'; end $$;

revoke all on function public.score_text_quality(text,integer,integer),public.score_proof_key(uuid,jsonb),public.score_goal_eligible(uuid),public.score_goal_review_key(uuid),
  public.score_point_ready(uuid,uuid),public.score_stage_ready(uuid),public.score_program_evidence(uuid,uuid),public.score_capture_program(uuid,uuid),
  public.score_invalidate_goal(),public.score_enqueue(uuid,uuid,text,text,integer,text,text,uuid,uuid,uuid),public.score_queue_valid(uuid),
  public.score_process_queue(uuid),public.score_flush_due_rewards(),public.score_award(uuid,uuid,text,text,integer,text,text,uuid) from public,anon,authenticated;
revoke all on function public.score_assess(text,uuid,text),public.score_review_goal(uuid,text,text),public.score_review_program(uuid,text,text),
  public.score_thank_message(uuid,text),public.score_feedback_candidates(),public.score_review_candidates(uuid),public.score_overview() from public,anon;
grant execute on function public.score_assess(text,uuid,text),public.score_review_goal(uuid,text,text),public.score_review_program(uuid,text,text),
  public.score_thank_message(uuid,text),public.score_feedback_candidates(),public.score_review_candidates(uuid),public.score_overview() to authenticated;
-- service_role exists on Supabase; keep the migration portable for local tests.
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.score_flush_due_rewards() to service_role; end if; end $$;
commit;
