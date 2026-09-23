-- ############################################################################
-- ##  NIE URUCHAMIAĆ — plik zastąpiony.                                     ##
-- ##                                                                        ##
-- ##  Zamiast tego odpal:  supabase/migrations/002_profile_social.sql        ##
-- ##                                                                        ##
-- ##  Powody wycofania:                                                     ##
-- ##  1. Polityki RLS na `teams` i `team_members` odwołują się wzajemnie,    ##
-- ##     co daje `42P17 infinite recursion detected in policy`.             ##
-- ##  2. `teams` to w rzeczywistości startup/workspace — wchodzi w 003       ##
-- ##     pod nazwą `startups` razem z rolami i limitem 3 na konto.          ##
-- ##                                                                        ##
-- ##  Zostawiony tylko jako referencja. Do usunięcia po migracji 003.        ##
-- ############################################################################

-- Profile social extensions: skills, avatar, weekly focus, teams
-- Run in Supabase SQL Editor after profiles.sql

-- ---------------------------------------------------------------------------
-- Profile fields
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists headline text,
  add column if not exists weekly_focus text;

alter table public.profiles drop constraint if exists profiles_headline_len;
alter table public.profiles
  add constraint profiles_headline_len check (
    headline is null or char_length(trim(headline)) between 1 and 120
  );

alter table public.profiles drop constraint if exists profiles_weekly_focus_len;
alter table public.profiles
  add constraint profiles_weekly_focus_len check (
    weekly_focus is null or char_length(trim(weekly_focus)) between 1 and 2000
  );

-- ---------------------------------------------------------------------------
-- Hard skills catalog + profile_skills
-- ---------------------------------------------------------------------------

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  is_suggested boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint skills_label_len check (char_length(trim(label)) between 1 and 48),
  constraint skills_slug_len check (char_length(slug) between 1 and 64)
);

create index if not exists skills_label_lower_idx on public.skills (lower(label));

alter table public.skills enable row level security;

drop policy if exists "skills_select_all" on public.skills;
create policy "skills_select_all"
  on public.skills for select to authenticated using (true);

drop policy if exists "skills_insert_own_custom" on public.skills;
create policy "skills_insert_own_custom"
  on public.skills for insert to authenticated
  with check (auth.uid() = created_by and is_suggested = false);

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create index if not exists profile_skills_skill_id_idx on public.profile_skills (skill_id);

alter table public.profile_skills enable row level security;

drop policy if exists "profile_skills_select_own" on public.profile_skills;
create policy "profile_skills_select_own"
  on public.profile_skills for select to authenticated
  using (auth.uid() = profile_id);

drop policy if exists "profile_skills_insert_own" on public.profile_skills;
create policy "profile_skills_insert_own"
  on public.profile_skills for insert to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "profile_skills_delete_own" on public.profile_skills;
create policy "profile_skills_delete_own"
  on public.profile_skills for delete to authenticated
  using (auth.uid() = profile_id);

insert into public.skills (slug, label, is_suggested, created_by)
values
  ('react', 'React', true, null),
  ('marketing', 'Marketing', true, null),
  ('sql', 'SQL', true, null),
  ('python', 'Python', true, null),
  ('excel', 'Excel', true, null),
  ('seo', 'SEO', true, null),
  ('figma', 'Figma', true, null),
  ('copywriting', 'Copywriting', true, null),
  ('typescript', 'TypeScript', true, null),
  ('ui-design', 'UI Design', true, null),
  ('product', 'Product', true, null),
  ('sales', 'Sales', true, null)
on conflict (slug) do update
set label = excluded.label, is_suggested = true;

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_len check (char_length(trim(name)) between 2 and 80),
  constraint teams_description_len check (
    description is null or char_length(trim(description)) between 1 and 1000
  )
);

create index if not exists teams_owner_id_idx on public.teams (owner_id);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row
  execute function public.set_updated_at();

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (team_id, profile_id),
  constraint team_members_role_valid check (role in ('owner', 'member'))
);

create index if not exists team_members_profile_id_idx on public.team_members (profile_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member"
  on public.teams for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.profile_id = auth.uid()
    )
  );

drop policy if exists "teams_insert_own" on public.teams;
create policy "teams_insert_own"
  on public.teams for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "teams_update_owner" on public.teams;
create policy "teams_update_owner"
  on public.teams for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "teams_delete_owner" on public.teams;
create policy "teams_delete_owner"
  on public.teams for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "team_members_select_member" on public.team_members;
create policy "team_members_select_member"
  on public.team_members for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id and t.owner_id = auth.uid()
    )
  );

drop policy if exists "team_members_insert_owner" on public.team_members;
create policy "team_members_insert_owner"
  on public.team_members for insert to authenticated
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.owner_id = auth.uid()
    )
    or (profile_id = auth.uid() and role = 'owner')
  );

drop policy if exists "team_members_delete_owner" on public.team_members;
create policy "team_members_delete_owner"
  on public.team_members for delete to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_members.team_id and t.owner_id = auth.uid()
    )
  );

-- Auto-add owner as team member
create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, profile_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_team_created on public.teams;
create trigger on_team_created
  after insert on public.teams
  for each row
  execute function public.handle_new_team();

-- ---------------------------------------------------------------------------
-- Avatars storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
