-- ============================================================================
-- 006 · Treść etapu: Ambition Stage (v1)
-- ----------------------------------------------------------------------------
-- PLIK GENEROWANY — nie edytuj ręcznie.
-- Źródło: supabase/content/ambition-v1.json
-- Regeneracja: npm run content:build -- ambition-v1
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
  values ('ambition', 1, 'Ambition Stage', 'Twój pierwszy pomysł',
          'Co ostatnio sprawiło, że pomyślałeś: „Przecież musi być łatwiejszy sposób”? Za chwilę wybierzesz jedną taką sytuację, wymyślisz sposób jej poprawienia i nadasz swojemu projektowi nazwę. Orientacyjny czas: 10–15 minut. Wystarczą krótkie odpowiedzi. Wszystko możesz później zmienić.', 1, 'Sprawdzam mój pomysł', now())
  on conflict (key, version) do update set
    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,
    position = excluded.position, finish_label = excluded.finish_label,
    published_at = now()
  returning id into v_template;

  -- ═══ kategoria: Twój pierwszy pomysł ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'general', 'Twój pierwszy pomysł', null,
          true, 1)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Wybierz coś, co chcesz zmienić
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'pick-change', 'Wybierz coś, co chcesz zmienić', null,
          'Około 3 minut', 'Nie szukaj przełomowego pomysłu. Szukaj sytuacji, która kogoś realnie irytuje — najlepiej takiej, którą znasz z własnego doświadczenia. Im konkretniejsza sytuacja, tym łatwiej będzie ją później sprawdzić. „Ludzie tracą czas” jest za szerokie. „Właściciel kawiarni codziennie wyrzuca niesprzedane kanapki” to coś, o co da się zapytać konkretnej osoby.',
          '[]'::jsonb, null,
          null, 1)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'catch-problem', 'Złap problem',
          null, false,
          null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'problem', 'short_text',
          'Co ostatnio było dla ciebie lub kogoś, kogo znasz, trudne, drogie, irytujące albo zabierało za dużo czasu? Wybierz jedną sytuację.', 'Przypomnij sobie ostatni tydzień: pracę, naukę, zakupy, hobby lub obowiązki. Co trzeba było poprawiać, długo załatwiać albo robić kilka razy?', 'W kawiarni, w której pracuję, pod koniec dnia zostają niesprzedane kanapki.',
          true, 'ambition.pick-change.catch-problem.problem',
          '{"min":15,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['problem']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'who-to-help', 'Wskaż, komu chcesz pomóc',
          null, false,
          null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'audience', 'short_text',
          'Kogo dotyczy wybrana trudność?', 'Wskaż konkretnych ludzi lub rodzaj firmy. Możesz zacząć od siebie.', 'Właściciele małych kawiarni przygotowujących jedzenie na miejscu.',
          true, 'ambition.pick-change.who-to-help.audience',
          '{"min":5,"max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['audience']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'working-name', 'Nadaj projektowi roboczą nazwę',
          null, true,
          null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'working_name', 'short_text',
          'Jak chcesz go na razie nazywać?', 'Wystarczy zwykłe hasło, np. „Ostatnia kanapka”. Jeśli nic nie przychodzi ci do głowy, zostaw „Mój pierwszy projekt”.', null,
          false, 'ambition.pick-change.working-name.working_name',
          '{"max":80,"syncs_startup_name":true}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['working_name']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['catch-problem', 'who-to-help', 'working-name']);

  -- ── punkt 2: Wymyśl sposób pomocy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'find-way', 'Wymyśl sposób pomocy', null,
          'Około 4 minut', 'Rozwiązaniem nie musi być aplikacja. Może nim być usługa, lepsza organizacja pracy, przedmiot albo po prostu zrobienie czegoś za kogoś. Na tym etapie nie oceniaj, czy pomysł jest dobry — zapisz dwa i wybierz ten, który łatwiej sprawdzić. Drugi zachowaj; wrócisz do niego, jeśli pierwszy się nie obroni.',
          '[]'::jsonb, null,
          null, 2)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'two-ways', 'Znajdź dwa sposoby',
          null, false,
          null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ideas', 'list_short',
          'Jak można ułatwić tę sytuację? Zapisz dwa różne pomysły.', 'Pomyśl, co można usunąć, uprościć, przygotować wcześniej lub zrobić za kogoś. Rozwiązaniem może być przedmiot, usługa, program albo lepszy sposób organizacji.', 'Zbieranie zamówień z pobliskich biur przed przygotowaniem kanapek · Sprzedaż pozostałych kanapek w zestawach pod koniec dnia',
          true, 'ambition.find-way.two-ways.ideas',
          '{"min_items":2,"max_items":5,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ideas']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'pick-direction', 'Wybierz pierwszy kierunek',
          null, false,
          null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'chosen_idea', 'short_text',
          'Który z tych sposobów chcesz sprawdzić jako pierwszy?', 'Wybierz ten, którego działanie potrafisz sobie wyobrazić i o którym najłatwiej będzie ci dowiedzieć się więcej. Pozostały pomysł zachowaj.', null,
          true, 'ambition.find-way.pick-direction.chosen_idea',
          '{"min":5,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['chosen_idea']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'name-benefit', 'Nazwij korzyść',
          null, false,
          null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'benefit', 'short_text',
          'Co stanie się łatwiejsze lub lepsze dla tej osoby albo firmy?', 'Opisz zmianę, którą odbiorca zauważy. Na tym etapie nie musisz podawać liczb.', 'Właściciel sprzeda więcej przygotowanego jedzenia i mniej go wyrzuci.',
          true, 'ambition.find-way.name-benefit.benefit',
          '{"min":10,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['benefit']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['two-ways', 'pick-direction', 'name-benefit']);

  -- ── punkt 3: Znajdź swój punkt zaczepienia
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'foothold', 'Znajdź swój punkt zaczepienia', null,
          'Około 2 minut', 'Przewagą na starcie nie jest doświadczenie w prowadzeniu firmy, tylko dostęp: znasz kogoś, pracujesz w tej branży, umiesz coś zrobić samodzielnie. To skraca drogę do pierwszej rozmowy z odbiorcą. Przeszkodę wskaż uczciwie — jeśli jej nie widzisz, wpisz „do sprawdzenia” i wróć do tego później.',
          '[]'::jsonb, null,
          null, 3)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'use-what-you-have', 'Wykorzystaj to, co już masz',
          null, false,
          null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'assets', 'list_short',
          'Co pomoże ci zacząć sprawdzać ten pomysł? Zapisz maksymalnie trzy rzeczy.', 'Może to być znajomość problemu, umiejętność, dostęp do miejsca albo osoba, z którą możesz porozmawiać. Nie potrzebujesz doświadczenia w prowadzeniu firmy.', 'Pracuję w kawiarni · Znam jej właściciela · Umiem przygotować prosty formularz zamówień',
          true, 'ambition.foothold.use-what-you-have.assets',
          '{"min_items":1,"max_items":3,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['assets']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'biggest-obstacle', 'Zauważ największą przeszkodę',
          null, false,
          null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'obstacle', 'short_text',
          'Co najbardziej utrudnia ci zrobienie pierwszego kroku?', 'Wskaż jedną rzecz, np. brak kontaktu do odbiorców, mało czasu lub niewiedzę, jak działa dana branża. Jeśli jeszcze nie widzisz przeszkody, wpisz „do sprawdzenia”.', null,
          true, 'ambition.foothold.biggest-obstacle.obstacle',
          '{"min":3,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['obstacle']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['use-what-you-have', 'biggest-obstacle']);

  -- ── punkt 4: Zapisz swój pomysł
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'save-idea', 'Zapisz swój pomysł', null,
          'Około 1 minuty', 'To podsumowanie wszystkiego, co przed chwilą zapisałeś. Przeczytaj je jak jedną całość i sprawdź, czy oddaje to, co chcesz zrobić. Popraw tylko te odpowiedzi, które tego wymagają — reszta zostaje bez zmian. Po zatwierdzeniu przechodzisz do sprawdzania, czy osoby, którym chcesz pomóc, też potrzebują takiej zmiany.',
          '[]'::jsonb, null,
          null, 4)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'project-outline', 'Przeczytaj zarys projektu',
          null, false,
          null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'outline', 'summary',
          'Sprawdź, czy podsumowanie oddaje to, co chcesz zrobić.', 'Możesz poprawić każdą odpowiedź na miejscu. Zmiany zapisują się w tych samych polach, co wcześniej.', null,
          true, 'ambition.save-idea.project-outline.outline',
          '{"confirm_label":"Zatwierdzam zarys","sources":[{"field":"pick-change.working-name.working_name","label":"Nazwa"},{"field":"pick-change.who-to-help.audience","label":"Chcę pomóc"},{"field":"pick-change.catch-problem.problem","label":"Problem, którym się zajmę"},{"field":"find-way.pick-direction.chosen_idea","label":"Mój pomysł na rozwiązanie"},{"field":"find-way.name-benefit.benefit","label":"Korzyść dla odbiorcy"},{"field":"foothold.use-what-you-have.assets","label":"Mam na początek"},{"field":"foothold.biggest-obstacle.obstacle","label":"Do wyjaśnienia"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['outline']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['project-outline']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['pick-change', 'find-way', 'foothold', 'save-idea']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general']);

end;
$$;

-- Weryfikacja: policz, co wjechało
select
  (select count(*) from public.stage_points p
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'ambition') as punktow,
  (select count(*) from public.stage_subpoints s
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'ambition') as podpunktow,
  (select count(*) from public.stage_fields f
     join public.stage_subpoints s on s.id = f.subpoint_id
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'ambition') as pol;
