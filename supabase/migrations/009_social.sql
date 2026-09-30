-- ============================================================================
-- 009 · Warstwa Social: profile publiczne, discovery, prośby o dołączenie
-- ----------------------------------------------------------------------------
-- Dwie strony tego samego rynku:
--   • joiner ma profil publiczny i szuka teamu,
--   • startup ma profil publiczny i szuka ludzi na konkretne role.
--
-- Zasady prywatności zaszyte w schemacie:
--   • `idea_description` NIGDY nie wychodzi na zewnątrz — publiczny jest tylko
--     tagline i opis, które founder świadomie napisał dla obcych,
--   • e-mail widzą wyłącznie osoby z tego samego teamu,
--   • `is_discoverable = false` znaczy „nie ma mnie w wyszukiwarce" i dotyczy
--     też listy członków na publicznej stronie teamu.
--
-- Odpal PO 008. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profil osoby: czego szukam
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists looking_for  text,
  add column if not exists location     text,
  add column if not exists weekly_hours integer;

comment on column public.profiles.looking_for is
  'Czego szuka: team | cofounder | collaborators | not_looking. Glowny filtr w Discover.';
comment on column public.profiles.weekly_hours is
  'Ile godzin tygodniowo realnie moze dac. Najczestsze zrodlo rozczarowan w teamach, wiec pytamy wprost.';

alter table public.profiles drop constraint if exists profiles_looking_for_valid;
alter table public.profiles
  add constraint profiles_looking_for_valid check (
    looking_for is null
    or looking_for in ('team', 'cofounder', 'collaborators', 'not_looking')
  );

alter table public.profiles drop constraint if exists profiles_location_len;
alter table public.profiles
  add constraint profiles_location_len check (
    location is null or char_length(trim(location)) between 1 and 80
  );

alter table public.profiles drop constraint if exists profiles_weekly_hours_range;
alter table public.profiles
  add constraint profiles_weekly_hours_range check (
    weekly_hours is null or weekly_hours between 1 and 80
  );

-- ---------------------------------------------------------------------------
-- 2. Profil teamu: co pokazujemy obcym
-- ---------------------------------------------------------------------------

alter table public.startups
  add column if not exists public_description text,
  add column if not exists location           text,
  add column if not exists website_url        text;

comment on column public.startups.public_description is
  'Opis dla osob z zewnatrz. Swiadomie osobny od idea_description, ktory zostaje prywatny.';

alter table public.startups drop constraint if exists startups_public_description_len;
alter table public.startups
  add constraint startups_public_description_len check (
    public_description is null
    or char_length(trim(public_description)) between 1 and 1200
  );

alter table public.startups drop constraint if exists startups_location_len;
alter table public.startups
  add constraint startups_location_len check (
    location is null or char_length(trim(location)) between 1 and 80
  );

alter table public.startups drop constraint if exists startups_website_len;
alter table public.startups
  add constraint startups_website_len check (
    website_url is null or char_length(trim(website_url)) between 4 and 200
  );

-- ---------------------------------------------------------------------------
-- 3. Stanowisko w teamie to nie to samo co uprawnienia
-- ---------------------------------------------------------------------------
-- `role` decyduje o tym, co wolno (founder/admin/member — sprawdza je RLS).
-- `job_title` to wizytówka: CEO, CTO, Head of Design. Rozdzielamy je, bo
-- „CTO" nie musi znaczyć „może zmieniać walidację pomysłu", a nazwanie kogoś
-- CEO nie może po cichu dawać mu uprawnień.

alter table public.startup_members
  add column if not exists job_title text;

comment on column public.startup_members.job_title is
  'Etykieta stanowiska (CEO, CTO, ...). NIE nadaje uprawnien — te wynikaja z kolumny role.';

alter table public.startup_members drop constraint if exists startup_members_job_title_len;
alter table public.startup_members
  add constraint startup_members_job_title_len check (
    job_title is null or char_length(trim(job_title)) between 2 and 48
  );

-- Founder dostaje domyślną wizytówkę, żeby lista członków nie była pusta.
update public.startup_members
set job_title = 'Founder'
where role = 'founder' and job_title is null;

-- ---------------------------------------------------------------------------
-- 4. Otwarte role w teamie
-- ---------------------------------------------------------------------------
-- Bez tego discovery jest tylko listą nazw. Z tym joiner widzi konkret:
-- „szukamy kogoś do backendu, 10 h tygodniowo".

create table if not exists public.startup_open_roles (
  id uuid primary key default gen_random_uuid(),
  startup_id   uuid not null references public.startups (id) on delete cascade,
  title        text not null,
  description  text,
  weekly_hours integer,
  is_open      boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint open_role_title_len check (char_length(trim(title)) between 2 and 80),
  constraint open_role_desc_len check (
    description is null or char_length(trim(description)) between 1 and 600),
  constraint open_role_hours_range check (
    weekly_hours is null or weekly_hours between 1 and 80)
);

create index if not exists startup_open_roles_startup_idx
  on public.startup_open_roles (startup_id) where is_open;

create table if not exists public.startup_open_role_skills (
  role_id  uuid not null references public.startup_open_roles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (role_id, skill_id)
);

create index if not exists open_role_skills_skill_idx
  on public.startup_open_role_skills (skill_id);

-- ---------------------------------------------------------------------------
-- 5. Prośby o dołączenie — jedna tabela na oba kierunki
-- ---------------------------------------------------------------------------
-- `direction` mówi tylko, kto zaczął rozmowę. Reszta logiki jest wspólna, więc
-- dwie osobne tabele znaczyłyby dwa razy te same polityki i dwa razy ten sam błąd.

create table if not exists public.startup_join_requests (
  id uuid primary key default gen_random_uuid(),
  startup_id    uuid not null references public.startups (id) on delete cascade,
  -- Klucz nazwany jawnie: tabela ma trzy odwolania do `profiles`, wiec
  -- PostgREST musi dostac nazwe ograniczenia, zeby wiedziec, ktore zlaczyc.
  profile_id    uuid not null,
  direction     text not null,
  open_role_id  uuid references public.startup_open_roles (id) on delete set null,
  -- Rola nadawana po akceptacji. Foundera nie da się zaprosić.
  proposed_role text not null default 'member',
  job_title     text,
  message       text,
  status        text not null default 'pending',
  created_by    uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  responded_by  uuid references public.profiles (id) on delete set null,
  constraint join_direction_valid check (direction in ('application', 'invite')),
  constraint join_status_valid check (
    status in ('pending', 'accepted', 'declined', 'withdrawn')),
  constraint join_proposed_role_valid check (proposed_role in ('admin', 'member')),
  constraint join_message_len check (
    message is null or char_length(trim(message)) between 1 and 600),
  constraint join_job_title_len check (
    job_title is null or char_length(trim(job_title)) between 2 and 48),
  constraint startup_join_requests_profile_id_fkey
    foreign key (profile_id) references public.profiles (id) on delete cascade
);

-- Jedna otwarta rozmowa na parę. Historia (accepted/declined) zostaje.
create unique index if not exists join_requests_one_pending
  on public.startup_join_requests (startup_id, profile_id)
  where status = 'pending';

create index if not exists join_requests_profile_idx
  on public.startup_join_requests (profile_id, status);
create index if not exists join_requests_startup_idx
  on public.startup_join_requests (startup_id, status);

-- Nie zapraszamy i nie aplikujemy tam, gdzie się już jest. Limit 3 teamów
-- sprawdzamy już przy prośbie, a nie dopiero przy akceptacji — inaczej ktoś
-- akceptowałby zaproszenie i dostawał w twarz błędem bazy.
create or replace function public.validate_join_request()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.startup_members
    where startup_id = new.startup_id and profile_id = new.profile_id
  ) then
    raise exception 'already_member'
      using errcode = 'check_violation',
            hint = 'Ta osoba jest juz w teamie.';
  end if;

  if (select count(*) from public.startup_members
      where profile_id = new.profile_id) >= 3 then
    raise exception 'startup_limit_reached'
      using errcode = 'check_violation',
            hint = 'Maksymalnie 3 teamy na konto.';
  end if;

  return new;
end;
$$;

drop trigger if exists join_requests_validate on public.startup_join_requests;
create trigger join_requests_validate
  before insert on public.startup_join_requests
  for each row execute function public.validate_join_request();

-- ---------------------------------------------------------------------------
-- 6. Widoczność profili
-- ---------------------------------------------------------------------------
-- Do tej pory `profiles` miało politykę „tylko własny wiersz". To wystarczało,
-- dopóki nie było teamów — teraz członkowie muszą się nawzajem widzieć, a
-- osoba, która sama wysłała prośbę o dołączenie, świadomie pokazała się
-- zarządzającym tym teamem.

create or replace function public.shares_startup_with(p_profile_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.startup_members mine
    join public.startup_members theirs on theirs.startup_id = mine.startup_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = p_profile_id
  );
$$;

revoke all on function public.shares_startup_with(uuid) from public;
grant execute on function public.shares_startup_with(uuid) to authenticated;

create or replace function public.is_profile_visible(p_profile_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select
    p_profile_id = auth.uid()
    or public.shares_startup_with(p_profile_id)
    or exists (
      select 1
      from public.startup_join_requests r
      where r.profile_id = p_profile_id
        and r.status = 'pending'
        and public.can_edit_startup(r.startup_id)
    );
$$;

revoke all on function public.is_profile_visible(uuid) from public;
grant execute on function public.is_profile_visible(uuid) to authenticated;

-- Uwaga: `is_discoverable` NIE jest tutaj warunkiem. Pełny wiersz profilu
-- (z e-mailem) dostają wyłącznie osoby z tego samego teamu. Obcy widzą
-- wyłącznie widok `public_profiles` z wąskim zestawem kolumn.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_visible" on public.profiles;
create policy "profiles_select_visible"
  on public.profiles for select to authenticated
  using (public.is_profile_visible(id));

-- Umiejętności idą za widocznością profilu — inaczej lista członków teamu
-- pokazywałaby imiona bez tego, co kto potrafi.
drop policy if exists "profile_skills_select_own" on public.profile_skills;
drop policy if exists "profile_skills_select_visible" on public.profile_skills;
create policy "profile_skills_select_visible"
  on public.profile_skills for select to authenticated
  using (public.is_profile_visible(profile_id));

-- Discovery filtruje po tych dwóch kolumnach przy każdym zapytaniu.
create index if not exists profiles_discoverable_idx
  on public.profiles (is_discoverable) where is_discoverable;
create index if not exists startups_discoverable_idx
  on public.startups (is_discoverable) where is_discoverable;

-- ---------------------------------------------------------------------------
-- 7. Widok publiczny osoby
-- ---------------------------------------------------------------------------
-- Widok celowo BEZ `security_invoker` — omija RLS tabeli bazowej, a filtrem
-- jest jego własne WHERE. Dzięki temu jedno miejsce decyduje, co widzi obcy,
-- i nie da się przypadkiem dociągnąć e-maila przez `select *`.

drop view if exists public.public_profiles;
create view public.public_profiles as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.headline,
  p.weekly_focus,
  p.weekly_focus_updated_at,
  p.location,
  p.looking_for,
  p.weekly_hours,
  p.onboarding_path,
  p.created_at,
  (select count(*) from public.startup_members m where m.profile_id = p.id)
    as team_count,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'label', s.label) order by s.label)
    from public.profile_skills ps
    join public.skills s on s.id = ps.skill_id
    where ps.profile_id = p.id
  ), '[]'::jsonb) as skills,
  -- Osobna tablica slugow, zeby filtr po umiejetnosci dzial sie w bazie
  -- (`overlaps`), a nie przez dociaganie wszystkich profili do aplikacji.
  coalesce((
    select array_agg(s.slug order by s.slug)
    from public.profile_skills ps
    join public.skills s on s.id = ps.skill_id
    where ps.profile_id = p.id
  ), array[]::text[]) as skill_slugs
from public.profiles p
where p.is_discoverable = true
  and p.onboarding_completed_at is not null
  and p.full_name is not null;

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Widok publiczny teamu
-- ---------------------------------------------------------------------------
-- Lista członków pokazuje tylko osoby, które zgodziły się być widoczne.
-- Reszta zespołu liczy się do `member_count`, ale nie do `members` — kto
-- wyłączył discovery, nie pojawia się nigdzie, także na cudzej stronie.

drop view if exists public.public_startups;
create view public.public_startups as
select
  s.id,
  s.name,
  s.logo_url,
  s.public_tagline,
  s.public_description,
  s.location,
  s.website_url,
  s.created_at,
  (select count(*) from public.startup_members m where m.startup_id = s.id)
    as member_count,
  (select t.title
     from public.startup_stages ss
     join public.stage_templates t on t.id = ss.template_id
    where ss.startup_id = s.id
    order by t.position desc
    limit 1) as stage_label,
  coalesce((
    select jsonb_agg(c.category order by c.category)
    from public.startup_categories c
    where c.startup_id = s.id and c.category <> 'general'
  ), '[]'::jsonb) as categories,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', t.id, 'label', t.label) order by t.label)
    from public.startup_tags st
    join public.industry_tags t on t.id = st.tag_id
    where st.startup_id = s.id
  ), '[]'::jsonb) as tags,
  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id', r.id,
               'title', r.title,
               'description', r.description,
               'weekly_hours', r.weekly_hours,
               'skills', coalesce((
                 select jsonb_agg(sk.label order by sk.label)
                 from public.startup_open_role_skills rs
                 join public.skills sk on sk.id = rs.skill_id
                 where rs.role_id = r.id
               ), '[]'::jsonb)
             ) order by r.created_at)
    from public.startup_open_roles r
    where r.startup_id = s.id and r.is_open
  ), '[]'::jsonb) as open_roles,
  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id', p.id,
               'full_name', p.full_name,
               'avatar_url', p.avatar_url,
               'job_title', m.job_title
             ) order by m.joined_at)
    from public.startup_members m
    join public.profiles p on p.id = m.profile_id
    where m.startup_id = s.id and p.is_discoverable = true
  ), '[]'::jsonb) as members,
  coalesce((
    select array_agg(c.category order by c.category)
    from public.startup_categories c
    where c.startup_id = s.id and c.category <> 'general'
  ), array[]::text[]) as category_keys,
  coalesce((
    select array_agg(t.slug order by t.slug)
    from public.startup_tags st
    join public.industry_tags t on t.id = st.tag_id
    where st.startup_id = s.id
  ), array[]::text[]) as tag_slugs,
  (select count(*) from public.startup_open_roles r
    where r.startup_id = s.id and r.is_open) as open_role_count
from public.startups s
where s.is_discoverable = true
  and s.status = 'active';

revoke all on public.public_startups from public, anon;
grant select on public.public_startups to authenticated;

-- ---------------------------------------------------------------------------
-- 9. RLS nowych tabel
-- ---------------------------------------------------------------------------

alter table public.startup_open_roles       enable row level security;
alter table public.startup_open_role_skills enable row level security;
alter table public.startup_join_requests    enable row level security;

-- Otwarte role czyta każdy zalogowany (są z definicji ogłoszeniem),
-- ale edytuje tylko ten, kto zarządza teamem.
drop policy if exists "open_roles_select" on public.startup_open_roles;
create policy "open_roles_select"
  on public.startup_open_roles for select to authenticated using (true);

drop policy if exists "open_roles_write" on public.startup_open_roles;
create policy "open_roles_write"
  on public.startup_open_roles for all to authenticated
  using (public.can_edit_startup(startup_id))
  with check (public.can_edit_startup(startup_id));

drop policy if exists "open_role_skills_select" on public.startup_open_role_skills;
create policy "open_role_skills_select"
  on public.startup_open_role_skills for select to authenticated using (true);

drop policy if exists "open_role_skills_write" on public.startup_open_role_skills;
create policy "open_role_skills_write"
  on public.startup_open_role_skills for all to authenticated
  using (exists (
    select 1 from public.startup_open_roles r
    where r.id = role_id and public.can_edit_startup(r.startup_id)))
  with check (exists (
    select 1 from public.startup_open_roles r
    where r.id = role_id and public.can_edit_startup(r.startup_id)));

-- Prośbę widzi jej adresat i osoby zarządzające teamem. Zwykły członek nie —
-- rekrutacja to nie jest coś, co ogląda cały zespół.
drop policy if exists "join_requests_select" on public.startup_join_requests;
create policy "join_requests_select"
  on public.startup_join_requests for select to authenticated
  using (
    profile_id = auth.uid()
    or created_by = auth.uid()
    or public.can_edit_startup(startup_id)
  );

drop policy if exists "join_requests_insert" on public.startup_join_requests;
create policy "join_requests_insert"
  on public.startup_join_requests for insert to authenticated
  with check (
    created_by = auth.uid()
    and status = 'pending'
    and (
      (direction = 'application' and profile_id = auth.uid())
      or (direction = 'invite' and public.can_edit_startup(startup_id))
    )
  );

-- Celowo BEZ polityk UPDATE i DELETE. Każda zmiana statusu przechodzi przez
-- respond_join_request() — wtedy „kto może zaakceptować" jest zapisane raz,
-- w jednym miejscu, a nie rozsypane po politykach.

-- ---------------------------------------------------------------------------
-- 10. Odpowiedź na prośbę
-- ---------------------------------------------------------------------------

create or replace function public.respond_join_request(
  p_request_id uuid,
  p_action     text
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  req public.startup_join_requests;
  uid uuid := auth.uid();
  is_manager boolean;
  is_target  boolean;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_action not in ('accept', 'decline', 'withdraw') then
    raise exception 'invalid_action';
  end if;

  select * into req
  from public.startup_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  if req.status <> 'pending' then
    raise exception 'request_not_pending'
      using hint = 'Ta prosba zostala juz rozpatrzona.';
  end if;

  is_manager := public.can_edit_startup(req.startup_id);
  is_target  := (req.direction = 'application' and is_manager)
             or (req.direction = 'invite' and req.profile_id = uid);

  -- Wycofać może tylko ten, kto prośbę wysłał.
  if p_action = 'withdraw' then
    if req.created_by <> uid then
      raise exception 'not_allowed';
    end if;
    update public.startup_join_requests
    set status = 'withdrawn', responded_at = now(), responded_by = uid
    where id = req.id;
    return 'withdrawn';
  end if;

  -- Zaakceptować lub odrzucić może wyłącznie druga strona rozmowy.
  if not is_target then
    raise exception 'not_allowed';
  end if;

  if p_action = 'decline' then
    update public.startup_join_requests
    set status = 'declined', responded_at = now(), responded_by = uid
    where id = req.id;
    return 'declined';
  end if;

  -- accept: wpis do zespołu robi ta funkcja, żeby limit 3 teamów i ochrona
  -- ostatniego Foundera zadziałały w tej samej transakcji co zmiana statusu.
  insert into public.startup_members (startup_id, profile_id, role, job_title)
  values (
    req.startup_id,
    req.profile_id,
    case when req.direction = 'invite' then req.proposed_role else 'member' end,
    coalesce(
      req.job_title,
      (select r.title from public.startup_open_roles r where r.id = req.open_role_id)
    )
  );

  update public.startup_join_requests
  set status = 'accepted', responded_at = now(), responded_by = uid
  where id = req.id;

  return 'accepted';
end;
$$;

revoke all on function public.respond_join_request(uuid, text) from public;
grant execute on function public.respond_join_request(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Storage: logo teamu
-- ---------------------------------------------------------------------------
-- Ścieżka: <startup_id>/logo.<ext>. Bucket publiczny, bo logo pojawia się
-- w discovery; zapis wyłącznie dla zarządzających teamem.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'startup-logos', 'startup-logos', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "startup_logos_public_read" on storage.objects;
create policy "startup_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'startup-logos');

drop policy if exists "startup_logos_write" on storage.objects;
create policy "startup_logos_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'startup-logos'
    and public.can_edit_startup(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "startup_logos_update" on storage.objects;
create policy "startup_logos_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'startup-logos'
    and public.can_edit_startup(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'startup-logos'
    and public.can_edit_startup(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "startup_logos_delete" on storage.objects;
create policy "startup_logos_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'startup-logos'
    and public.can_edit_startup(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 12. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('looking_for', 'location', 'weekly_hours')) as kolumny_profilu,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'startup_members'
      and column_name = 'job_title') as ma_job_title,
  (select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('startup_open_roles', 'startup_join_requests')) as nowe_tabele,
  (select count(*) from information_schema.views
    where table_schema = 'public'
      and table_name in ('public_profiles', 'public_startups')) as widoki_publiczne;
