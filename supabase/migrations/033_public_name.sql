-- =============================================================================
-- 033 — nazwa publiczna osobno od imienia i nazwiska z konta
--
-- Odpal PO 032. Idempotentna.
--
-- Problem: kreator profilu publicznego (Social → „Twój profil”) pytał o imię
-- drugi raz i zapisywał je w `profiles.full_name`. Kto przy rejestracji podał
-- „Wiktor Mamczyk”, a w Social wpisał „Hammock”, tracił imię i nazwisko
-- z konta — także w składzie teamu, celach i zadaniach.
--
-- Teraz są dwie nazwy:
--   • `full_name`   — konto i team: skład, cele, zadania, historia zmian;
--   • `public_name` — jak widzą Cię ludzie spoza teamu: Odkrywaj, profil,
--                     zaczepki, rozmowy, zgłoszenia. NULL = `full_name`.
--
-- Widoki `public_profiles`, `public_startups` (lista członków)
-- i `contact_profiles` oddają w kolumnie `full_name` nazwę publiczną, jeśli
-- jest ustawiona. Nazwa kolumny zostaje stara celowo:
--   • cała warstwa Social już ją czyta — zmiana w jednym miejscu zamiast
--     w kilkunastu komponentach;
--   • obcy, który dostaje pseudonim, NIE dostaje obok imienia i nazwiska.
--     Osobna kolumna `public_name` w widoku zostawiałaby `full_name` na
--     wierzchu i pseudonim niczego by nie ukrywał.
--
-- Widoki odtwarzamy przez `create or replace` z identyczną listą kolumn —
-- zmienia się tylko źródło nazwy. Bez `drop`, więc nic, co od nich zależy,
-- się nie wysypie, a uprawnienia zostają.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Kolumna
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists public_name text;

comment on column public.profiles.public_name is
  'Nazwa widoczna poza teamem (Odkrywaj, profil, zaczepki, rozmowy). NULL = full_name.';

-- Pusta albo jednoznakowa nazwa publiczna to nie pseudonim, tylko błąd
-- formularza — w bazie zostaje NULL, czyli imię i nazwisko z konta.
alter table public.profiles
  drop constraint if exists profiles_public_name_length;
alter table public.profiles
  add constraint profiles_public_name_length
  check (public_name is null or char_length(btrim(public_name)) between 2 and 80);

-- ---------------------------------------------------------------------------
-- 2. Widok publiczny osoby (009) — nazwa publiczna zamiast imienia z konta
-- ---------------------------------------------------------------------------

create or replace view public.public_profiles as
select
  p.id,
  coalesce(p.public_name, p.full_name) as full_name,
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
-- 3. Widok publiczny teamu (016) — członkowie pod nazwą publiczną
-- ---------------------------------------------------------------------------

create or replace view public.public_startups as
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
  -- Etap jest danymi PROGRAMU, nie wizytowka napisana dla obcych. Wychodzi
  -- na zewnatrz tylko wtedy, gdy Founder swiadomie to wlaczyl.
  case
    when s.show_stage_publicly then (
      select t.title
        from public.startup_stages ss
        join public.stage_templates t on t.id = ss.template_id
       where ss.startup_id = s.id
       order by t.position desc
       limit 1)
    else null
  end as stage_label,
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
               'full_name', coalesce(p.public_name, p.full_name),
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
-- 4. Wizytówka rozmówcy (019) — w zaczepkach i rozmowach nazwa publiczna
-- ---------------------------------------------------------------------------
-- Ktoś, kogo poznało się w Odkrywaj jako „Hammock”, w rozmowie nadal jest
-- „Hammock”. Imię i nazwisko z konta widzi dopiero team, do którego dołączy.

create or replace view public.contact_profiles as
select
  p.id,
  coalesce(p.public_name, p.full_name) as full_name,
  p.avatar_url,
  p.headline
from public.profiles p
where
  exists (
    select 1
    from public.contact_signals cs
    where (cs.sender_id = auth.uid() and cs.recipient_id = p.id)
       or (cs.recipient_id = auth.uid() and cs.sender_id = p.id)
  )
  or exists (
    select 1
    from public.conversation_participants mine
    join public.conversation_participants theirs
      on theirs.conversation_id = mine.conversation_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = p.id
  );

revoke all on public.contact_profiles from public, anon;
grant select on public.contact_profiles to authenticated;
