-- ============================================================================
-- 003 · Startup jako obiekt + ścieżki wejścia
-- ----------------------------------------------------------------------------
-- Wprowadza:
--   • profiles.onboarding_path — joiner | founder_idea | founder_no_idea
--   • startups + startup_members (role, limit 3, ochrona ostatniego Foundera)
--   • startup_categories (walidacyjne) osobno od industry_tags (branżowe)
--   • helpery RLS security definer — przerywają rekurencję polityk
--
-- Odpal PO 002. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profil: ścieżka wejścia + poluzowanie reguł onboardingu
-- ---------------------------------------------------------------------------
-- Pomysł i tagi przenoszą się z profilu na startup, więc warunki domknięcia
-- onboardingu nie mogą ich już wymagać. Joiner kończy na samym imieniu.

alter table public.profiles
  add column if not exists onboarding_path text;

alter table public.profiles drop constraint if exists profiles_onboarding_path_valid;
alter table public.profiles
  add constraint profiles_onboarding_path_valid check (
    onboarding_path is null
    or onboarding_path in ('joiner', 'founder_idea', 'founder_no_idea')
  );

-- Nowy zestaw kroków: path → name → idea → categories → done
alter table public.profiles drop constraint if exists profiles_onboarding_step_valid;
alter table public.profiles
  add constraint profiles_onboarding_step_valid check (
    onboarding_step in ('path', 'name', 'idea', 'tags', 'categories', 'done')
  );

-- Domknięcie onboardingu wymaga już tylko imienia i nazwiska.
alter table public.profiles drop constraint if exists profiles_completed_requires_fields;
alter table public.profiles
  add constraint profiles_completed_requires_fields check (
    onboarding_completed_at is null
    or (
      onboarding_step = 'done'
      and full_name is not null
      and char_length(trim(full_name)) >= 2
    )
  );

-- Wymóg ≥1 tagu przestaje obowiązywać — tagi opisują startup, nie osobę.
create or replace function public.enforce_onboarding_complete()
returns trigger
language plpgsql
as $$
begin
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Tagi branżowe — rename, żeby nazwa mówiła prawdę
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'tags')
     and not exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'industry_tags')
  then
    alter table public.tags rename to industry_tags;
  end if;
end;
$$;

create table if not exists public.industry_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  is_suggested boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.industry_tags enable row level security;

drop policy if exists "tags_select_all" on public.industry_tags;
drop policy if exists "industry_tags_select_all" on public.industry_tags;
create policy "industry_tags_select_all"
  on public.industry_tags for select to authenticated using (true);

drop policy if exists "tags_insert_own_custom" on public.industry_tags;
drop policy if exists "industry_tags_insert_own" on public.industry_tags;
create policy "industry_tags_insert_own"
  on public.industry_tags for insert to authenticated
  with check (auth.uid() = created_by and is_suggested = false);

-- ---------------------------------------------------------------------------
-- 2b. Widok zgodności: stary kod nadal odpytuje `tags`
-- ---------------------------------------------------------------------------
-- Bez tego każdy, kto ma niezaktualizowane repo, dostaje „relation tags does
-- not exist" na kroku tagów w onboardingu. Widok jest auto-updatable (prosty
-- select z jednej tabeli), więc INSERT i SELECT działają jak wcześniej,
-- a security_invoker przekazuje RLS tabeli źródłowej.
--
-- DO USUNIĘCIA, gdy cały zespół przejdzie na nową wersję kodu.

-- Defensywnie: gdyby `tags` nadal było tabelą (nietypowy stan bazy),
-- `drop view` rzuciłby błędem zamiast po cichu przejść dalej.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'tags'
               and table_type = 'BASE TABLE')
  then
    raise notice 'public.tags jest tabelą — pomijam widok zgodności';
  else
    execute 'drop view if exists public.tags';
  end if;
end;
$$;

create or replace view public.tags
with (security_invoker = true)
as select id, slug, label, is_suggested, created_by, created_at
from public.industry_tags;

grant select, insert on public.tags to authenticated;

-- Kategorie walidacyjne NIE są tagami — usuwamy je z katalogu branżowego.
update public.industry_tags set is_suggested = false
where slug in ('b2b', 'b2c', 'saas', 'hardware');

-- Placeholdery z poprzedniego designu — nie są branżami, tylko przykładami
-- działania wyszukiwarki. Zostają w bazie (mogą być gdzieś podpięte),
-- ale znikają z listy proponowanej userowi.
update public.industry_tags set is_suggested = false
where slug like 'anti-%';

-- Pełna lista branż pokazywana userowi naraz — bez konieczności szukania.
-- Kolejność w UI jest alfabetyczna, więc tutaj grupujemy tematycznie
-- tylko dla czytelności przy edycji.
insert into public.industry_tags (slug, label, is_suggested, created_by)
values
  ('ai',             'AI',                    true, null),
  ('fintech',        'Finanse',               true, null),
  ('edtech',         'Edukacja',              true, null),
  ('healthtech',     'Zdrowie',               true, null),
  ('ecommerce',      'E-commerce',            true, null),
  ('marketplace',    'Marketplace',           true, null),
  ('gastronomia',    'Gastronomia',           true, null),
  ('logistyka',      'Logistyka',             true, null),
  ('nieruchomosci',  'Nieruchomości',         true, null),
  ('produktywnosc',  'Produktywność',         true, null),
  ('hr',             'HR i rekrutacja',       true, null),
  ('marketing',      'Marketing i sprzedaż',  true, null),
  ('media',          'Media i treści',        true, null),
  ('rozrywka',       'Rozrywka i gry',        true, null),
  ('sport',          'Sport i kondycja',      true, null),
  ('podroze',        'Podróże',               true, null),
  ('moda',           'Moda i uroda',          true, null),
  ('dom',            'Dom i wnętrza',         true, null),
  ('motoryzacja',    'Motoryzacja',           true, null),
  ('rolnictwo',      'Rolnictwo',             true, null),
  ('budownictwo',    'Budownictwo',           true, null),
  ('energia',        'Energia i środowisko',  true, null),
  ('prawo',          'Prawo',                 true, null),
  ('spolecznosci',   'Społeczności',          true, null)
on conflict (slug) do update
set label = excluded.label, is_suggested = true;

-- ---------------------------------------------------------------------------
-- 3. Startupy
-- ---------------------------------------------------------------------------

create table if not exists public.startups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  logo_url         text,
  idea_description text,                 -- pełny opis, prywatny
  public_tagline   text,                 -- JEDNO zdanie, widoczne w Social
  status           text not null default 'active',
  is_discoverable  boolean not null default true,
  created_by       uuid not null references public.profiles (id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint startups_name_len check (char_length(trim(name)) between 2 and 80),
  constraint startups_tagline_len check (
    public_tagline is null or char_length(trim(public_tagline)) between 1 and 160),
  constraint startups_idea_len check (
    idea_description is null or char_length(trim(idea_description)) between 3 and 4000),
  constraint startups_status_valid check (status in ('active', 'paused', 'archived'))
);

create index if not exists startups_created_by_idx on public.startups (created_by);

drop trigger if exists startups_set_updated_at on public.startups;
create trigger startups_set_updated_at
  before update on public.startups
  for each row execute function public.set_updated_at();

create table if not exists public.startup_members (
  startup_id uuid not null references public.startups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (startup_id, profile_id),
  constraint startup_members_role_valid check (role in ('founder', 'admin', 'member'))
);

-- "moje startupy" to najczęstsze zapytanie w całej aplikacji
create index if not exists startup_members_profile_idx on public.startup_members (profile_id);

-- ---------------------------------------------------------------------------
-- 4. Kategorie walidacyjne (zamknięty zbiór) i tagi branżowe startupu
-- ---------------------------------------------------------------------------

create table if not exists public.startup_categories (
  startup_id uuid not null references public.startups (id) on delete cascade,
  category   text not null,
  primary key (startup_id, category),
  constraint startup_category_valid check (
    category in ('general', 'saas', 'hardware', 'b2b', 'b2c')
  )
);

create table if not exists public.startup_tags (
  startup_id uuid not null references public.startups (id) on delete cascade,
  tag_id     uuid not null references public.industry_tags (id) on delete cascade,
  primary key (startup_id, tag_id)
);

create index if not exists startup_tags_tag_idx on public.startup_tags (tag_id);

-- ---------------------------------------------------------------------------
-- 5. Helpery RLS
-- ---------------------------------------------------------------------------
-- security definer = omijają RLS. Bez tego polityka na startups pytałaby
-- o startup_members, której polityka pytałaby o startups → 42P17.

create or replace function public.is_startup_member(p_startup_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.startup_members
    where startup_id = p_startup_id and profile_id = auth.uid()
  );
$$;

create or replace function public.startup_role(p_startup_id uuid)
returns text
language sql security definer stable
set search_path = public
as $$
  select role from public.startup_members
  where startup_id = p_startup_id and profile_id = auth.uid();
$$;

revoke all on function public.is_startup_member(uuid) from public;
grant execute on function public.is_startup_member(uuid) to authenticated;
revoke all on function public.startup_role(uuid) from public;
grant execute on function public.startup_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Reguły biznesowe w bazie
-- ---------------------------------------------------------------------------

-- Limit 3 członkostw łącznie — obejmuje i założenie, i dołączenie.
create or replace function public.enforce_startup_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.startup_members
      where profile_id = new.profile_id) >= 3 then
    raise exception 'startup_limit_reached'
      using errcode = 'check_violation',
            hint = 'Maksymalnie 3 teamy na konto.';
  end if;
  return new;
end;
$$;

drop trigger if exists startup_members_limit on public.startup_members;
create trigger startup_members_limit
  before insert on public.startup_members
  for each row execute function public.enforce_startup_limit();

-- Jedynego Foundera nie da się usunąć ani zdegradować bez przekazania roli.
create or replace function public.protect_last_founder()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'founder')
     or (tg_op = 'UPDATE' and old.role = 'founder' and new.role <> 'founder') then
    if (select count(*) from public.startup_members
        where startup_id = old.startup_id and role = 'founder') <= 1 then
      raise exception 'cannot_remove_last_founder'
        using errcode = 'check_violation',
              hint = 'Najpierw przekaż rolę Foundera innej osobie.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists startup_members_protect_founder on public.startup_members;
create trigger startup_members_protect_founder
  before delete or update on public.startup_members
  for each row execute function public.protect_last_founder();

-- Autor startupu zostaje Founderem, a startup zawsze dostaje kategorię general.
create or replace function public.handle_new_startup()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.startup_members (startup_id, profile_id, role)
  values (new.id, new.created_by, 'founder')
  on conflict do nothing;

  insert into public.startup_categories (startup_id, category)
  values (new.id, 'general')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_startup_created on public.startups;
create trigger on_startup_created
  after insert on public.startups
  for each row execute function public.handle_new_startup();

-- Kategorii general nie da się usunąć — jest obowiązkowa dla każdego startupu.
create or replace function public.protect_general_category()
returns trigger
language plpgsql
as $$
begin
  if old.category = 'general' then
    raise exception 'general_category_required'
      using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

drop trigger if exists startup_categories_protect_general on public.startup_categories;
create trigger startup_categories_protect_general
  before delete on public.startup_categories
  for each row execute function public.protect_general_category();

-- ---------------------------------------------------------------------------
-- 7. RLS — jeden wzorzec dla całego workspace'u
-- ---------------------------------------------------------------------------

alter table public.startups          enable row level security;
alter table public.startup_members   enable row level security;
alter table public.startup_categories enable row level security;
alter table public.startup_tags      enable row level security;

-- Autor widzi swój startup zawsze. To nie tylko wygoda: `.insert().select()`
-- tłumaczy się na INSERT ... RETURNING, a Postgres sprawdza wtedy również
-- politykę SELECT. Członkostwo zakłada trigger AFTER INSERT, więc w momencie
-- RETURNING jeszcze nie istnieje — bez tego warunku autor nie zobaczyłby
-- własnego, właśnie utworzonego wiersza i dostałby błąd RLS.
drop policy if exists "startups_select_member" on public.startups;
create policy "startups_select_member"
  on public.startups for select to authenticated
  using (
    created_by = auth.uid()
    or public.is_startup_member(id)
  );

drop policy if exists "startups_insert_own" on public.startups;
create policy "startups_insert_own"
  on public.startups for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "startups_update_admin" on public.startups;
create policy "startups_update_admin"
  on public.startups for update to authenticated
  using (public.startup_role(id) in ('founder', 'admin'))
  with check (public.startup_role(id) in ('founder', 'admin'));

drop policy if exists "startups_delete_founder" on public.startups;
create policy "startups_delete_founder"
  on public.startups for delete to authenticated
  using (public.startup_role(id) = 'founder');

drop policy if exists "startup_members_select" on public.startup_members;
create policy "startup_members_select"
  on public.startup_members for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_startup_member(startup_id)
    or exists (
      select 1 from public.startups s
      where s.id = startup_members.startup_id and s.created_by = auth.uid()
    )
  );

-- Wstawić można siebie jako foundera (przez trigger) albo kogoś, gdy się zarządza.
drop policy if exists "startup_members_insert" on public.startup_members;
create policy "startup_members_insert"
  on public.startup_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    or public.startup_role(startup_id) in ('founder', 'admin')
  );

drop policy if exists "startup_members_update_admin" on public.startup_members;
create policy "startup_members_update_admin"
  on public.startup_members for update to authenticated
  using (public.startup_role(startup_id) in ('founder', 'admin'))
  with check (public.startup_role(startup_id) in ('founder', 'admin'));

-- Sam możesz wyjść; admin może usunąć kogoś innego.
drop policy if exists "startup_members_delete" on public.startup_members;
create policy "startup_members_delete"
  on public.startup_members for delete to authenticated
  using (
    profile_id = auth.uid()
    or public.startup_role(startup_id) in ('founder', 'admin')
  );

drop policy if exists "startup_categories_rw" on public.startup_categories;
create policy "startup_categories_rw"
  on public.startup_categories for all to authenticated
  using (public.is_startup_member(startup_id))
  with check (public.startup_role(startup_id) in ('founder', 'admin'));

drop policy if exists "startup_tags_rw" on public.startup_tags;
create policy "startup_tags_rw"
  on public.startup_tags for all to authenticated
  using (public.is_startup_member(startup_id))
  with check (public.startup_role(startup_id) in ('founder', 'admin'));

-- ---------------------------------------------------------------------------
-- 8. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
   where table_schema = 'public'
     and table_name in ('startups','startup_members','startup_categories',
                        'startup_tags','industry_tags')) as tabel_utworzonych_z_5,
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles'
     and column_name = 'onboarding_path') as kolumna_onboarding_path;
