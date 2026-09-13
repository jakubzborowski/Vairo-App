-- Vairo profiles + onboarding (mandatory, no skip)
-- Flow: name → idea → tags → done
-- Run in Supabase SQL Editor (or via CLI migration).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(trim(input)), '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- Tags catalog (suggested pills + user-created)
-- ---------------------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  is_suggested boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint tags_label_len check (char_length(trim(label)) between 1 and 48),
  constraint tags_slug_len check (char_length(slug) between 1 and 64)
);

create index if not exists tags_label_lower_idx on public.tags (lower(label));
create index if not exists tags_suggested_idx on public.tags (is_suggested) where is_suggested;

alter table public.tags enable row level security;

drop policy if exists "tags_select_all" on public.tags;
create policy "tags_select_all"
  on public.tags
  for select
  to authenticated
  using (true);

-- Authenticated users may create custom tags (not suggested system pills).
drop policy if exists "tags_insert_own_custom" on public.tags;
create policy "tags_insert_own_custom"
  on public.tags
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and is_suggested = false
  );

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  idea_description text,
  onboarding_step text not null default 'name',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path from earlier display_name-only schema
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists idea_description text,
  add column if not exists onboarding_step text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.profiles
set
  onboarding_step = coalesce(onboarding_step, 'name'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.profiles
  alter column onboarding_step set default 'name',
  alter column onboarding_step set not null,
  alter column created_at set default now(),
  alter column updated_at set default now(),
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'display_name'
  ) then
    update public.profiles
    set full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(display_name), ''))
    where full_name is null;
  end if;
end;
$$;

alter table public.profiles drop constraint if exists profiles_onboarding_step_valid;
alter table public.profiles
  add constraint profiles_onboarding_step_valid check (
    onboarding_step in ('name', 'idea', 'tags', 'done')
  );

alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles
  add constraint profiles_full_name_len check (
    full_name is null
    or char_length(trim(full_name)) between 2 and 120
  );

alter table public.profiles drop constraint if exists profiles_idea_len;
alter table public.profiles
  add constraint profiles_idea_len check (
    idea_description is null
    or char_length(trim(idea_description)) between 3 and 2000
  );

-- Completing onboarding is all-or-nothing: name + idea + step done.
-- Tag count is enforced by trigger (needs join).
alter table public.profiles drop constraint if exists profiles_completed_requires_fields;
alter table public.profiles
  add constraint profiles_completed_requires_fields check (
    onboarding_completed_at is null
    or (
      onboarding_step = 'done'
      and full_name is not null
      and char_length(trim(full_name)) >= 2
      and idea_description is not null
      and char_length(trim(idea_description)) >= 3
    )
  );

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow upsert for users whose trigger row is missing (legacy / race).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Bootstraps a profile for the current auth user (bypasses RLS safely).
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, email, onboarding_step)
  values (
    uid,
    (select email from auth.users where id = uid),
    'name'
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email)
  returning * into result;

  if result.id is null then
    select * into result from public.profiles where id = uid;
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Profile ↔ tags (many-to-many)
-- ---------------------------------------------------------------------------

create table if not exists public.profile_tags (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, tag_id)
);

create index if not exists profile_tags_tag_id_idx on public.profile_tags (tag_id);

alter table public.profile_tags enable row level security;

drop policy if exists "profile_tags_select_own" on public.profile_tags;
create policy "profile_tags_select_own"
  on public.profile_tags
  for select
  to authenticated
  using (auth.uid() = profile_id);

drop policy if exists "profile_tags_insert_own" on public.profile_tags;
create policy "profile_tags_insert_own"
  on public.profile_tags
  for insert
  to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "profile_tags_delete_own" on public.profile_tags;
create policy "profile_tags_delete_own"
  on public.profile_tags
  for delete
  to authenticated
  using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Completing onboarding requires ≥1 tag (no skip)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_onboarding_complete()
returns trigger
language plpgsql
as $$
declare
  tag_count integer;
begin
  if new.onboarding_completed_at is not null
     and (
       tg_op = 'INSERT'
       or old.onboarding_completed_at is distinct from new.onboarding_completed_at
       or old.onboarding_step is distinct from new.onboarding_step
     )
  then
    select count(*)::integer into tag_count
    from public.profile_tags
    where profile_id = new.id;

    if tag_count < 1 then
      raise exception 'onboarding_requires_at_least_one_tag'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_onboarding_complete on public.profiles;
create trigger profiles_enforce_onboarding_complete
  before insert or update on public.profiles
  for each row
  execute function public.enforce_onboarding_complete();

-- ---------------------------------------------------------------------------
-- Auto-create empty profile on signup (incomplete → must finish onboarding)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, onboarding_step)
  values (
    new.id,
    new.email,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    'name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Convenience view for app: profile + whether onboarding is done
create or replace view public.profile_onboarding_status
with (security_invoker = true)
as
select
  p.id,
  p.email,
  p.full_name,
  p.idea_description,
  p.onboarding_step,
  p.onboarding_completed_at,
  (p.onboarding_completed_at is not null) as is_complete,
  coalesce(
    (
      select count(*)::integer
      from public.profile_tags pt
      where pt.profile_id = p.id
    ),
    0
  ) as tag_count
from public.profiles p;

-- ---------------------------------------------------------------------------
-- Seed suggested area tags (from onboarding design)
-- ---------------------------------------------------------------------------

insert into public.tags (slug, label, is_suggested, created_by)
values
  ('b2b', 'B2B', true, null),
  ('saas', 'SaaS', true, null),
  ('ai', 'AI', true, null),
  ('courses', 'Courses', true, null),
  ('dropshipping', 'Dropshipping', true, null)
on conflict (slug) do update
set
  label = excluded.label,
  is_suggested = true;

-- Optional search examples from design (available via autocomplete, not pills)
insert into public.tags (slug, label, is_suggested, created_by)
values
  ('anti-virus', 'Anti-virus', false, null),
  ('anti-plagiarism', 'Anti-plagiarism', false, null),
  ('anti-scam', 'Anti-scam', false, null),
  ('anti-theft', 'Anti-theft', false, null),
  ('anti-abuse', 'Anti-abuse', false, null),
  ('anti-bot', 'Anti-bot', false, null)
on conflict (slug) do nothing;
