-- ===========================================================================
-- METRYKI_social.sql — podstawowy pomiar warstwy Social
-- ===========================================================================
--
-- TYLKO ODCZYT. Odpal w Supabase → SQL Editor (rola z dostępem do wszystkich
-- wierszy, np. domyślna w edytorze). Nic nie zmienia.
--
-- Źródło: „Vairo rozwój socialu”, sekcja „Kolejność i sprawdzenie działania”:
-- przyjęte zaproszenia i późniejsza aktywność zaproszonych, zgłoszenia do
-- projektów zakończone członkostwem. To nie jest panel analityki — CLAUDE.md
-- trzyma zaawansowaną analitykę poza MVP. Prośby, odpowiedzi i testy dojdą
-- tutaj, kiedy powstanie sekcja „Pytania i feedback”.
--
-- Okno czasowe: zmień `30 days` w CTE `okno`.
-- ===========================================================================

with okno as (select now() - interval '30 days' as od)

select 'Linki zaproszeń utworzone' as metryka,
       count(*)::text as wartosc
  from public.startup_invite_links, okno
 where created_at >= okno.od

union all
select 'Dołączenia przez link (suma użyć)',
       coalesce(sum(use_count), 0)::text
  from public.startup_invite_links, okno
 where created_at >= okno.od

union all
select 'Linki, z których nikt nie dołączył',
       count(*)::text
  from public.startup_invite_links, okno
 where created_at >= okno.od and use_count = 0

union all
-- Członkostwa poza Founderami = osoby, które doszły do cudzego teamu
-- (link, zaproszenie albo zgłoszenie).
select 'Nowi członkowie teamów (bez Founderów)',
       count(*)::text
  from public.startup_members m, okno
 where m.joined_at >= okno.od and m.role <> 'founder'

union all
-- Aktywność po dołączeniu: czy nowa osoba zrobiła cokolwiek w teamie —
-- cel, zadanie albo odpowiedź w etapie — po dniu dołączenia.
select 'Z nich aktywni po dołączeniu (cel, zadanie lub odpowiedź)',
       count(*)::text
  from public.startup_members m, okno
 where m.joined_at >= okno.od and m.role <> 'founder'
   and (
     exists (select 1 from public.goals g
              where g.startup_id = m.startup_id and g.created_by = m.profile_id
                and g.created_at > m.joined_at)
     or exists (select 1 from public.tasks t
                 where t.startup_id = m.startup_id and t.created_by = m.profile_id
                   and t.created_at > m.joined_at)
     or exists (select 1 from public.stage_answers a
                  join public.startup_stages s on s.id = a.startup_stage_id
                 where s.startup_id = m.startup_id and a.answered_by = m.profile_id
                   and a.updated_at > m.joined_at)
   )

union all
select 'Zgłoszenia do projektów (application)',
       count(*)::text
  from public.startup_join_requests r, okno
 where r.direction = 'application' and r.created_at >= okno.od

union all
select 'Zgłoszenia zakończone członkostwem',
       count(*)::text
  from public.startup_join_requests r, okno
 where r.direction = 'application' and r.status = 'accepted' and r.created_at >= okno.od

union all
select 'Mediana czasu odpowiedzi na zgłoszenie (godziny)',
       coalesce(round((percentile_cont(0.5) within group (
         order by extract(epoch from (r.responded_at - r.created_at)) / 3600))::numeric, 1)::text, '—')
  from public.startup_join_requests r, okno
 where r.direction = 'application' and r.responded_at is not null and r.created_at >= okno.od

union all
select 'Zaczepki wysłane',
       count(*)::text
  from public.contact_signals c, okno
 where c.created_at >= okno.od

union all
select 'Zaczepki przyjęte (rozmowa)',
       count(*)::text
  from public.contact_signals c, okno
 where c.status = 'accepted' and c.created_at >= okno.od;
