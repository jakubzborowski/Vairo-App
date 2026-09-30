-- ============================================================================
-- Sprzatanie: etapy zalozone przypadkiem, bez ani jednej odpowiedzi
-- ----------------------------------------------------------------------------
-- Do poprawki z tej sesji kliknięcie w pominięty etap na pasku zakładało jego
-- instancję po cichu. Aplikacja radzi sobie z takim wierszem (etap pokazuje
-- się jako „otwarty", a nie jako bieżący), ale jeśli chcesz wrócić do stanu
-- „pominięty", skasuj puste instancje.
--
-- Bezpieczne: kasuje WYLACZNIE etapy bez jednej zapisanej odpowiedzi.
-- Nie jest migracja — odpalasz tylko wtedy, gdy chcesz posprzatac.
-- ============================================================================

-- 1. Najpierw zobacz, co zostanie usuniete.
select
  s.name        as startup,
  t.key         as etap,
  ss.status,
  ss.started_at
from public.startup_stages ss
join public.stage_templates t on t.id = ss.template_id
join public.startups s        on s.id = ss.startup_id
where ss.status = 'in_progress'
  and not exists (
    select 1 from public.stage_answers a where a.startup_stage_id = ss.id
  )
order by s.name, t.position;

-- 2. Jesli lista wyglada dobrze, odkomentuj i odpal:

-- delete from public.startup_stages ss
-- where ss.status = 'in_progress'
--   and not exists (
--     select 1 from public.stage_answers a where a.startup_stage_id = ss.id
--   );
