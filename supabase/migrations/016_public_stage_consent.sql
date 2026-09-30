-- ===========================================================================
-- 016 · Zakres widoku publicznego: etap pokazuje sie tylko za zgoda Foundera
-- ===========================================================================
--
-- PROBLEM
--
-- Guidelines mowia, ze warstwa Social moze odczytac ze startupu wylacznie jego
-- publiczny fragment. Widok `public_startups` wystawial tymczasem `stage_label`
-- — czyli najdalszy rozpoczety etap walidacji. To nie jest tekst, ktory ktos
-- napisal dla obcych; to liczba, ktora system policzyl z postepu zespolu.
--
-- Roznica jest istotna z dwoch powodow:
--
--   1. **Zgoda.** Tagline i opis publiczny founder wpisal, wiedzac, ze zobacza
--      je nieznajomi. Etapu nikt swiadomie nie publikowal — wlaczyl sie sam,
--      bo zespol zaczal pracowac.
--   2. **Odczyt.** „Idea Stage" da sie przeczytac jako „dopiero zaczynaja,
--      pewnie nic z tego nie bedzie". Zespol nie ma jak tego sprostowac, bo
--      nie wie nawet, ze to widac.
--
-- ROZWIAZANIE
--
-- Nie usuwamy informacji — oddajemy nad nia kontrole. Nowa flaga
-- `show_stage_publicly` (domyslnie FALSE, czyli prywatnie) przelacza sie
-- w Team -> Profil publiczny. Dla kazdego istniejacego startupu oznacza to
-- wylaczenie: zmiana zakresu widocznosci nie moze dzialac wstecz bez pytania.
--
-- Zasada na przyszlosc: **publiczne jest to, co czlowiek napisal dla obcych;
-- prywatne jest to, co system o nim policzyl.** Kazda nowa kolumna w widoku
-- `public_*` musi przejsc ten test.
--
-- Idempotentna. Odpalac po 015.

-- ---------------------------------------------------------------------------
-- 1. Flaga zgody
-- ---------------------------------------------------------------------------

alter table public.startups
  add column if not exists show_stage_publicly boolean not null default false;

comment on column public.startups.show_stage_publicly is
  'Czy w profilu publicznym pokazywac etap walidacji. Domyslnie nie — etap to dane programu, nie wizytowka.';

-- ---------------------------------------------------------------------------
-- 2. Widok publiczny z etapem za zgoda
-- ---------------------------------------------------------------------------

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
