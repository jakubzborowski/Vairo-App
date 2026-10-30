-- ===========================================================================
-- SPRAWDZ_MIGRACJE.sql — czy baza jest w stanie, którego oczekuje kod
-- ===========================================================================
--
-- TYLKO ODCZYT. Nic nie zmienia, można odpalać dowolną liczbę razy.
--
-- Odpal w Supabase → SQL Editor PO migracjach. Wynik to JEDNA tabela,
-- w której są trzy rodzaje wierszy:
--   sprawdzenie   — rzecz, której wymaga kod; przy `ok = false` kolumna
--                   `napraw` mówi, co odpalić
--   treść etapu   — ile punktów i warunków celów ma każdy z pięciu etapów
--   plik-sierota  — plik w Storage bez właściciela, do ręcznego skasowania
-- Wiersze z `ok = false` są na górze — wystarczy spojrzeć na początek.
--
-- Dlaczego ten plik w ogóle istnieje: trzy scalenia gałęzi (Social,
-- Execution, MVP) przenumerowały migracje 018–028. Najgroźniejsze skutki
-- złej kolejności NIE dają błędu — np. `recalc_subpoint_progress()` z 021
-- odpalona po 025 nadpisuje wersję z celami i postęp etapu po cichu
-- przestaje liczyć Goals. `DIAGNOSTYKA.sql` sprawdza tylko stan sprzed 005,
-- więc tego nie zauważy. Ten plik sprawdza dokładnie te rzeczy.
--
-- Przy każdej nowej migracji, która definiuje funkcję albo tworzy coś, od
-- czego zależą późniejsze pliki, dopisz tu jeden wiersz.
-- ===========================================================================

-- Licznik warunków celów dla etapu — przez dynamiczny SQL, bo przed 025
-- tabeli `stage_goal_conditions` nie ma, a zwykłe odwołanie wywaliłoby CAŁY
-- skrypt na „relation does not exist" zamiast pokazać czytelne `false`.
-- Funkcja w `pg_temp` znika razem z sesją — w bazie nic nie zostaje.
create or replace function pg_temp.goal_conditions_for(p_stage text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  if to_regclass('public.stage_goal_conditions') is null then
    return null;
  end if;
  execute
    'select count(*)
       from public.stage_goal_conditions gc
       join public.stage_subpoints s on s.id = gc.subpoint_id
       join public.stage_points p on p.id = s.point_id
       join public.stage_categories c on c.id = p.category_id
       join public.stage_templates t on t.id = c.template_id
      where t.key = $1'
    into n using p_stage;
  return n;
end;
$$;

with checks(nr, migracja, co, ok, napraw) as (
  values
  -- --- Social -------------------------------------------------------------
  (16, '016', 'startups.show_stage_publicly (zgoda na etap publicznie)',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'startups'
               and column_name = 'show_stage_publicly'),
    'odpal 016_public_stage_consent'),

  (17, '017', 'respond_join_request() przyjmuje ZAWSZE jako Member',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'respond_join_request'
               -- Stara wersja z 009 też zawiera 'member' (w gałęzi `case`), więc
               -- rozróżnia je dopiero to, czego w nowej NIE ma: roli z propozycji.
               and p.prosrc not like '%then req.proposed_role%'),
    'odpal 017_join_as_member — bez niej przyjęcie zaproszenia nadaje rolę z propozycji'),

  (18, '018', 'notifications w publikacji Realtime (powiadomienia na żywo)',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and tablename = 'notifications'),
    'odpal 018_notifications_realtime'),

  (19, '019', 'messages w publikacji Realtime (czat na żywo)',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and tablename = 'messages'),
    'odpal 019_chat_identity_and_realtime'),

  (20, '019', 'widok contact_profiles (imię rozmówcy spoza teamu)',
    exists (select 1 from information_schema.views
             where table_schema = 'public' and table_name = 'contact_profiles'),
    'odpal 019 — bez niej czat pokazuje „Bez imienia"'),

  -- Odwrotnie niż można by się spodziewać: tych triggerów ma NIE być.
  -- Pierwsza wersja 020 kasowała nimi wiersze z `storage.objects`, a Supabase
  -- blokuje każdy taki DELETE — więc kaskada przy usunięciu startupu albo
  -- konta wywalałaby się na „Direct deletion from storage tables is not
  -- allowed". Pliki kasuje wyłącznie aplikacja, przez API Storage.
  (21, '020', 'brak triggerów kasujących z Storage (blokowałyby usuwanie startupu i konta)',
    (select count(*) = 0 from pg_trigger
      where tgname in ('startup_stages_cleanup_files', 'startups_cleanup_logo',
                       'profiles_cleanup_avatar')),
    'odpal 020_storage_cleanup w NOWEJ wersji — usuwa triggery ze starej'),

  -- --- Preparation ----------------------------------------------------------
  (30, '021', 'stage_subpoints.skip_when + tabela startup_files',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'stage_subpoints'
               and column_name = 'skip_when')
    and to_regclass('public.startup_files') is not null,
    'odpal 021_preparation_tools'),

  -- --- Execution ------------------------------------------------------------
  (40, '025', 'tabele trackera: goals, tasks, goal_events, stage_goal_conditions',
    to_regclass('public.goals') is not null
    and to_regclass('public.tasks') is not null
    and to_regclass('public.goal_events') is not null
    and to_regclass('public.stage_goal_conditions') is not null,
    'odpal 025_execution_goals (po 024)'),

  -- NAJWAŻNIEJSZE sprawdzenie w tym pliku. Wersja z 025 deleguje do
  -- refresh_one_subpoint() (tam są warunki celów); wersja z 021 liczy
  -- wszystko w miejscu i o celach nie wie. Jeśli tu jest false, 021 biegła
  -- PO 025 i postęp etapów nie liczy Goals — bez żadnego komunikatu.
  (41, '025', 'recalc_subpoint_progress() to wersja z celami (z 025, nie z 021)',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'recalc_subpoint_progress'
               and p.prosrc like '%refresh_one_subpoint%'),
    'ODPAL 025 JESZCZE RAZ (a potem 026 i 027) — 021 nadpisała funkcję wersją bez celów'),

  -- Strażnik z 015: wersja z 021 go zgubiła. Bez niego usunięcie startupu
  -- znów może się wywalić na wpisie postępu do już usuniętego etapu.
  (42, '015/025', 'recalc_subpoint_progress() ma strażnika kaskady z 015',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'recalc_subpoint_progress'
               and p.prosrc like '%not exists (select 1 from public.startup_stages where id = v_stage)%'),
    'odpal 025 jeszcze raz'),

  (43, '025', 'startups.execution_unlocked_at (tracker w menu)',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'startups'
               and column_name = 'execution_unlocked_at'),
    'odpal 025'),

  (44, '026', 'stage_subpoints.depends_on + tabela startup_documents',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'stage_subpoints'
               and column_name = 'depends_on')
    and to_regclass('public.startup_documents') is not null,
    'odpal 026_execution_content_rules'),

  -- --- Redesign (029–033) -----------------------------------------------------
  -- Aplikacja działa bez 029–031 (chowa pola, których nie ma gdzie zapisać),
  -- więc `false` tu nie psuje ekranów — tylko wyłącza nowe funkcje.
  (45, '029', 'zadania: notatka, powód blokady, completed_at + tabela task_events',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'tasks'
               and column_name = 'blocker_note')
    and to_regclass('public.task_events') is not null,
    'odpal 029_task_details (po 028)'),

  (46, '030', 'foldery w Plikach: startup_file_folders + startup_files.folder_id',
    to_regclass('public.startup_file_folders') is not null
    and exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'startup_files'
                   and column_name = 'folder_id'),
    'odpal 030_file_folders (po 029)'),

  (47, '031', 'startup_documents.updated_by (kto zmieniał ostatnio)',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'startup_documents'
               and column_name = 'updated_by'),
    'odpal 031_document_editor (po 030)'),

  -- Bez tego usunięcie konta osoby, która prowadziła cel albo zadanie
  -- w teamie, który zostaje, wywala się na kluczu obcym w historii.
  (48, '032', 'historia celów i zadań nie blokuje usuwania konta',
    exists (select 1 from pg_trigger where tgname = 'goal_events_drop_missing_actor')
    and (to_regclass('public.task_events') is null
         or exists (select 1 from pg_trigger where tgname = 'task_events_drop_missing_actor')),
    'odpal 032_events_actor_guard (po 031; jeśli 029 doszła później — odpal 032 jeszcze raz)'),

  -- Ta jest WYMAGANA, w przeciwieństwie do 029–031: kreator profilu
  -- publicznego zapisuje `public_name`, a zgłoszenia i powiadomienia ją czytają.
  -- Sprawdzamy też widoki — sama kolumna bez nich znaczyłaby, że obcy dalej
  -- widzą imię z konta zamiast pseudonimu.
  (49, '033', 'nazwa publiczna: profiles.public_name + widoki publiczne ją oddają',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'public_name')
    and (select count(*) = 3 from pg_views
          where schemaname = 'public'
            and viewname in ('public_profiles', 'public_startups', 'contact_profiles')
            and definition like '%public_name%'),
    'odpal 033_public_name (po 032) — bez niej kreator profilu w Social nie zapisze, a zgłoszenia i powiadomienia pokażą „Brakuje migracji 033”'),

  (49, '034', 'treść Idei po uwagach: nowy punkt B2C + „brak konkurencji” zalicza resztę',
    exists (select 1 from public.stage_fields
             where shared_key = 'idea.zakup-konsumencki.role-zakupu.dla-kogo')
    and exists (select 1 from public.stage_fields
                 where shared_key = 'idea.konkurencja.brak-konkurencji.potwierdzam')
    -- najnowsza wersja 034: bez „Opisz rozwiązanie” w hipotezie
    and not exists (select 1 from public.stage_fields
                     where shared_key = 'idea.hipoteza-rozwiazania.opisz-rozwiazanie.co-robi'),
    'odpal 034_content_idea_v1 (po 033) — także jeśli starsza wersja 034 już biegła'),

  (49, '035', 'zaproszenie do teamu linkiem: tabela + funkcja przyjmująca',
    to_regclass('public.startup_invite_links') is not null
    and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'accept_invite_link'),
    'odpal 035_team_invite_links (po 034) — bez niej karta „Zaproś znajomych linkiem” pokaże błąd'),

  (49, '036', '„Porozmawiaj z osobami” w Preparation (treść przeniesiona z Idei)',
    exists (select 1
              from public.stage_fields f
              join public.stage_subpoints s  on s.id = f.subpoint_id
              join public.stage_points p     on p.id = s.point_id
              join public.stage_categories c on c.id = p.category_id
              join public.stage_templates t  on t.id = c.template_id
             where t.key = 'preparation'
               and f.shared_key = 'idea.rozmowy.znajdz-rozmowcow.osoby'),
    'odpal 036_content_preparation_v1 (po 035)'),

  (49, '037', 'odpowiedzi idą za polem do innego etapu (trigger na startup_stages)',
    exists (select 1 from pg_trigger
             where tgname = 'startup_stages_carry_answers' and not tgisinternal),
    'odpal 037_carry_answers_between_stages (po 036) — bez niej rozmowy wpisane w Idei nie pojawią się w Preparation'),

  -- --- Treść etapów ---------------------------------------------------------
  (50, '006–028', 'wszystkie 5 etapów ma opublikowaną treść',
    (select count(distinct key) = 5 from public.stage_templates
      where key in ('ambition', 'idea', 'preparation', 'execution', 'mvp')
        and published_at is not null),
    'brakuje któregoś z: 006, 007, 024, 027, 028 — porównaj z listą niżej'),

  (51, '027', 'Execution ma warunki celów',
    coalesce(pg_temp.goal_conditions_for('execution'), 0) > 0,
    'odpal 027_content_execution_v1 (po 026)'),

  (52, '028', 'MVP ma warunki celów (treść MVP biegła PO 025)',
    coalesce(pg_temp.goal_conditions_for('mvp'), 0) > 0,
    'odpal 028_content_mvp_v1 (po 027)'),

  -- --- Storage --------------------------------------------------------------
  (60, '002/005/009', 'buckety avatars, stage-files, startup-logos',
    (select count(*) = 3 from storage.buckets
      where id in ('avatars', 'stage-files', 'startup-logos')),
    'odpal 002, 005 i 009 — bucketów nie zakłada się ręcznie')
),

-- Ile czego ma każdy etap. Etap bez punktów albo bez publikacji = migracja
-- treści nie wjechała w całości.
tresc as (
  select
    t.key as etap,
    t.position,
    t.published_at is not null as opublikowany,
    count(distinct p.id) as punkty,
    count(distinct s.id) as podpunkty,
    pg_temp.goal_conditions_for(t.key) as warunki
  from public.stage_templates t
  left join public.stage_categories c on c.template_id = t.id
  left join public.stage_points p on p.category_id = c.id
  left join public.stage_subpoints s on s.point_id = p.id
  group by t.key, t.position, t.published_at
),

-- Pliki-sieroty: leżą w Storage, ale ich właściciel (etap, startup, profil)
-- już nie istnieje. SQL NIE MOŻE ich skasować — Supabase blokuje DELETE na
-- tabelach Storage. Kasuje się je ręcznie: Supabase → Storage → bucket →
-- ścieżka z kolumny `co`.
--
-- `stage-files` ma DWA układy ścieżek i trzeba je rozróżnić, inaczej każdy
-- plik biblioteki wyglądałby na sierotę:
--   <startup_stage_id>/<answer_key>/<plik>   odpowiedzi — właścicielem jest etap
--   <startup_id>/library/<plik>              biblioteka — właścicielem jest startup
sieroty as (
  select o.bucket_id, o.name
  from storage.objects o
  where
    (o.bucket_id = 'avatars'
      and not exists (select 1 from public.profiles p
                       where p.id::text = (storage.foldername(o.name))[1]))
    or (o.bucket_id = 'startup-logos'
      and not exists (select 1 from public.startups s
                       where s.id::text = (storage.foldername(o.name))[1]))
    or (o.bucket_id = 'stage-files'
      and coalesce((storage.foldername(o.name))[2], '') = 'library'
      and not exists (select 1 from public.startups s
                       where s.id::text = (storage.foldername(o.name))[1]))
    or (o.bucket_id = 'stage-files'
      and coalesce((storage.foldername(o.name))[2], '') <> 'library'
      and not exists (select 1 from public.startup_stages ss
                       where ss.id::text = (storage.foldername(o.name))[1]))
)

-- JEDNA tabela wyników. Edytor SQL w Supabase pokazuje wyłącznie wynik
-- ostatniego zapytania — przy trzech osobnych SELECT-ach widać by było tylko
-- ostatni. Błędy (ok = false) są na górze.
select rodzaj, migracja, co, ok, napraw
from (
  select 1 as grupa, nr as kolejnosc, 'sprawdzenie' as rodzaj, migracja, co, ok,
         case when ok then '' else napraw end as napraw
  from checks

  union all

  select 2, position, 'treść etapu', '—',
         etap || ': ' || punkty || ' pkt, ' || podpunkty || ' podpkt'
           || coalesce(', ' || warunki || ' warunków celów', ''),
         opublikowany and punkty > 0,
         case when opublikowany and punkty > 0 then ''
              else 'treść nie wjechała — odpal migrację treści tego etapu' end
  from tresc

  union all

  select 3, 0, 'plik-sierota', '—', bucket_id || ' / ' || name, false,
         'skasuj ręcznie: Supabase → Storage'
  from sieroty
) wyniki
order by ok, grupa, kolejnosc;
