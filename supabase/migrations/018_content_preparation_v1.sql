-- ============================================================================
-- 018 · Treść etapu: Preparation (v1)
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
  values (v_template, 'general', 'Ogólne', 'Ta część dotyczy każdego startupu. SaaS, Hardware, B2B i B2C dokładają własne punkty tylko wtedy, gdy startup ma tę kategorię.',
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

  -- ═══ kategoria: SaaS ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'saas', 'SaaS', 'Dopisz zasady dostępu, koszt pierwszych testów i — jeśli pierwsza wersja jest płatna — co dzieje się z kontem po płatności.',
          false, 2)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Ustal, kto ma dostęp do czego
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'access', 'Ustal, kto ma dostęp do czego', null,
          'Około 15 minut', 'Wyobraź sobie dwóch różnych klientów. Zapisz, które materiały należą do każdego z nich i czy cokolwiek jest wspólne. W notatkach prywatnych każda osoba ma własne materiały. W programie dla firm pracownicy korzystają ze wspólnej przestrzeni firmy i logują się własnymi kontami. Potem zapisz, co dana rola może zobaczyć, zmienić i usunąć oraz czy może zapraszać innych. Dodaj tylko role potrzebne w pierwszej wersji. Jeśli każdy ma własne materiały i te same możliwości, wystarczy jeden wpis. Omów to z osobą, która buduje program: musicie umieć odpowiedzieć, czy ta osoba może zobaczyć albo zmienić ten dokument. Wprowadzenie zasad i sprawdzenie zabezpieczeń należy do budowy.',
          '["Microsoft, Tenancy models for a multitenant solution","Alex Kracov, The First 90 Days of Building a SaaS Startup"]'::jsonb, null,
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
  values (v_point, 'space', 'Czyje są dane',
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
  values (v_subpoint, 'model', 'short_text',
          'Czy użytkownicy mają osobne dane, czy współdzielą przestrzeń, na przykład firmy albo zespołu?', 'Zapisz wybrany sposób jednym konkretnym zdaniem.', 'Każda firma ma własne dokumenty. Pracownicy logują się własnymi kontami. Firma A nie widzi dokumentów firmy B.',
          true, 'preparation.access.space.model',
          '{"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['model']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'roles', 'Co może każda rola',
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
  values (v_subpoint, 'permissions', 'records',
          'Zapisz uprawnienia każdego rodzaju użytkownika.', 'Jedna pozycja to jedna rola. Jeśli wszyscy mogą to samo, wystarczy jeden wpis.', 'Właściciel widzi, zmienia i usuwa dokumenty firmy oraz zaprasza ludzi. Współpracownik widzi i zmienia udostępnione dokumenty, ale nie zarządza dostępem.',
          true, 'preparation.access.roles.permissions',
          '{"add_label":"Dodaj rolę","max_items":8,"columns":[{"key":"role","label":"Rola","placeholder":"Np. właściciel przestrzeni"},{"key":"see","label":"Co może zobaczyć","placeholder":"Np. dokumenty swojej firmy"},{"key":"change","label":"Co może zmienić albo usunąć","placeholder":"Np. własne dokumenty, nie cudze"},{"key":"invite","label":"Czy może zapraszać innych","placeholder":"Tak, nie, albo tylko do odczytu"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['permissions']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['space', 'roles']);

  -- ── punkt 2: Sprawdź, ile będą kosztować pierwsze testy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'test-cost', 'Sprawdź, ile będą kosztować pierwsze testy', null,
          'Około 20 minut', 'Zacznij od liczby testerów i od tego, ile naprawdę zużyją: minuty nagrań, miejsce na pliki, liczba zadań. Sama liczba kont często nie wystarcza. Weź ceny z listy braków w Ogólne i dopisz brakujące ceny usług, które działają w trakcie testów. Rozdziel opłatę stałą, na przykład serwer co miesiąc, od opłaty za użycie. Nieznaną kwotę oznacz „do sprawdzenia”, nie zerem. Sprawdź, co dostawca zrobi po przekroczeniu limitu: dopłata, zatrzymanie, czy droższy pakiet, i czy limit jest na cały program, czy na jedną osobę. Jeśli koszt jest za wysoki, ogranicz to, co go napędza. Sam zapis limitu w Vairo nie zatrzyma naliczania u dostawcy — uzgodnij to z osobą budującą program. Jeśli pakiet ma stałą cenę i sam blokuje nadmiar, napisz to zamiast wymyślać dodatkowy limit.',
          '["Stripe, How to start a SaaS business","Microsoft, Pricing models for a multitenant solution","Userpilot, How to build a product launch plan for SaaS"]'::jsonb, null,
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
  values (v_point, 'usage', 'Ilu testerów i ile zużyją',
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
  values (v_subpoint, 'plan', 'short_text',
          'Ilu testerów zaprosisz i ile każdy zużyje?', 'Podaj liczbę osób i jednostkę, która naprawdę generuje koszt: czas, miejsce albo liczba operacji.', '10 osób, każda przetworzy około 5 godzin nagrań miesięcznie. Łącznie 50 godzin.',
          true, 'preparation.test-cost.usage.plan',
          '{"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'monthly', 'short_text',
          'Jaki jest szacowany miesięczny koszt usług dla tej grupy?', 'Wyjdź od cen z listy braków w Ogólne. Dolicz opłatę stałą i opłatę za użycie. Przy nieznanej cenie napisz „do sprawdzenia”, nie zero.', 'Serwer 60 zł miesięcznie plus 0,04 zł za minutę nagrania. Przy 3000 minut wychodzi około 180 zł miesięcznie.',
          true, 'preparation.test-cost.usage.monthly',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['plan', 'monthly']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'limits', 'Co po przekroczeniu limitu',
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
  values (v_subpoint, 'overage', 'list_long',
          'Co stanie się po przekroczeniu limitów wybranych usług?', 'Przy każdej usłudze napisz: dopłata, zatrzymanie działania albo konieczność zmiany pakietu. Zaznacz, czy limit jest na cały program, czy na jednego użytkownika.', 'Po wykorzystaniu miejsca dostawca blokuje nowe pliki i nie nalicza dopłaty.
Przetwarzanie nagrań powyżej pakietu kosztuje drożej za minutę.',
          true, 'preparation.test-cost.limits.overage',
          '{"min_items":1,"max_items":12}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cap', 'short_text',
          'Jaki limit nakładasz na testy, żeby zmieścić się w budżecie?', 'Liczba testerów, godziny albo miejsce. Jeśli dodatkowy limit jest zbędny, napisz krótko dlaczego.', '10 osób, do 5 godzin nagrań miesięcznie na osobę. Po limicie kolejne nagrania czekają do następnego miesiąca.',
          true, 'preparation.test-cost.limits.cap',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['overage', 'cap']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['usage', 'limits']);

  -- ── punkt 3: Ustal zasady płatnego dostępu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'paid', 'Ustal zasady płatnego dostępu', null,
          'Około 15 minut', 'Ten punkt dotyczy pierwszej wersji, za którą ktoś płaci. Skorzystaj ze sposobu rozliczenia z Idea Stage. Przy małej liczbie osób wystarczy link do płatności i ręczne odblokowanie konta po sprawdzeniu wpłaty. Ustal, kto sprawdza płatności i jak długo klient czeka. Sam link nie włącza konta automatycznie. Przy opłacie za użycie zapisz, skąd bierzecie informację o zużyciu. Przejdź przez udaną płatność, koniec bezpłatnego testu, nieudaną płatność, rezygnację z odnawiania i koniec opłaconego okresu. Przy rezygnacji klient zwykle korzysta do końca opłaconego czasu. Zakończenie dostępu, usunięcie konta i usunięcie materiałów to trzy osobne decyzje. Te same zasady mają być czytelne dla klienta.',
          '["Stripe, Create subscriptions","Stripe, Using webhooks with subscriptions","Stripe, Cancel subscriptions"]'::jsonb, null,
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
  values (v_point, 'choice', 'Czy pierwsza wersja jest płatna?',
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
  values (v_subpoint, 'answer', 'select',
          'Czy w pierwszej wersji ktoś będzie płacił za dostęp?', 'Jeśli nie, reszta tego punktu odpada. Wrócisz do niej, gdy zmienisz odpowiedź.', null,
          true, 'preparation.paid.choice.answer',
          '{"options":[{"value":"yes","label":"Tak, dostęp będzie płatny"},{"value":"no","label":"Nie, pierwsza wersja jest bezpłatna"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['answer']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'how', 'Jak klient płaci i dostaje dostęp',
          null, false,
          null, '{"answer_key":"preparation.paid.choice.answer","one_of":["no"]}'::jsonb, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'flow', 'short_text',
          'Jak klient zapłaci i jak otrzyma dostęp?', 'Napisz, kto sprawdza płatność i czy konto włącza się ręcznie, czy samo.', 'Klient płaci przez link do oferty. Po wpłacie w panelu operatora ręcznie odblokowujemy konto i piszemy, że może zacząć.',
          true, 'preparation.paid.how.flow',
          '{"max":500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['flow']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'cases', 'Kiedy dostęp się zaczyna i kończy',
          null, false,
          null, '{"answer_key":"preparation.paid.choice.answer","one_of":["no"]}'::jsonb, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'paid_ok', 'short_text',
          'Klient opłacił dostęp. Od kiedy może korzystać i na jak długo?', 'Jedno zdanie. Przy opłacie za użycie dopisz, skąd bierzecie informację o zużyciu.', 'Dostęp włącza się tego samego dnia i trwa do końca opłaconego miesiąca.',
          true, 'preparation.paid.cases.paid_ok',
          '{"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'trial', 'short_text',
          'Skończył się bezpłatny test. Co zostaje, a co wymaga płatności?', 'Jeśli nie ma bezpłatnego testu, napisz „Nie dotyczy”.', 'Po 14 dniach może tylko przeglądać zapisane dane, dopóki nie opłaci dostępu.',
          true, 'preparation.paid.cases.trial',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'failed', 'short_text',
          'Płatność się nie powiodła. Co z nowym kontem, a co z klientem, który już korzysta?', 'Rozdziel pierwszy zakup od odnowienia. Napisz, czy dotychczasowy klient dostaje dodatkowe dni.', 'Nowe konto zostaje wyłączone. Dotychczasowy klient ma 7 dni na poprawienie karty, potem dostęp do dodawania nowych rzeczy się zamyka.',
          true, 'preparation.paid.cases.failed',
          '{"max":500}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cancel', 'short_text',
          'Klient zrezygnował z odnawiania, ale opłacony okres jeszcze trwa. Do kiedy korzysta?', 'Napisz, do kiedy działa to, co już opłacił, i że kolejna opłata nie jest pobierana.', 'Korzysta do końca opłaconego miesiąca. Kolejna płatność nie schodzi.',
          true, 'preparation.paid.cases.cancel',
          '{"max":400}'::jsonb, 4)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ended', 'short_text',
          'Opłacony okres się skończył. Czy może jeszcze przeglądać albo pobrać zapisane materiały?', 'Zakończenie dostępu, usunięcie konta i usunięcie materiałów to osobne decyzje.', 'Może przeglądać i pobrać zapisane dokumenty. Nie może dodawać nowych ani ich zmieniać.',
          true, 'preparation.paid.cases.ended',
          '{"max":500}'::jsonb, 5)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['paid_ok', 'trial', 'failed', 'cancel', 'ended']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['choice', 'how', 'cases']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['access', 'test-cost', 'paid']);

  -- ═══ kategoria: Hardware ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'hardware', 'Hardware', 'Zamień wstępne szacunki z Idea na liczby, dostawców, testy i listę tego, co jeszcze blokuje budowę.',
          false, 3)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Sformalizuj wymagania pierwszej wersji
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'spec', 'Sformalizuj wymagania pierwszej wersji', null,
          'Około 25 minut', 'Zamień „lekkie i długo działa” na liczby: maksymalna masa, wymiary, czas pracy, dokładność. Przy każdym parametrze zapisz próg, bez którego pierwsza wersja nie ma sensu, i wartość, do której dążycie później. Rozdzielenie tych dwóch liczb chroni przed dokładaniem usprawnień w nieskończoność. Obowiązkowe zostaje w pierwszej wersji, pożądane może poczekać. Opisuj efekt, na przykład „przesyła dane co 5 sekund”, a nie gotowy układ „moduł X”. Jeden wspólny zapis dla całego zespołu, bez drugiej wersji w czyjejś notatce.',
          '["Bolt, The Hardware Development Process (2016)","Sam Altman, Hardware Startups (2012)"]'::jsonb, null,
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
  values (v_point, 'numbers', 'Parametry, które da się zmierzyć',
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
  values (v_subpoint, 'requirements', 'records',
          'Zapisz funkcje i ograniczenia jako mierzalne wymagania.', 'Jedna pozycja to jeden parametr. Minimum musi być spełnione w pierwszej wersji. Cel zostawiacie na później. Priorytet: obowiązkowe albo pożądane.', 'Czas pracy. Minimum 8 godzin, cel 12 godzin, obowiązkowe. Masa. Minimum do 300 g, cel do 250 g, pożądane.',
          true, 'preparation.spec.numbers.requirements',
          '{"add_label":"Dodaj wymaganie","max_items":20,"columns":[{"key":"name","label":"Parametr albo efekt","placeholder":"Np. czas pracy na jednym ładowaniu"},{"key":"minimum","label":"Minimum pierwszej wersji","placeholder":"Np. 8 godzin"},{"key":"target","label":"Cel na później","placeholder":"Np. 12 godzin"},{"key":"priority","label":"Obowiązkowe czy pożądane","placeholder":"Obowiązkowe albo pożądane"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['requirements']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['numbers']);

  -- ── punkt 2: Sformalizuj dostawców i produkcję
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'supply', 'Sformalizuj dostawców i produkcję', null,
          'Około 30 minut', 'Wstępna lista części z Idea staje się jednym plikiem: cena za sztukę, minimalne zamówienie i czy część da się kupić na pierwszą serię. Wysokie minimum zamówienia przy małej serii zamraża gotówkę — zapisz je wprost. Przy częściach, których brak zatrzymałby produkcję, wskaż zamiennik. Lead time formy wtryskowej bywa liczony w tygodniach, więc termin narzędzia wchodzi do planu od razu. Koszt sztuki to cena z hurtowni plus fracht, cło i czas transportu.',
          '["Bolt, The Hardware Development Process (2016)"]'::jsonb, null,
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
  values (v_point, 'bom', 'Części pierwszej serii',
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
  values (v_subpoint, 'parts', 'records',
          'Zbierz ceny, minimalne zamówienie i dostępność części.', 'Jedna pozycja to jedna część albo materiał. Nieznaną cenę wpisz jako „do sprawdzenia”, nie jako zero.', 'Obudowa. 18 zł za sztukę przy zamówieniu minimum 200. Dostępna, dostawa 6 tygodni.',
          true, 'preparation.supply.bom.parts',
          '{"add_label":"Dodaj część","max_items":30,"columns":[{"key":"part","label":"Część","placeholder":"Nazwa i ewentualny dostawca"},{"key":"price","label":"Cena za sztukę","placeholder":"Np. 18 zł albo do sprawdzenia"},{"key":"moq","label":"Minimalne zamówienie","placeholder":"Np. 200 sztuk"},{"key":"lead","label":"Dostępność i czas dostawy","placeholder":"Np. jest, 6 tygodni"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['parts']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'backup', 'Zamienniki i narzędzia',
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
  values (v_subpoint, 'seconds', 'records',
          'Które części są ryzykowne i jaki mają zamiennik?', 'Wpisz części, których brak albo skok ceny zatrzymałby serię. Jeśli takich nie ma, zostaw listę pustą i zapisz.', 'Mikrokontroler A. Zamiennik: układ B, już sprawdzony na próbce.',
          true, 'preparation.supply.backup.seconds',
          '{"empty_ok":true,"add_label":"Dodaj część krytyczną","max_items":15,"columns":[{"key":"part","label":"Część krytyczna","placeholder":"Co może zatrzymać produkcję"},{"key":"alt","label":"Zamiennik albo drugi dostawca","placeholder":"Nazwa albo „jeszcze szukam”"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'tools', 'list_long',
          'Jakie narzędzia, maszyny albo formy są potrzebne do pierwszej serii?', 'Przy każdej pozycji dopisz orientacyjny czas jej przygotowania, jeśli go znasz.', 'Forma wtryskowa obudowy. Przygotowanie około 10 tygodni.
Stanowisko do sprawdzenia szczelności.',
          true, 'preparation.supply.backup.tools',
          '{"min_items":1,"max_items":15}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'logistics', 'long_text',
          'Jakie cło, przepisy wwozu i wywozu oraz czas transportu wchodzą w koszt i termin?', 'Jeśli sprzedajesz i produkujesz w jednym kraju i nie widzisz takich kosztów, napisz to wprost.', 'Części z Azji: fracht i cło około 12% wartości. Transport 4 tygodnie. To wchodzi w cenę sztuki.',
          true, 'preparation.supply.backup.logistics',
          '{"max":1500}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['seconds', 'tools', 'logistics']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['bom', 'backup']);

  -- ── punkt 3: Określ jakość, bezpieczeństwo i niezawodność
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'quality', 'Określ jakość, bezpieczeństwo i niezawodność', null,
          'Około 20 minut', 'Ryzyka z Idea zamień na warunki, które da się sprawdzić testem. Opisz bezpieczne użycie zwykłe i przewidywalnie złe: upadek, zła ładowarka, wilgoć. „Obudowa ma być wytrzymała” nie wystarcza. „Wytrzymuje upadek z 1,2 m na beton bez pęknięcia” wystarcza. Ustal, jak długo produkt ma działać i jaki odsetek sztuk może nie przejść kontroli. Żadne urządzenie nie jest bezawaryjne. Limit pozwala zaplanować wymiany, a nie udawać zera.',
          '["Bolt, The Hardware Development Process (2016)"]'::jsonb, null,
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
  values (v_point, 'safe', 'Bezpieczne użycie i próg błędów',
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
  values (v_subpoint, 'use', 'long_text',
          'Jak produkt ma się zachować przy zwykłym użyciu i przy przewidywalnym błędzie użytkownika?', 'Upadek, złe zasilanie, wilgoć, dziecko w pobliżu — tylko to, co naprawdę dotyczy tego urządzenia.', 'Przy upadku z biurka obudowa nie pęka. Zła ładowarka nie może uszkodzić baterii ani nagrzać obudowy.',
          true, 'preparation.quality.safe.use',
          '{"max":1500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'life', 'short_text',
          'Jak długo ma działać i jaki odsetek usterek albo odrzuceń akceptujesz?', 'Podaj okres i liczbę. „Mało awarii” nie da się sprawdzić.', 'Rok codziennego użycia. Poniżej 2% sztuk odrzuconych na kontroli i poniżej 1% awarii w pierwszym roku.',
          true, 'preparation.quality.safe.life',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['use', 'life']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'tests', 'Jak to sprawdzicie',
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
  values (v_subpoint, 'checks', 'records',
          'Zapisz wymagania tak, żeby dało się je zmierzyć.', 'Jedna pozycja to jeden test albo pomiar.', 'Szczelność. Zanurzenie na 30 minut na głębokość 1 m, bez wody w środku.',
          true, 'preparation.quality.tests.checks',
          '{"add_label":"Dodaj test","max_items":15,"columns":[{"key":"need","label":"Wymaganie","placeholder":"Co ma być prawdą"},{"key":"test","label":"Test albo pomiar","placeholder":"Jak to sprawdzicie"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['checks']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['safe', 'tests']);

  -- ── punkt 4: Przełóż przepisy na cechy produktu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'rules', 'Przełóż przepisy na cechy produktu', null,
          'Około 25 minut', 'Norma ma wskazywać na konkretną cechę: materiał, odstęp, oznaczenie, a nie na hasło „zrobimy CE”. Wypisz dokumenty, badania i moment, w którym są potrzebne, zanim zamówisz formy. Na etykiecie i w instrukcji zapisz treść wymaganą na rynku, na którym zaczynasz, łącznie ze znakami, bez których przesyłka może stanąć. Na końcu sprawdź, czy przepis nie kłóci się z masą, wymiarami albo ceną z wcześniejszych punktów. Grubsza obudowa wymuszona izolacją zmienia wymiary jeszcze na rysunku, nie po zamówieniu formy.',
          '["Y Combinator, Standard Startup Documents & Legal Resources (2023)"]'::jsonb, null,
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
  values (v_point, 'map', 'Przepisy i oznaczenia',
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
  values (v_subpoint, 'links', 'records',
          'Który przepis albo certyfikat zmienia konkretną cechę produktu?', 'Jedna pozycja to jedna norma, znak albo obowiązek. Dopisz, której części produktu dotyczy.', 'Bezpieczeństwo elektryczne. Obudowa z materiału, który nie podtrzymuje płomienia. Badanie przed sprzedażą w UE.',
          true, 'preparation.rules.map.links',
          '{"add_label":"Dodaj wymóg","max_items":15,"columns":[{"key":"rule","label":"Przepis, norma albo certyfikat","placeholder":"Np. oznaczenie CE, bezpieczeństwo baterii"},{"key":"effect","label":"Co zmienia w produkcie","placeholder":"Materiał, układ, dokument"},{"key":"when","label":"Kiedy jest potrzebne","placeholder":"Np. przed pierwszą sprzedażą w UE"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'labels', 'long_text',
          'Co musi być na etykiecie i w instrukcji na rynku, od którego zaczynasz?', 'Treść, znaki i język. Jeśli jeszcze nie wiesz, napisz „do sprawdzenia” przy konkretnym znaku, nie pomijaj rynku.', 'Nazwa produktu, dane producenta, znak przekreślonego kosza i krótkie ostrzeżenie po polsku.',
          true, 'preparation.rules.map.labels',
          '{"max":1500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'clash', 'long_text',
          'Czy któryś przepis kłóci się z wcześniejszymi wymaganiami? Jak to rozstrzygacie?', 'Jeśli sprzeczności nie ma, napisz „Brak sprzeczności” i jednym zdaniem, co sprawdziłeś.', 'Izolacja wymusza grubszą obudowę. Podnosimy dopuszczalny wymiar z 80 mm do 92 mm. Masa nadal mieści się w minimum.',
          true, 'preparation.rules.map.clash',
          '{"max":1500}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['links', 'labels', 'clash']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['map']);

  -- ── punkt 5: Ustal zasoby i otwarte problemy przed budową
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'readiness', 'Ustal zasoby i otwarte problemy przed budową', null,
          'Około 20 minut', 'Wypisz ludzi, laboratoria, producentów i maszyny potrzebne do budowy. Oznacz, co już macie, a co trzeba pozyskać. Własny park maszyn na tym etapie zwykle nie jest potrzebny. Budżet weź z cen z poprzednich punktów i dodaj zapas 15–20% na poprawkę płytki albo dodatkowe badanie, bo pierwsza seria rzadko wychodzi za pierwszym razem. Otwarte ryzyka z Idea rozdziel: co musi być rozwiązane, zanim zaczniecie budowę, a co może poczekać. Każde otwarte ryzyko ma być świadomie odłożone, nie przeoczone.',
          '["Bolt, The Hardware Development Process (2016)","Sam Altman, Hardware Startups (2012)"]'::jsonb, null,
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
  values (v_point, 'resources', 'Ludzie, narzędzia i budżet',
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
  values (v_subpoint, 'needs', 'records',
          'Czego potrzebujecie do budowy i czy już to macie?', 'Specjalista, laboratorium, producent albo maszyna. Przy braku napisz, skąd to weźmiecie.', 'Laboratorium szczelności. Nie mamy. Wynajmiemy jedno badanie przed formą.',
          true, 'preparation.readiness.resources.needs',
          '{"add_label":"Dodaj zasób","max_items":15,"columns":[{"key":"what","label":"Kompetencja albo zasób","placeholder":"Kto albo co"},{"key":"status","label":"Mamy czy trzeba pozyskać","placeholder":"Mamy, wynajmiemy, szukamy"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'budget', 'short_text',
          'Jaki budżet rezerwujesz na narzędzia, prototypy, testy i konsultacje?', 'Oprzyj kwotę na poprzednich punktach i dodaj zapas około 15–20% na poprawkę, która wyjdzie przy pierwszym podejściu.', 'Forma, dwie iteracje płytki i jedno badanie: 28 tys. zł plus 20% zapasu, razem około 34 tys. zł.',
          true, 'preparation.readiness.resources.budget',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['needs', 'budget']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'risks', 'Co jeszcze jest otwarte',
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
  values (v_subpoint, 'open', 'records',
          'Które ryzyka techniczne, kosztowe, produkcyjne albo regulacyjne nadal są otwarte?', 'Przy każdym napisz, czy blokuje start budowy, czy może poczekać. Jeśli lista jest pusta, zostaw ją i zapisz — to znaczy, że nie widzisz otwartego ryzyka.', 'Nieznana cena układu radiowego. Trzeba znać ją przed zamówieniem serii. Kolor obudowy może poczekać.',
          true, 'preparation.readiness.risks.open',
          '{"empty_ok":true,"add_label":"Dodaj ryzyko","max_items":15,"columns":[{"key":"risk","label":"Otwarty problem","placeholder":"Co nadal nie jest rozstrzygnięte"},{"key":"gate","label":"Blokuje budowę czy może poczekać","placeholder":"Blokuje albo może poczekać"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['resources', 'risks']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['spec', 'supply', 'quality', 'rules', 'readiness']);

  -- ═══ kategoria: B2B ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2b', 'B2B', 'Przygotuj drogę od pierwszego kontaktu z firmą do dnia, w którym może zacząć korzystać.',
          false, 4)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przygotuj proces sprzedaży
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'sales', 'Przygotuj proces sprzedaży', null,
          'Około 20 minut', 'Zostaw krótką drogę, zwykle trzy albo cztery kroki: rozmowa o potrzebie, pokazanie rozwiązania, oferta, decyzja. Usuń etapy, które u was nie występują. Dalej przesuwa firmę konkretne zdarzenie, na przykład udział osoby z budżetem albo prośba o ofertę, a nie miła rozmowa. Firmy, z którymi rozmawiacie, prowadzicie na liście w tym punkcie: etap, następne działanie i osoba z waszego teamu. To jest arkusz, nie osobny system do sprzedaży. Wystarczy, że cały team widzi następny krok i termin.',
          '["Forum Ventures, Customer-Driven Product Development"]'::jsonb, null,
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
  values (v_point, 'steps', 'Droga od kontaktu do współpracy',
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
  values (v_subpoint, 'path', 'records',
          'Ułóż etapy i napisz, co przesuwa firmę dalej.', 'Jedna pozycja to jeden etap. Zostaw tylko kroki, które u was naprawdę są.', 'Rozmowa. Dalej, gdy druga strona opisze konkretny problem i zgodzi się na pokaz. Pokaz. Dalej, gdy poproszą o ofertę.',
          true, 'preparation.sales.steps.path',
          '{"add_label":"Dodaj etap","max_items":8,"columns":[{"key":"stage","label":"Etap","placeholder":"Np. pierwsza rozmowa"},{"key":"forward","label":"Co musi się stać, żeby iść dalej","placeholder":"Konkretne zdarzenie, nie „dobra rozmowa”"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['path']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'accounts', 'Firmy, z którymi rozmawiacie',
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
  values (v_subpoint, 'companies', 'records',
          'Wpisz firmy, z którymi już rozmawiacie albo do których chcecie się odezwać.', 'Przy każdej: aktualny etap, następne działanie i kto z waszego teamu za to odpowiada. Jeśli działasz sam, wpisz swoje imię.', 'Studio Nord. Po pierwszej rozmowie. Wysłać ofertę w czwartek. Kuba.',
          true, 'preparation.sales.accounts.companies',
          '{"add_label":"Dodaj firmę","max_items":30,"columns":[{"key":"company","label":"Firma","placeholder":"Nazwa"},{"key":"stage","label":"Aktualny etap","placeholder":"Np. jeszcze bez kontaktu"},{"key":"next","label":"Następne działanie","placeholder":"Co i kiedy"},{"key":"owner","label":"Kto z waszego teamu","placeholder":"Imię"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['companies']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['steps', 'accounts']);

  -- ── punkt 2: Przygotuj pierwszą ofertę
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'offer', 'Przygotuj pierwszą ofertę', null,
          'Około 20 minut', 'Opisz zakres, który naprawdę możecie dostarczyć w pierwszej wersji, językiem korzyści, nie listy technologii. Trzymajcie jeden trzon oferty. Cena albo sposób jej liczenia, przedmiot płatności i czas współpracy mają być w jednym miejscu. Jeśli jest test, od razu napisz, co klient dostaje i po czym uznajecie test za skończony. Test bez końca potrafi trwać miesiącami. Jeden wskaźnik, na przykład „w 14 dni zespół oszczędza 5 godzin, wtedy przechodzimy do umowy”, zamyka sprawę. Jeśli testu nie ma, napisz „Nie dotyczy”.',
          '["Forum Ventures, Product WOW Moments"]'::jsonb, null,
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
  values (v_point, 'scope', 'Co sprzedajecie i za ile',
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
  values (v_subpoint, 'what', 'long_text',
          'Jaki zakres pierwszej wersji możecie zaoferować firmie?', 'Oprzyj się na tym, co ma powstać do pierwszej wersji w Ogólne. Napisz, co klient dostaje, nie jak to jest zbudowane.', 'Formularz zgłoszeń dla recepcji i tygodniowe zestawienie, ile zgłoszeń zostało zamkniętych.',
          true, 'preparation.offer.scope.what',
          '{"max":1500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'price', 'short_text',
          'Jaka jest cena albo jak ją liczycie i za co dokładnie klient płaci?', 'Kwota, stawka albo wzór. Dopisz, czy to abonament, wdrożenie, czy jedno i drugie.', '2 400 zł za wdrożenie i 800 zł miesięcznie za korzystanie do 5 osób.',
          true, 'preparation.offer.scope.price',
          '{"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'term', 'short_text',
          'Jak długo trwa współpraca albo realizacja?', 'Jeśli czas nie ma znaczenia, napisz „Bez określonego końca” i co wtedy kończy współpracę.', 'Wdrożenie 3 tygodnie. Abonament na czas nieokreślony, z miesięcznym wypowiedzeniem.',
          true, 'preparation.offer.scope.term',
          '{"max":400}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['what', 'price', 'term']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'pilot', 'Test, jeśli jest potrzebny',
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
  values (v_subpoint, 'deal', 'short_text',
          'Co klient dostaje w teście i po czym uznajecie go za zakończony?', 'Jeśli testu nie ma, napisz „Nie dotyczy”.', '14 dni na jednym zespole. Koniec, gdy policzymy zaoszczędzone godziny i klient zdecyduje, czy bierze abonament.',
          true, 'preparation.offer.pilot.deal',
          '{"max":500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['deal']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['scope', 'pilot']);

  -- ── punkt 3: Przygotuj rozpoczęcie współpracy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'kickoff', 'Przygotuj rozpoczęcie współpracy', null,
          'Około 20 minut', 'Wypisz, czego potrzebujecie od klienta, zanim zacznie korzystać. Jeśli niczego, napisz to wprost. Osobno: co robicie wy, co robi klient, i kto po jego stronie prowadzi sprawę. Brak takiej osoby jest najczęstszym powodem, że wdrożenie stoi. Droga od słowa „bierzemy” do pierwszego realnego użycia ma obejmować formalności, które u was występują: umowę, NDA, zamówienie, fakturę. Jeśli przetwarzacie dane osobowe albo dane firmowe klienta, dopiszcie, gdzie leżą i kto poza tą firmą może je zobaczyć. Rozdzielenie danych dwóch klientów jest warunkiem, nie ozdobą. Szablon umowy i podpis elektroniczny skracają czas od decyzji do pierwszego efektu.',
          '["Forum Ventures, Customer-Driven Product Development"]'::jsonb, null,
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
  values (v_point, 'needs', 'Co musi się stać przed startem',
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
  values (v_subpoint, 'from_client', 'list_long',
          'Czego potrzebujecie od klienta, zanim zacznie korzystać?', 'Dane, dostępy, zgody, materiały. Jeśli niczego nie potrzebujecie, wpisz „Nic”.', 'Lista osób, które dostaną dostęp.
Osoba po stronie klienta, która odbiera pytania.',
          true, 'preparation.kickoff.needs.from_client',
          '{"min_items":1,"max_items":12}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ours', 'list_long',
          'Co przed startem musi zrobić wasz team?', 'Jedno działanie w pozycji.', 'Założyć przestrzeń firmy.
Wysłać umowę do podpisu.',
          true, 'preparation.kickoff.needs.ours',
          '{"min_items":1,"max_items":12}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'theirs', 'list_long',
          'Co przed startem musi zrobić klient?', 'Jedno działanie w pozycji. Jeśli lista jest tylko „Nic”, wpisz to jednym wpisem.', 'Podpisać umowę.
Wskazać osobę prowadzącą po swojej stronie.',
          true, 'preparation.kickoff.needs.theirs',
          '{"min_items":1,"max_items":12}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['from_client', 'ours', 'theirs']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'start', 'Od zgody do pierwszego użycia',
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
  values (v_subpoint, 'path', 'list_long',
          'Jakie są kolejne działania od potwierdzenia zakupu do momentu, w którym klient może korzystać?', 'Dopisz formalności, które u was są: umowa, NDA, zamówienie, faktura, materiały.', 'Podpisujemy umowę.
Wystawiamy fakturę za wdrożenie.
Zakładamy dostępy i umawiamy godzinę pierwszego użycia.',
          true, 'preparation.kickoff.start.path',
          '{"min_items":1,"max_items":12}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'data', 'long_text',
          'Jakie dane klienta będziecie mieć i kto poza tą firmą może je zobaczyć?', 'Dane osobowe, dane firmy, pliki. Jeśli dwóch klientów nie może widzieć swoich materiałów, napisz to wprost. Gdy danych klienta nie przetwarzacie, napisz „Nie przetwarzamy danych klienta”.', 'Mamy imiona pracowników i treść zgłoszeń. Widzi je tylko ta firma i osoba z naszego teamu, która prowadzi wdrożenie. Inny klient tego nie widzi.',
          true, 'preparation.kickoff.start.data',
          '{"max":1500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['path', 'data']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['needs', 'start']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['sales', 'offer', 'kickoff']);

  -- ═══ kategoria: B2C ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2c', 'B2C', 'Ustal, jak kupujący może zrezygnować albo zgłosić, że zakup nie działa, i jak obsłużycie to w pierwszej wersji.',
          false, 5)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przygotuj zwroty i reklamacje
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'returns', 'Przygotuj zwroty i reklamacje', null,
          'Około 20 minut', 'Zasady zależą od kraju i od tego, czy sprzedajesz przez internet, czy na miejscu. Najpierw zapisz kanał sprzedaży i płatność, bo od tego zależy, co kupujący może zrobić. Potem zapisz, kiedy może zrezygnować z zakupu i co mu się należy, gdy produkt albo usługa nie działa tak, jak obiecaliście. W pierwszej wersji część obsługi może być ręczna: znaleziony kontakt i wskazanie zakupu po stronie produktu, a sprawdzenie sprawy, odpowiedź i zwrot pieniędzy po waszej stronie. Uzgodnij ten podział z osobą, która buduje pierwszą wersję. To nie jest opinia prawna. Przy sprzedaży poza Polską albo przy produkcie regulowanym sprawdź obowiązującą zasadę, zanim zapiszecie termin.',
          '["Zasady odstąpienia od umowy zawartej na odległość, właściwe dla kraju pierwszej sprzedaży"]'::jsonb, null,
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
  values (v_point, 'channel', 'Jak wygląda pierwszy zakup',
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
  values (v_subpoint, 'where', 'short_text',
          'Gdzie odbywa się pierwsza sprzedaż i jak kupujący płaci oraz odbiera zakup?', 'Internet albo miejsce stacjonarne, sposób płatności i sposób odbioru. Od tego zależą zwroty.', 'Sklep w internecie. Płatność przy zamówieniu. Paczka kurierem albo odbiór osobisty.',
          true, 'preparation.returns.channel.where',
          '{"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['where']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'rights', 'Kiedy kupujący może się wycofać',
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
  values (v_subpoint, 'rule', 'short_text',
          'Kiedy klient może zrezygnować z zakupu i co musisz zrobić, jeśli zakup nie działa tak, jak obiecano?', 'Uwzględnij kraj, w którym zaczynasz, i sposób sprzedaży. Jeśli terminu jeszcze nie sprawdziłeś, napisz „do sprawdzenia” przy konkretnej zasadzie, nie zgaduj liczby.', 'Sprzedaż przez internet w Polsce: klient może odstąpić w ciągu 14 dni od odbioru. Gdy produkt nie działa, przyjmujemy reklamację i zwracamy pieniądze albo wymieniamy sztukę.',
          true, 'preparation.returns.rights.rule',
          '{"max":500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['rule']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, position)
  values (v_point, 'handling', 'Jak obsłużycie zwrot i reklamację',
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
  values (v_subpoint, 'flow', 'records',
          'Dla zwrotu i dla reklamacji zapisz, jak klient się zgłosi i co zrobicie.', 'Osobno zwrot i osobno reklamacja. Napisz, co musi umieć produkt albo miejsce sprzedaży, a co zrobicie ręcznie.', 'Zwrot. Klient pisze na adres z potwierdzenia zamówienia i podaje numer. My sprawdzamy termin, potwierdzamy odbiór paczki i zlecamy zwrot pieniędzy.',
          true, 'preparation.returns.handling.flow',
          '{"add_label":"Dodaj ścieżkę","max_items":6,"columns":[{"key":"kind","label":"Zwrot czy reklamacja","placeholder":"Zwrot albo reklamacja"},{"key":"report","label":"Jak klient się zgłasza","placeholder":"Mail, formularz, w sklepie"},{"key":"product","label":"Co musi umożliwiać produkt albo sprzedaż","placeholder":"Np. znaleźć kontakt i numer zakupu"},{"key":"manual","label":"Co zrobicie ręcznie","placeholder":"Sprawdzenie, odpowiedź, zwrot pieniędzy"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['flow']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['channel', 'rights', 'handling']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['returns']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general', 'saas', 'hardware', 'b2b', 'b2c']);

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
