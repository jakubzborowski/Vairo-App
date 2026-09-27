-- ============================================================================
-- 017 · Treść etapu: Preparation (v1)
-- ----------------------------------------------------------------------------
-- PLIK GENEROWANY — nie edytuj ręcznie.
-- Źródło: supabase/content/preparation-v1.json
-- Regeneracja: npm run content:build -- preparation-v1
--
-- Idempotentny: ponowne uruchomienie aktualizuje treść i usuwa elementy,
-- które zniknęły z pliku źródłowego. Odpowiedzi userów zostają nietknięte,
-- bo są kluczowane po answer_key, nie po id.
-- ============================================================================

do $$
declare
  v_template uuid;
  v_category uuid;
  v_point    uuid;
  v_subpoint uuid;
begin

  insert into public.stage_templates
    (key, version, title, subtitle, intro, position, finish_label, published_at)
  values ('preparation', 1, 'Preparation', 'Przygotuj się do budowy',
          'Masz pomysł i pierwsze wnioski z rozmów. Teraz rozpisz, co trzeba zrobić do pierwszej wersji, zdobądź pomoc, jeśli jej potrzebujesz, zbierz pliki i rzeczy na start. Osoba pracująca sama może przejść ten etap bez zespołu.', 3, 'Zaczynam budowę', now())
  on conflict (key, version) do update set
    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,
    position = excluded.position, finish_label = excluded.finish_label,
    published_at = now()
  returning id into v_template;

  -- ═══ kategoria: Ogólne ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'general', 'Ogólne', 'Ta część dotyczy każdego startupu. Kategorie SaaS, Hardware, B2B i B2C dołożą własne punkty, gdy ich treść będzie zatwierdzona.',
          true, 1)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Co możemy zrobić sami? A co nie?
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'scope', 'Co możemy zrobić sami? A co nie?', null,
          'Około 15 minut', 'Wypisz prace prowadzące do pierwszej wersji, z której ktoś może skorzystać. Zapisuj konkretny wynik, na przykład „przygotować formularz zgłoszeń”, a nie hasło „technologia”. Przy każdym zadaniu wskaż, czy zrobisz je sam, musisz się nauczyć, czy szukasz kogoś. Co-foundera szukaj przy długotrwałej odpowiedzialności za ważny obszar. Do jednorazowej pracy wystarczy wykonawca. Udziały traktuj jako wstępną propozycję do rozmowy, nie jako zapłatę za jedno zadanie.',
          '["Michael Seibel, How to Plan an MVP (Startup School, 2019)","Michael Seibel, One Order of Operations for Starting a Startup (2018)","Y Combinator, 10 Questions to Discuss with a Potential Co-founder (2023)"]'::jsonb, null,
          null, 1)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'tasks', 'Rozpisz zadania do pierwszej wersji',
          null, false,
          null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'mvp_tasks', 'list_long',
          'Lista rzeczy, które muszą zostać zrobione do pierwszej wersji.', 'Wybierz zadania prowadzące do głównej korzyści. Dodatki możesz dopisać później.', 'Przygotować instrukcję korzystania.
Uruchomić prosty formularz.
Wykonać model obudowy.',
          true, 'preparation.scope.tasks.mvp_tasks',
          '{"min_items":1,"max_items":30}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['mvp_tasks']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'split', 'Podziel te zadania',
          null, false,
          null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'alone', 'list_long',
          'Które z tych rzeczy możesz zrobić sam?', 'Jeśli nie ma takich zadań, wpisz „brak”.', 'Przygotować instrukcję korzystania.',
          true, 'preparation.scope.split.alone',
          '{"min_items":1,"max_items":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'learn', 'list_long',
          'Których możesz się nauczyć?', 'Wybieraj umiejętność przy konkretnym zadaniu. Jeśli nauka mocno odsunęłaby start, przenieś zadanie do pomocy innych osób.', 'Uruchomić prosty formularz w wybranym narzędziu.',
          true, 'preparation.scope.split.learn',
          '{"min_items":1,"max_items":20}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'others', 'list_long',
          'Do których potrzebujesz innych osób?', 'Jeśli dasz radę sam, wpisz „brak”.', 'Wykonać model obudowy.',
          true, 'preparation.scope.split.others',
          '{"min_items":1,"max_items":20}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['alone', 'learn', 'others']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'mode', 'Czy szukasz ludzi?',
          null, false,
          null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'choice', 'select',
          'Jak chcesz przejść ten etap?', 'Wybór „Dam radę sam” pomija szukanie ludzi, wspólną próbę i zasady współpracy. Pliki i lista braków zostają.', null,
          true, 'preparation.scope.mode.choice',
          '{"options":[{"value":"alone","label":"Dam radę sam"},{"value":"cofounder","label":"Szukam co-foundera"},{"value":"helpers","label":"Szukam wykonawców, nie co-foundera"},{"value":"both","label":"Szukam co-foundera i wykonawców"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['choice']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'cofounder', 'Profil co-foundera',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone","helpers"]}'::jsonb, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'profile', 'records',
          'Opisz, kogo szukasz jako co-foundera.', 'Jedna pozycja to jedna rola. Możesz dopisać własne pole, jeśli brakuje czegoś w profilu.', 'Odpowiedzialność: pierwsza wersja programu i jej rozwój po testach. Udziały: 15–25% do rozmowy.',
          true, 'preparation.scope.cofounder.profile',
          '{"add_label":"Dodaj kolejną rolę","allow_custom_columns":true,"max_items":5,"columns":[{"key":"responsibility","label":"Odpowiedzialność","placeholder":"Za co ta osoba odpowiada"},{"key":"equity","label":"Zakres udziałów do rozmowy","placeholder":"Np. 10–20%"},{"key":"experience","label":"Wymagane doświadczenie","placeholder":"Co powinna umieć pokazać"},{"key":"approach","label":"Podejście","placeholder":"Jakiej współpracy oczekujesz"},{"key":"hours","label":"Wolne godziny i zaangażowanie","placeholder":"Ile czasu może poświęcić"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['profile']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'helpers', 'Osoby potrzebne do konkretnej pracy',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone","cofounder"]}'::jsonb, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'roles', 'records',
          'Zadania, które są za małe na co-foundera, ale nie zrobisz ich sam.', 'Przy każdej pozycji napisz umiejętność i czy możesz za tę pracę zapłacić.', 'Projekt opakowania gotowego do drukarni. Szukam kogoś, kto przygotowywał takie pliki. Budżet: 800 zł.',
          true, 'preparation.scope.helpers.roles',
          '{"add_label":"Dodaj osobę","max_items":12,"columns":[{"key":"task","label":"Zadanie","placeholder":"Co ma powstać"},{"key":"skill","label":"Umiejętność i doświadczenie","placeholder":"Czego szukasz"},{"key":"pay","label":"Czy możesz zapłacić i ile","placeholder":"Np. 800 zł albo brak budżetu"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['roles']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['tasks', 'split', 'mode', 'cofounder', 'helpers']);

  -- ── punkt 2: Zdobądź pomoc i pierwsze kontakty
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'find-help', 'Zdobądź pomoc i pierwsze kontakty', null,
          'Około 20 minut', 'Użyj tego, co zapisałeś w poprzednim punkcie. Profil w Social ma mówić, co tworzysz, na jakim jesteś etapie i w czym ktoś może pomóc. Szukaj osób, których umiejętności pasują do zadań. Po odpowiedzi zapisz w tabeli, czy odpisali, co umieją i czy będziecie współpracować. Do startupu dodajesz tylko osoby, które potwierdziły chęć udziału.',
          '["Michael Seibel, One Order of Operations for Starting a Startup (2018)"]'::jsonb, null,
          null, 2)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'social', 'Użyj warstwy Social',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'opened', 'action',
          'Uzupełnij profil swój i startupu, a potem szukaj ludzi w sieci Vairo.', 'Ten krok otwiera Social. Zaznacz go, gdy profil jest gotowy i wiesz, kogo szukasz.', null,
          true, 'preparation.find-help.social.opened',
          '{"href":"/app/social/me","label":"Otwórz Social","confirm_label":"Profil jest gotowy"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['opened']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'outreach', 'Zapisz, kogo pytałeś',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'contacts', 'records',
          'Kontakty: osoba albo firma, czy odpowiedziała, jakie ma umiejętności i czy będziecie współpracować.', 'Jedna pozycja to jedna rozmowa. Gdy ktoś jeszcze nie odpisał, wpisz „czeka”.', 'Ola Kowalska. Odpowiedziała. Robiła modele podobnych części. Ustalamy wspólną próbę.',
          true, 'preparation.find-help.outreach.contacts',
          '{"add_label":"Dodaj kontakt","max_items":20,"columns":[{"key":"who","label":"Imię i nazwisko albo firma"},{"key":"reply","label":"Czy odpowiedziała"},{"key":"skills","label":"Umiejętności"},{"key":"together","label":"Czy będziecie współpracować"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['contacts']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'pick', 'Wybierz osoby z platformy',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'people', 'people',
          'Zaznacz osoby, z którymi chcesz iść dalej.', 'To prawdziwe profile z Vairo. Zaproszenie do startupu wysyłasz z karty osoby w Social. Samo zaznaczenie nie tworzy członkostwa. Jeśli nikogo nie wybierasz, zapisz pustą listę.', null,
          true, 'preparation.find-help.pick.people',
          '{"empty_ok":true}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['people']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['social', 'outreach', 'pick']);

  -- ── punkt 3: Sprawdźcie, czy potraficie razem pracować
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'trial', 'Sprawdźcie, czy potraficie razem pracować', null,
          'Kilka dni', 'Wybierzcie z listy zadań pracę, której wynik przyda się w projekcie i którą da się skończyć w kilka dni. Przed startem ustalcie, co ma być gotowe, kto robi którą część i kiedy to łączycie. Po próbie zapiszcie, co powstało. Jedna udana próba nie zamyka wszystkich spraw, ale mówi, czy chcecie kontynuować w tym składzie.',
          '["Y Combinator, 10 Questions to Discuss with a Potential Co-founder (2023)"]'::jsonb, null,
          null, 3)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'task', 'Wybierzcie wspólne zadanie',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'which', 'short_text',
          'Które niewielkie zadanie z listy bierzecie na próbę?', 'Ma wykorzystać różne umiejętności i zająć najwyżej kilka dni.', 'Model mocowania uchwytu rowerowego.',
          true, 'preparation.trial.task.which',
          '{"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'plan', 'short_text',
          'Co ma powstać, kto robi którą część i kiedy kończycie?', 'Wystarczy jedno zdanie na osobę.', 'Ola przygotuje model, ja dostarczę wymiary. W piątek oglądamy wynik.',
          true, 'preparation.trial.task.plan',
          '{"max":500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['which', 'plan']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'result', 'Zapiszcie wynik próby',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'outcome', 'long_text',
          'Co powstało i do czego możecie tego użyć?', 'Krótki opis albo link. Wynik zostaje zwykłą odpowiedzią w tym etapie.', 'Powstał model mocowania. Pasuje do koszyka, ale zaczep wymaga poprawki. Link: …',
          true, 'preparation.trial.result.outcome',
          '{"max":2000}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'decision', 'long_text',
          'Co dalej z tym składem?', 'Jeśli niczego nie zmieniacie, wystarczy „Kontynuujemy w tym składzie”. Inaczej zapiszcie tylko potrzebną zmianę.', 'Kontynuujemy. Przed kolejnym modelem najpierw przekazuję komplet wymiarów.',
          true, 'preparation.trial.result.decision',
          '{"max":2000}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ready', 'checkmark',
          'Team jest gotowy do dalszej pracy.', 'Zaznacz, gdy macie uzgodniony skład. Jedna próba nie musi rozwiązać wszystkiego.', null,
          true, 'preparation.trial.result.ready',
          '{"confirm_label":"Team gotowy"}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['outcome', 'decision', 'ready']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['task', 'result']);

  -- ── punkt 4: Uruchom miejsce do pracy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'workspace', 'Uruchom miejsce do pracy', null,
          'Około 10 minut', 'Zbierz w Plikach materiały, do których zespół będzie wracał: opis pomysłu, wnioski z rozmów, wyniki dotychczasowych zadań. Nazwij je tak, żeby było wiadomo, co zawierają. Zasady współpracy zapisujcie po jednej: dostępność, kontakt, decyzje, warunki udziału. Jeśli działasz sam, zasady pomijasz.',
          '["Y Combinator, 10 Questions to Discuss with a Potential Co-founder (2023)"]'::jsonb, null,
          null, 4)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'files', 'Zbierz materiały w Plikach',
          null, false,
          null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'collected', 'action',
          'Wrzuć aktualne materiały projektu do sekcji Pliki i udostępnij je osobom, które będą z nich korzystać.', 'Zaznacz, gdy dokumenty są w jednym miejscu i da się je otworzyć.', null,
          true, 'preparation.workspace.files.collected',
          '{"href":"/app/files","label":"Przejdź do Plików","confirm_label":"Materiały są zebrane"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['collected']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'rules', 'Ustalcie zasady współpracy',
          null, false,
          null, '{"answer_key":"preparation.scope.mode.choice","one_of":["alone"]}'::jsonb, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'agreements', 'list_long',
          'Zaakceptowane ustalenia, po jednym w każdym wpisie.', 'Dostępność, sposób kontaktu, podejmowanie decyzji i warunki udziału. Nieuzgodnioną sprawę oznacz jako otwartą.', 'Każde z nas przeznacza na projekt około pięciu godzin tygodniowo.
Wydatki zatwierdzamy razem.',
          true, 'preparation.workspace.rules.agreements',
          '{"min_items":1,"max_items":12}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['agreements']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['files', 'rules']);

  -- ── punkt 5: Zbierz rzeczy potrzebne na start
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'supplies', 'Zbierz rzeczy potrzebne na start', null,
          'Około 10 minut', 'Dopisz tylko to, czego brakuje do pierwszych zadań. Możesz to kupić, pożyczyć albo dostać bezpłatnie. Przy koszcie wystarczy orientacyjna kwota: jednorazowo, miesięcznie albo za użycie. Nieznaną cenę wpisz jako „do sprawdzenia”, a nie jako zero. Jeśli masz już wszystko, zostaw listę pustą i zapisz.',
          '["Dominika Blackappl, Practical Design: MVP Spec (2016)","Michael Seibel, How to Plan an MVP (Startup School, 2019)"]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'missing', 'Czego brakuje, żeby zacząć?',
          null, false,
          null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'items', 'records',
          'Dodaj tylko brakujące rzeczy.', 'Nazwa, skąd ją weźmiesz i orientacyjny koszt. Pusta lista znaczy, że możesz zacząć tym, co już masz.', 'Wydruk pierwszego modelu. Uczelniana pracownia. Około 60 zł za materiał.',
          true, 'preparation.supplies.missing.items',
          '{"empty_ok":true,"add_label":"Dodaj rzecz","max_items":20,"columns":[{"key":"thing","label":"Potrzebna rzecz","placeholder":"Nazwa, możesz dopisać link"},{"key":"source","label":"Skąd ją weźmiesz","placeholder":"Kupię, pożyczę, mam w zespole"},{"key":"cost","label":"Koszt","placeholder":"Np. 200 zł jednorazowo albo bezpłatnie"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['items']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['missing']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['scope', 'find-help', 'trial', 'workspace', 'supplies']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general']);

end;
$$;

-- Weryfikacja: policz, co wjechało
select
  (select count(*) from public.stage_points p
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'preparation') as punktow,
  (select count(*) from public.stage_subpoints s
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'preparation') as podpunktow,
  (select count(*) from public.stage_fields f
     join public.stage_subpoints s on s.id = f.subpoint_id
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'preparation') as pol;
