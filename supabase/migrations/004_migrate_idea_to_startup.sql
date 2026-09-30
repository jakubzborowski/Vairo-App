-- ============================================================================
-- 004 · Przeniesienie pomysłu z profilu na startup
-- ----------------------------------------------------------------------------
-- Userzy, którzy przeszli stary onboarding, mają pomysł zapisany w
-- profiles.idea_description i tagi w profile_tags. Ten skrypt zakłada im
-- startup i przepina tam te dane.
--
-- profiles.idea_description i profile_tags ZOSTAJĄ jako siatka bezpieczeństwa.
-- Usuwamy je dopiero, gdy nowy model potwierdzi się w działaniu.
--
-- Odpal PO 003. Idempotentne — ponowne uruchomienie nic nie duplikuje.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Startup dla każdego, kto opisał pomysł i nie ma jeszcze żadnego teamu
-- ---------------------------------------------------------------------------

insert into public.startups (name, idea_description, created_by, created_at)
select
  left(
    coalesce(
      nullif(trim(split_part(p.full_name, ' ', 1)), '') || ' — projekt',
      'Mój startup'
    ), 80
  ),
  p.idea_description,
  p.id,
  p.created_at
from public.profiles p
where p.idea_description is not null
  and char_length(trim(p.idea_description)) >= 3
  and not exists (
    select 1 from public.startup_members m where m.profile_id = p.id
  );

-- Rolę Foundera i kategorię general dokłada trigger on_startup_created.

-- ---------------------------------------------------------------------------
-- 2. Stare tagi: część z nich to w rzeczywistości kategorie walidacyjne
-- ---------------------------------------------------------------------------

insert into public.startup_categories (startup_id, category)
select distinct s.id, t.slug
from public.startups s
join public.profile_tags pt on pt.profile_id = s.created_by
join public.industry_tags t on t.id = pt.tag_id
where t.slug in ('saas', 'hardware', 'b2b', 'b2c')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Reszta tagów zostaje tagami branżowymi startupu
-- ---------------------------------------------------------------------------

insert into public.startup_tags (startup_id, tag_id)
select distinct s.id, pt.tag_id
from public.startups s
join public.profile_tags pt on pt.profile_id = s.created_by
join public.industry_tags t on t.id = pt.tag_id
where t.slug not in ('saas', 'hardware', 'b2b', 'b2c', 'general')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. Ścieżka wejścia dla istniejących kont
-- ---------------------------------------------------------------------------
-- Kto ma startup → founder_idea. Kto nie ma → joiner.
-- To tylko etykieta historyczna; ścieżka nie ogranicza niczego później.

update public.profiles p
set onboarding_path = case
  when exists (select 1 from public.startup_members m where m.profile_id = p.id)
    then 'founder_idea'
  else 'joiner'
end
where p.onboarding_path is null
  and p.onboarding_completed_at is not null;

-- ---------------------------------------------------------------------------
-- 5. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from public.startups)           as startupow,
  (select count(*) from public.startup_members)    as czlonkostw,
  (select count(*) from public.startup_categories) as kategorii,
  (select count(*) from public.startup_tags)       as tagow_branzowych,
  (select count(*) from public.profiles
   where onboarding_path is not null)              as profili_ze_sciezka;
