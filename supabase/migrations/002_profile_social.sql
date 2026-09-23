-- ============================================================================
-- 002 · Profil społeczny: skille, avatar, headline, weekly focus
-- ----------------------------------------------------------------------------
-- Zastępuje supabase/profile_social.sql (NIE odpalaj tamtego — ma rekurencję
-- RLS w politykach teamów i złe nazewnictwo).
--
-- Czego tu celowo NIE MA: teams / team_members. Startupy wchodzą w 003.
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Skrypt jest idempotentny, można odpalić ponownie.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Nowe kolumny profilu
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists headline text,
  add column if not exists weekly_focus text,
  add column if not exists weekly_focus_updated_at timestamptz,
  add column if not exists is_discoverable boolean not null default true;

comment on column public.profiles.headline is
  'Jednolinijkowy opis, np. "Full-stack Developer". Widoczny publicznie.';
comment on column public.profiles.weekly_focus is
  'Nad czym pracuję / czego szukam teraz. Główny element karty w Discover.';
comment on column public.profiles.is_discoverable is
  'false = user znika z discovery. Kontrola prywatności po stronie usera.';

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

-- Data aktualizacji focusu ustawia się sama — potrzebna, żeby przypominać
-- o odświeżeniu i sortować discovery po świeżości.
create or replace function public.touch_weekly_focus()
returns trigger
language plpgsql
as $$
begin
  if new.weekly_focus is distinct from old.weekly_focus then
    new.weekly_focus_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_touch_weekly_focus on public.profiles;
create trigger profiles_touch_weekly_focus
  before update on public.profiles
  for each row
  execute function public.touch_weekly_focus();

-- ---------------------------------------------------------------------------
-- 2. Katalog umiejętności
-- ---------------------------------------------------------------------------

create table if not exists public.skills (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  is_suggested boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint skills_label_len check (char_length(trim(label)) between 1 and 48),
  constraint skills_slug_len  check (char_length(slug) between 1 and 64)
);

create index if not exists skills_label_lower_idx on public.skills (lower(label));
create index if not exists skills_suggested_idx on public.skills (is_suggested)
  where is_suggested;

alter table public.skills enable row level security;

drop policy if exists "skills_select_all" on public.skills;
create policy "skills_select_all"
  on public.skills for select to authenticated using (true);

-- User może dodać własny skill, ale nie może go oznaczyć jako sugerowany.
drop policy if exists "skills_insert_own_custom" on public.skills;
create policy "skills_insert_own_custom"
  on public.skills for insert to authenticated
  with check (auth.uid() = created_by and is_suggested = false);

-- ---------------------------------------------------------------------------
-- 3. Profil ↔ umiejętności
-- ---------------------------------------------------------------------------

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id   uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create index if not exists profile_skills_skill_id_idx
  on public.profile_skills (skill_id);

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

-- Uwaga: SELECT jest na razie tylko na własnym wierszu. Odczyt cudzych skilli
-- dla Discover dojdzie w 007 razem z widokiem public_profiles.

-- ---------------------------------------------------------------------------
-- 4. Seed sugerowanych umiejętności
-- ---------------------------------------------------------------------------

insert into public.skills (slug, label, is_suggested, created_by)
values
  ('react',       'React',        true, null),
  ('typescript',  'TypeScript',   true, null),
  ('python',      'Python',       true, null),
  ('sql',         'SQL',          true, null),
  ('ui-design',   'UI Design',    true, null),
  ('figma',       'Figma',        true, null),
  ('marketing',   'Marketing',    true, null),
  ('seo',         'SEO',          true, null),
  ('copywriting', 'Copywriting',  true, null),
  ('sales',       'Sales',        true, null),
  ('product',     'Product',      true, null),
  ('excel',       'Excel',        true, null)
on conflict (slug) do update
set label = excluded.label, is_suggested = true;

-- ---------------------------------------------------------------------------
-- 5. Storage: bucket na avatary
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  -- 15 MB: w Social zdjęcie profilowe jest najważniejszym elementem karty,
  -- więc nie zmuszamy nikogo do kompresowania fotki z telefonu.
  'avatars', 'avatars', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Ścieżka musi zaczynać się od uid właściciela: <uid>/avatar.jpg
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

-- ---------------------------------------------------------------------------
-- 6. Weryfikacja — powinno zwrócić 5 wierszy
-- ---------------------------------------------------------------------------

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'avatar_url', 'headline', 'weekly_focus',
    'weekly_focus_updated_at', 'is_discoverable'
  );
