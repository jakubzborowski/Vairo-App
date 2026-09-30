-- ============================================================================
-- Diagnostyka: jedno zapytanie, jeden wynik
-- ----------------------------------------------------------------------------
-- Supabase → SQL Editor → wklej całość → Run.
-- Wszystko wraca jako jedna tabela, więc nie trzeba niczego zaznaczać.
--
-- Interesuje Cię kolumna `wynik`. Wszędzie „OK" = komplet.
-- ============================================================================

with
tabele as (
  select
    coalesce(string_agg(t.n, ', ') filter (where c.relname is null), '—') as brakuje,
    count(*) filter (where c.relname is not null) as jest,
    count(*) as oczekiwane
  from (values
    ('startups'), ('startup_members'), ('startup_categories'), ('startup_tags'),
    ('industry_tags'), ('skills'), ('profile_skills'),
    ('stage_templates'), ('stage_categories'), ('stage_points'),
    ('stage_subpoints'), ('stage_fields'),
    ('startup_stages'), ('stage_answers'), ('stage_subpoint_progress')
  ) as t(n)
  left join pg_class c
    on c.relname = t.n
   and c.relnamespace = 'public'::regnamespace
   and c.relkind = 'r'
),
funkcje as (
  select
    coalesce(string_agg(f.n, ', ') filter (where p.proname is null), '—') as brakuje,
    count(*) filter (where p.proname is not null) as jest,
    count(*) as oczekiwane
  from (values
    ('is_startup_member'), ('startup_role'), ('can_access_stage'),
    ('handle_new_startup'), ('enforce_startup_limit'),
    ('protect_last_founder'), ('recalc_subpoint_progress'),
    ('touch_weekly_focus'), ('protect_general_category')
  ) as f(n)
  left join pg_proc p
    on p.proname = f.n
   and p.pronamespace = 'public'::regnamespace
),
polityki as (
  select
    coalesce(string_agg(pl.n, ', ') filter (where x.policyname is null), '—') as brakuje,
    count(*) filter (where x.policyname is not null) as jest,
    count(*) as oczekiwane
  from (values
    ('startups_select_member'), ('startups_insert_own'),
    ('startups_update_admin'), ('startups_delete_founder')
  ) as pl(n)
  left join pg_policies x
    on x.policyname = pl.n
   and x.schemaname = 'public' and x.tablename = 'startups'
),
fix_003b as (
  select
    (select qual from pg_policies
      where schemaname = 'public' and tablename = 'startups' and cmd = 'SELECT'
      limit 1) as wyrazenie
),
tresc as (
  select
    coalesce(string_agg(
      t.key || ': ' || x.punktow || ' pkt / ' || x.podpunktow || ' podpkt / ' || x.pol || ' pól',
      '   |   ' order by t.key), 'brak treści') as opis
  from public.stage_templates t
  cross join lateral (
    select
      count(distinct p.id) as punktow,
      count(distinct s.id) as podpunktow,
      count(f.id)          as pol
    from public.stage_categories c
    left join public.stage_points    p on p.category_id = c.id
    left join public.stage_subpoints s on s.point_id = p.id
    left join public.stage_fields    f on f.subpoint_id = s.id
    where c.template_id = t.id
  ) x
),
konta as (
  select
    count(*) as userow,
    count(*) filter (where p.onboarding_completed_at is not null) as po_onboardingu,
    (select count(*) from public.startups) as startupow,
    (select count(*) from public.stage_answers) as odpowiedzi
  from auth.users u
  left join public.profiles p on p.id = u.id
)

select 1 as nr, 'Tabele' as sprawdzenie,
       case when brakuje = '—' then 'OK' else 'BRAKUJE' end as wynik,
       jest || '/' || oczekiwane || '   brakuje: ' || brakuje as szczegoly
from tabele
union all
select 2, 'Funkcje',
       case when brakuje = '—' then 'OK' else 'BRAKUJE' end,
       jest || '/' || oczekiwane || '   brakuje: ' || brakuje
from funkcje
union all
select 3, 'Polityki RLS na startups',
       case when brakuje = '—' then 'OK' else 'BRAKUJE' end,
       jest || '/' || oczekiwane || '   brakuje: ' || brakuje
from polityki
union all
-- ⬇ TO JEST NAJWAŻNIEJSZY WIERSZ przy błędzie „new row violates RLS policy"
select 4, 'Poprawka 003b',
       case
         when wyrazenie is null then 'BRAK POLITYKI SELECT'
         when wyrazenie like '%created_by%' then 'OK'
         else 'NIEZASTOSOWANA — odpal 003b_fix_startups_rls.sql'
       end,
       coalesce(wyrazenie, '(brak)')
from fix_003b
union all
select 5, 'Treść etapów',
       case when opis = 'brak treści' then 'BRAKUJE' else 'OK' end,
       opis
from tresc
union all
select 6, 'Dane',
       'INFO',
       userow || ' kont, ' || po_onboardingu || ' po onboardingu, '
         || startupow || ' startupów, ' || odpowiedzi || ' odpowiedzi w etapach'
from konta
order by nr;
