-- ============================================================================
-- 028 · Treść etapu: MVP Stage (v1)
-- ----------------------------------------------------------------------------
-- PLIK GENEROWANY — nie edytuj ręcznie.
-- Źródło: supabase/content/mvp-v1.json
-- Regeneracja: npm run content:build -- mvp-v1
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
  values ('mvp', 1, 'MVP Stage', 'Wypuść i sprawdź',
          'Udostępniasz pierwszą wersję odbiorcom, zbierasz reakcje i poprawiasz produkt. Tracker, zespół i materiały z Execution zostają dostępne.', 5, 'Kończę program', now())
  on conflict (key, version) do update set
    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,
    position = excluded.position, finish_label = excluded.finish_label,
    published_at = now()
  returning id into v_template;

  -- ═══ kategoria: Ogólna walidacja ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'general', 'Ogólna walidacja', 'Wspólna podstawa dla każdego produktu — niezależnie od kategorii.',
          true, 1)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zbuduj minimalną wersję rozwiązania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-zbuduj-minimalna-wersje-rozwiazania', 'Zbuduj minimalną wersję rozwiązania', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zrealizuj-podstawowe-funkcje-mvp', 'Zrealizuj podstawowe funkcje MVP',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zbuduj wyłącznie funkcje potrzebne do sprawdzenia głównego założenia.', 'Zbuduj wyłącznie funkcje potrzebne do sprawdzenia głównego założenia. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbuduj-minimalna-wersje-rozwiazania.zrealizuj-podstawowe-funkcje-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'polacz-kluczowe-elementy-rozwiazania', 'Połącz kluczowe elementy rozwiązania',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Spraw, by użytkownik mógł wykonać główne działanie w rozwiązaniu.', 'Spraw, by użytkownik mógł wykonać główne działanie w rozwiązaniu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbuduj-minimalna-wersje-rozwiazania.polacz-kluczowe-elementy-rozwiazania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przygotuj-mvp-do-testowania', 'Przygotuj MVP do testowania',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Doprowadź MVP do stanu gotowego do użycia przez pierwszych odbiorców.', 'Doprowadź MVP do stanu gotowego do użycia przez pierwszych odbiorców. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbuduj-minimalna-wersje-rozwiazania.przygotuj-mvp-do-testowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-podstawowe-funkcje-mvp', 'polacz-kluczowe-elementy-rozwiazania', 'przygotuj-mvp-do-testowania']);

  -- ── punkt 2: Rozpocznij testowanie z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-rozpocznij-testowanie-z-uzytkownikami', 'Rozpocznij testowanie z użytkownikami', null,
          null, 'Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'okresl-grupe-badawcza', 'Określ grupę badawczą',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz osoby najlepiej pasujące do testowania rozwiązania.', 'Wybierz osoby najlepiej pasujące do testowania rozwiązania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-rozpocznij-testowanie-z-uzytkownikami.okresl-grupe-badawcza.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-okres-badania', 'Ustal okres badania',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wyznacz, jak długo potrwają testy MVP.', 'Wyznacz, jak długo potrwają testy MVP. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-rozpocznij-testowanie-z-uzytkownikami.ustal-okres-badania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'udostepnij-mvp-uzytkownikom', 'Udostępnij MVP użytkownikom',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Daj wybranej grupie dostęp do MVP.', 'Daj wybranej grupie dostęp do MVP. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-rozpocznij-testowanie-z-uzytkownikami.udostepnij-mvp-uzytkownikom.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'obserwuj-reakcje-uzytkownikow', 'Obserwuj reakcje użytkowników',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Śledź, jak użytkownicy korzystają z produktu i jakie mają problemy.', 'Śledź, jak użytkownicy korzystają z produktu i jakie mają problemy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-rozpocznij-testowanie-z-uzytkownikami.obserwuj-reakcje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['okresl-grupe-badawcza', 'ustal-okres-badania', 'udostepnij-mvp-uzytkownikom', 'obserwuj-reakcje-uzytkownikow']);

  -- ── punkt 3: Zbierz feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-zbierz-feedback', 'Zbierz feedback', null,
          null, 'Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-opinie-uzytkownikow', 'Zbieraj opinie użytkowników',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapytaj użytkowników wprost o ich doświadczenia z MVP.', 'Zapytaj użytkowników wprost o ich doświadczenia z MVP. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbierz-feedback.zbieraj-opinie-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'konsultuj-rozwiazanie-z-ekspertami', 'Konsultuj rozwiązanie z ekspertami',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Skonsultuj rozwiązanie ze specjalistami i doświadczonymi osobami.', 'Skonsultuj rozwiązanie ze specjalistami i doświadczonymi osobami. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbierz-feedback.konsultuj-rozwiazanie-z-ekspertami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-informacje-o-problemach', 'Zbieraj informacje o problemach',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapisuj usterki, trudności i niejasne elementy.', 'Zapisuj usterki, trudności i niejasne elementy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbierz-feedback.zbieraj-informacje-o-problemach.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-oczekiwania-uzytkownikow', 'Zbieraj oczekiwania użytkowników',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Notuj propozycje użytkowników dotyczące funkcji głównych i dodatkowych.', 'Notuj propozycje użytkowników dotyczące funkcji głównych i dodatkowych. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-zbierz-feedback.zbieraj-oczekiwania-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zbieraj-opinie-uzytkownikow', 'konsultuj-rozwiazanie-z-ekspertami', 'zbieraj-informacje-o-problemach', 'zbieraj-oczekiwania-uzytkownikow']);

  -- ── punkt 4: Przeanalizuj feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-przeanalizuj-feedback', 'Przeanalizuj feedback', null,
          null, 'Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ocen-poziom-zadowolenia', 'Oceń poziom zadowolenia',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, jak bardzo użytkownicy są zadowoleni z rozwiązania.', 'Sprawdź, jak bardzo użytkownicy są zadowoleni z rozwiązania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-przeanalizuj-feedback.ocen-poziom-zadowolenia.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeanalizuj-zglaszane-problemy', 'Przeanalizuj zgłaszane problemy',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Znajdź najczęściej powtarzające się usterki i bariery.', 'Znajdź najczęściej powtarzające się usterki i bariery. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-przeanalizuj-feedback.przeanalizuj-zglaszane-problemy.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeanalizuj-potrzeby-dotyczace-funkcji', 'Przeanalizuj potrzeby dotyczące funkcji',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, których funkcji użytkownicy naprawdę potrzebują.', 'Sprawdź, których funkcji użytkownicy naprawdę potrzebują. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-przeanalizuj-feedback.przeanalizuj-potrzeby-dotyczace-funkcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wyciagnij-najwazniejsze-wnioski', 'Wyciągnij najważniejsze wnioski',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Ustal, co wymaga zmiany, a co dalszego sprawdzenia.', 'Ustal, co wymaga zmiany, a co dalszego sprawdzenia. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-przeanalizuj-feedback.wyciagnij-najwazniejsze-wnioski.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ocen-poziom-zadowolenia', 'przeanalizuj-zglaszane-problemy', 'przeanalizuj-potrzeby-dotyczace-funkcji', 'wyciagnij-najwazniejsze-wnioski']);

  -- ── punkt 5: Opracuj kierunek dalszego rozwoju
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-opracuj-kierunek-dalszego-rozwoju', 'Opracuj kierunek dalszego rozwoju', null,
          null, 'Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania.',
          '[]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-najwazniejsze-poprawki', 'Ustal najważniejsze poprawki',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz zmiany o największym wpływie na wartość produktu.', 'Wybierz zmiany o największym wpływie na wartość produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-opracuj-kierunek-dalszego-rozwoju.ustal-najwazniejsze-poprawki.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zaplanuj-ulepszenie-mvp', 'Zaplanuj ulepszenie MVP',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zaplanuj, jak dostosować MVP do zebranego feedbacku.', 'Zaplanuj, jak dostosować MVP do zebranego feedbacku. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-opracuj-kierunek-dalszego-rozwoju.zaplanuj-ulepszenie-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'rozwaz-zmiane-zalozen', 'Rozważ zmianę założeń',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Oceń, czy potrzebna jest częściowa lub całkowita zmiana pomysłu.', 'Oceń, czy potrzebna jest częściowa lub całkowita zmiana pomysłu.', null,
          true, 'mvp.general-opracuj-kierunek-dalszego-rozwoju.rozwaz-zmiane-zalozen.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'okresl-kolejny-kierunek-dzialania', 'Określ kolejny kierunek działania',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz, w jakim kierunku rozwijać produkt dalej.', 'Wybierz, w jakim kierunku rozwijać produkt dalej.', null,
          true, 'mvp.general-opracuj-kierunek-dalszego-rozwoju.okresl-kolejny-kierunek-dzialania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ustal-najwazniejsze-poprawki', 'zaplanuj-ulepszenie-mvp', 'rozwaz-zmiane-zalozen', 'okresl-kolejny-kierunek-dzialania']);

  -- ── punkt 6: Ponownie skonsultuj rozwiązanie
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'general-ponownie-skonsultuj-rozwiazanie', 'Ponownie skonsultuj rozwiązanie', null,
          null, 'Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
          '[]'::jsonb, null,
          null, 6)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wprowadz-najwazniejsze-zmiany', 'Wprowadź najważniejsze zmiany',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wprowadź do MVP zmiany wynikające z analizy.', 'Wprowadź do MVP zmiany wynikające z analizy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-ponownie-skonsultuj-rozwiazanie.wprowadz-najwazniejsze-zmiany.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'Ponownie udostępnij rozwiązanie użytkownikom',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Udostępnij zmienioną wersję i sprawdź reakcję użytkowników.', 'Udostępnij zmienioną wersję i sprawdź reakcję użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-ponownie-skonsultuj-rozwiazanie.ponownie-udostepnij-rozwiazanie-uzytkownikom.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'porownaj-reakcje-przed-i-po-zmianach', 'Porównaj reakcje przed i po zmianach',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy zmiany poprawiły odbiór rozwiązania.', 'Sprawdź, czy zmiany poprawiły odbiór rozwiązania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-ponownie-skonsultuj-rozwiazanie.porownaj-reakcje-przed-i-po-zmianach.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'powtorz-proces-walidacji', 'Powtórz proces walidacji',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Powtarzaj cykl testowania, feedbacku i ulepszania.', 'Powtarzaj cykl testowania, feedbacku i ulepszania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.general-ponownie-skonsultuj-rozwiazanie.powtorz-proces-walidacji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wprowadz-najwazniejsze-zmiany', 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'porownaj-reakcje-przed-i-po-zmianach', 'powtorz-proces-walidacji']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['general-zbuduj-minimalna-wersje-rozwiazania', 'general-rozpocznij-testowanie-z-uzytkownikami', 'general-zbierz-feedback', 'general-przeanalizuj-feedback', 'general-opracuj-kierunek-dalszego-rozwoju', 'general-ponownie-skonsultuj-rozwiazanie']);

  -- ═══ kategoria: SaaS ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'saas', 'SaaS', 'Warstwa dla produktu subskrypcyjnego — uruchomienie, użycie i model.',
          false, 2)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Uruchom pierwszą wersję SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-uruchom-pierwsza-wersje-saas', 'Uruchom pierwszą wersję SaaS', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zrealizuj-zakres-mvp', 'Zrealizuj zakres MVP',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zbuduj tylko funkcje potrzebne do sprawdzenia głównej wartości produktu.', 'Zbuduj tylko funkcje potrzebne do sprawdzenia głównej wartości produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-uruchom-pierwsza-wersje-saas.zrealizuj-zakres-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'polacz-kluczowe-elementy-saas', 'Połącz kluczowe elementy SaaS',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Spraw, by użytkownik mógł przejść całą podstawową ścieżkę w aplikacji.', 'Spraw, by użytkownik mógł przejść całą podstawową ścieżkę w aplikacji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-uruchom-pierwsza-wersje-saas.polacz-kluczowe-elementy-saas.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'udostepnij-saas-w-srodowisku-produkcyjnym', 'Udostępnij SaaS w środowisku produkcyjnym',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Uruchom produkt na prawdziwej infrastrukturze, dostępnej dla realnych użytkowników.', 'Uruchom produkt na prawdziwej infrastrukturze, dostępnej dla realnych użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-uruchom-pierwsza-wersje-saas.udostepnij-saas-w-srodowisku-produkcyjnym.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'sprawdz-dzialanie-kluczowych-integracji', 'Sprawdź działanie kluczowych integracji',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Upewnij się, że integracje z innymi systemami działają poprawnie w praktyce.', 'Upewnij się, że integracje z innymi systemami działają poprawnie w praktyce. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-uruchom-pierwsza-wersje-saas.sprawdz-dzialanie-kluczowych-integracji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'sprawdz-dzialanie-platnosci-i-subskrypcji', 'Sprawdź działanie płatności i subskrypcji',
          null, false,
          null, null, null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Upewnij się, że płatność, zmiana planu i anulowanie subskrypcji działają bez problemów.', 'Upewnij się, że płatność, zmiana planu i anulowanie subskrypcji działają bez problemów. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-uruchom-pierwsza-wersje-saas.sprawdz-dzialanie-platnosci-i-subskrypcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-zakres-mvp', 'polacz-kluczowe-elementy-saas', 'udostepnij-saas-w-srodowisku-produkcyjnym', 'sprawdz-dzialanie-kluczowych-integracji', 'sprawdz-dzialanie-platnosci-i-subskrypcji']);

  -- ── punkt 2: Przetestuj SaaS z rzeczywistymi użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami', 'Przetestuj SaaS z rzeczywistymi użytkownikami', null,
          null, 'Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'udostepnij-produkt-pierwszym-uzytkownikom', 'Udostępnij produkt pierwszym użytkownikom',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Daj dostęp do SaaS wybranej grupie testowych użytkowników.', 'Daj dostęp do SaaS wybranej grupie testowych użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami.udostepnij-produkt-pierwszym-uzytkownikom.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeprowadz-onboarding-uzytkownikow', 'Przeprowadź onboarding użytkowników',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy nowi użytkownicy sami poradzą sobie z rozpoczęciem korzystania z produktu.', 'Sprawdź, czy nowi użytkownicy sami poradzą sobie z rozpoczęciem korzystania z produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami.przeprowadz-onboarding-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'obserwuj-zachowania-uzytkownikow', 'Obserwuj zachowania użytkowników',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Śledź, jak użytkownicy faktycznie korzystają z produktu.', 'Śledź, jak użytkownicy faktycznie korzystają z produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami.obserwuj-zachowania-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'rejestruj-problemy-podczas-uzytkowania', 'Rejestruj problemy podczas użytkowania',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapisuj napotkane błędy i trudności użytkowników.', 'Zapisuj napotkane błędy i trudności użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami.rejestruj-problemy-podczas-uzytkowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['udostepnij-produkt-pierwszym-uzytkownikom', 'przeprowadz-onboarding-uzytkownikow', 'obserwuj-zachowania-uzytkownikow', 'rejestruj-problemy-podczas-uzytkowania']);

  -- ── punkt 3: Zmierz wykorzystanie SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-zmierz-wykorzystanie-saas', 'Zmierz wykorzystanie SaaS', null,
          null, 'Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-aktywacje-uzytkownikow', 'Zmierz aktywację użytkowników',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ilu użytkowników dociera do pierwszego momentu wartości.', 'Sprawdź, ilu użytkowników dociera do pierwszego momentu wartości. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zmierz-wykorzystanie-saas.zmierz-aktywacje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-wykorzystanie-kluczowych-funkcji', 'Zmierz wykorzystanie kluczowych funkcji',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, które funkcje są rzeczywiście używane.', 'Sprawdź, które funkcje są rzeczywiście używane. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zmierz-wykorzystanie-saas.zmierz-wykorzystanie-kluczowych-funkcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-czestotliwosc-korzystania', 'Zmierz częstotliwość korzystania',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, jak często użytkownicy wracają do produktu.', 'Sprawdź, jak często użytkownicy wracają do produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zmierz-wykorzystanie-saas.zmierz-czestotliwosc-korzystania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-retencje-uzytkownikow', 'Zmierz retencję użytkowników',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ilu użytkowników pozostaje aktywnych po pewnym czasie.', 'Sprawdź, ilu użytkowników pozostaje aktywnych po pewnym czasie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zmierz-wykorzystanie-saas.zmierz-retencje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'porownaj-wyniki-z-zalozeniami', 'Porównaj wyniki z założeniami',
          null, false,
          null, null, null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zestaw rzeczywiste dane z wcześniej ustalonymi celami.', 'Zestaw rzeczywiste dane z wcześniej ustalonymi celami. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zmierz-wykorzystanie-saas.porownaj-wyniki-z-zalozeniami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-aktywacje-uzytkownikow', 'zmierz-wykorzystanie-kluczowych-funkcji', 'zmierz-czestotliwosc-korzystania', 'zmierz-retencje-uzytkownikow', 'porownaj-wyniki-z-zalozeniami']);

  -- ── punkt 4: Zweryfikuj wartość SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-zweryfikuj-wartosc-saas', 'Zweryfikuj wartość SaaS', null,
          null, 'Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'sprawdz-osiaganie-glownego-rezultatu', 'Sprawdź osiąganie głównego rezultatu',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Oceń, czy produkt realnie daje użytkownikom zakładaną wartość.', 'Oceń, czy produkt realnie daje użytkownikom zakładaną wartość. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-wartosc-saas.sprawdz-osiaganie-glownego-rezultatu.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbierz-feedback-uzytkownikow', 'Zbierz feedback użytkowników',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapytaj użytkowników, czy produkt jest dla nich przydatny.', 'Zapytaj użytkowników, czy produkt jest dla nich przydatny. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-wartosc-saas.zbierz-feedback-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zidentyfikuj-bariery-uzytkowania', 'Zidentyfikuj bariery użytkowania',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Znajdź, co przeszkadza użytkownikom w osiągnięciu wartości.', 'Znajdź, co przeszkadza użytkownikom w osiągnięciu wartości. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-wartosc-saas.zidentyfikuj-bariery-uzytkowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ocen-powtarzalnosc-wartosci', 'Oceń powtarzalność wartości',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy użytkownicy mają powód wracać do produktu regularnie.', 'Sprawdź, czy użytkownicy mają powód wracać do produktu regularnie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-wartosc-saas.ocen-powtarzalnosc-wartosci.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'okresl-najwazniejsze-problemy', 'Określ najważniejsze problemy',
          null, false,
          null, null, null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz problemy, które najbardziej wpływają na wartość produktu.', 'Wybierz problemy, które najbardziej wpływają na wartość produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-wartosc-saas.okresl-najwazniejsze-problemy.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-osiaganie-glownego-rezultatu', 'zbierz-feedback-uzytkownikow', 'zidentyfikuj-bariery-uzytkowania', 'ocen-powtarzalnosc-wartosci', 'okresl-najwazniejsze-problemy']);

  -- ── punkt 5: Zweryfikuj model subskrypcyjny
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-zweryfikuj-model-subskrypcyjny', 'Zweryfikuj model subskrypcyjny', null,
          null, 'Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu.',
          '[]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'sprawdz-konwersje-na-platne-plany', 'Sprawdź konwersję na płatne plany',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ilu użytkowników przechodzi na płatną wersję.', 'Sprawdź, ilu użytkowników przechodzi na płatną wersję. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-model-subskrypcyjny.sprawdz-konwersje-na-platne-plany.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'monitoruj-odnowienia-subskrypcji', 'Monitoruj odnowienia subskrypcji',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy płacący użytkownicy odnawiają subskrypcję.', 'Sprawdź, czy płacący użytkownicy odnawiają subskrypcję. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-model-subskrypcyjny.monitoruj-odnowienia-subskrypcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'monitoruj-anulowania-subskrypcji', 'Monitoruj anulowania subskrypcji',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ile osób rezygnuje i dlaczego.', 'Sprawdź, ile osób rezygnuje i dlaczego. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-model-subskrypcyjny.monitoruj-anulowania-subskrypcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-churn', 'Zmierz churn',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Oblicz, jaki procent klientów rezygnuje z subskrypcji.', 'Oblicz, jaki procent klientów rezygnuje z subskrypcji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-model-subskrypcyjny.zmierz-churn.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'porownaj-przychody-z-kosztami-obslugi', 'Porównaj przychody z kosztami obsługi',
          null, false,
          null, null, null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy model subskrypcyjny się opłaca.', 'Sprawdź, czy model subskrypcyjny się opłaca. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-zweryfikuj-model-subskrypcyjny.porownaj-przychody-z-kosztami-obslugi.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-konwersje-na-platne-plany', 'monitoruj-odnowienia-subskrypcji', 'monitoruj-anulowania-subskrypcji', 'zmierz-churn', 'porownaj-przychody-z-kosztami-obslugi']);

  -- ── punkt 6: Ulepsz lub zmień kierunek SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-ulepsz-lub-zmien-kierunek-saas', 'Ulepsz lub zmień kierunek SaaS', null,
          null, 'Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
          '[]'::jsonb, null,
          null, 6)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-priorytety-zmian', 'Ustal priorytety zmian',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz problemy o największym wpływie na wartość produktu.', 'Wybierz problemy o największym wpływie na wartość produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-ulepsz-lub-zmien-kierunek-saas.ustal-priorytety-zmian.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wprowadz-najwazniejsze-poprawki', 'Wprowadź najważniejsze poprawki',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zmień produkt zgodnie z danymi i feedbackiem.', 'Zmień produkt zgodnie z danymi i feedbackiem. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-ulepsz-lub-zmien-kierunek-saas.wprowadz-najwazniejsze-poprawki.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ponownie-przetestuj-zmienione-elementy', 'Ponownie przetestuj zmienione elementy',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy wprowadzone zmiany przyniosły efekt.', 'Sprawdź, czy wprowadzone zmiany przyniosły efekt. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.saas-ulepsz-lub-zmien-kierunek-saas.ponownie-przetestuj-zmienione-elementy.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ocen-potrzebe-zmiany-kierunku', 'Oceń potrzebę zmiany kierunku',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'decision', 'select',
          'Zdecyduj, czy potrzebna jest głębsza zmiana produktu lub modelu — co wybierasz?', 'Wybierz kierunek pracy. Żeby wstrzymać albo zarchiwizować startup, zakończ etap decyzją pauza lub archiwum — sama odpowiedź tego nie zrobi.', null,
          true, 'mvp.saas-ulepsz-lub-zmien-kierunek-saas.ocen-potrzebe-zmiany-kierunku.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['decision']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'okresl-kolejna-iteracje', 'Określ kolejną iterację',
          null, false,
          null, null, null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zaplanuj, co rozwijać lub sprawdzić w następnym kroku.', 'Zaplanuj, co rozwijać lub sprawdzić w następnym kroku.', null,
          true, 'mvp.saas-ulepsz-lub-zmien-kierunek-saas.okresl-kolejna-iteracje.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ustal-priorytety-zmian', 'wprowadz-najwazniejsze-poprawki', 'ponownie-przetestuj-zmienione-elementy', 'ocen-potrzebe-zmiany-kierunku', 'okresl-kolejna-iteracje']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['saas-uruchom-pierwsza-wersje-saas', 'saas-przetestuj-saas-z-rzeczywistymi-uzytkownikami', 'saas-zmierz-wykorzystanie-saas', 'saas-zweryfikuj-wartosc-saas', 'saas-zweryfikuj-model-subskrypcyjny', 'saas-ulepsz-lub-zmien-kierunek-saas']);

  -- ═══ kategoria: Hardware ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'hardware', 'Hardware', 'Warstwa dla urządzenia — pierwsza seria, awarie, łańcuch i decyzja o skali.',
          false, 3)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zrealizuj pierwszą wysyłkę i przetestuj logistykę
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke', 'Zrealizuj pierwszą wysyłkę i przetestuj logistykę', null,
          null, 'Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wyslij-pierwsza-serie-produktow-pvt', 'Wyślij pierwszą serię produktów (PVT)',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Przekaż wyprodukowane 50–100 sztuk pierwszym klientom lub testerom i sprawdź cały proces od przygotowania zamówienia do dostarczenia produktu.', 'Przekaż wyprodukowane 50–100 sztuk pierwszym klientom lub testerom i sprawdź cały proces od przygotowania zamówienia do dostarczenia produktu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.wyslij-pierwsza-serie-produktow-pvt.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'skontroluj-stan-przesylek-i-pakowanie', 'Skontroluj stan przesyłek i pakowanie',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy opakowania dobrze chronią urządzenia podczas transportu oraz czy produkty docierają do odbiorców bez uszkodzeń.', 'Sprawdź, czy opakowania dobrze chronią urządzenia podczas transportu oraz czy produkty docierają do odbiorców bez uszkodzeń. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.skontroluj-stan-przesylek-i-pakowanie.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-czas-unboxingu-i-pierwszego-uruchomienia', 'Zmierz czas unboxingu i pierwszego uruchomienia',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ile czasu użytkownik potrzebuje na rozpakowanie, podłączenie i uruchomienie urządzenia, aby wykryć elementy powodujące frustrację lub zwroty.', 'Sprawdź, ile czasu użytkownik potrzebuje na rozpakowanie, podłączenie i uruchomienie urządzenia, aby wykryć elementy powodujące frustrację lub zwroty. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.zmierz-czas-unboxingu-i-pierwszego-uruchomienia.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zweryfikuj-wydajnosc-obslugi-klienta', 'Zweryfikuj wydajność obsługi klienta',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Obserwuj liczbę pytań technicznych i zgłoszeń oraz czas potrzebny zespołowi na udzielenie użytkownikom pomocy.', 'Obserwuj liczbę pytań technicznych i zgłoszeń oraz czas potrzebny zespołowi na udzielenie użytkownikom pomocy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.zweryfikuj-wydajnosc-obslugi-klienta.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wyslij-pierwsza-serie-produktow-pvt', 'skontroluj-stan-przesylek-i-pakowanie', 'zmierz-czas-unboxingu-i-pierwszego-uruchomienia', 'zweryfikuj-wydajnosc-obslugi-klienta']);

  -- ── punkt 2: Zbadaj awaryjność i satysfakcję w użytkowaniu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu', 'Zbadaj awaryjność i satysfakcję w użytkowaniu', null,
          null, 'Następnie należy zbadać awaryjność i satysfakcję z użytkowania.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'oblicz-wskaznik-awaryjnosci-rma', 'Oblicz wskaźnik awaryjności (RMA)',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Policz, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach użytkowania.', 'Policz, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach użytkowania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.oblicz-wskaznik-awaryjnosci-rma.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeprowadz-wywiady-usterkowe-z-uzytkownikami', 'Przeprowadź wywiady usterkowe z użytkownikami',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapytaj użytkowników o problemy z baterią, obudową, przyciskami, łącznością i innymi elementami urządzenia, aby znaleźć powtarzające się usterki.', 'Zapytaj użytkowników o problemy z baterią, obudową, przyciskami, łącznością i innymi elementami urządzenia, aby znaleźć powtarzające się usterki. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.przeprowadz-wywiady-usterkowe-z-uzytkownikami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-poziom-satysfakcji-nps', 'Zmierz poziom satysfakcji (NPS)',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapytaj pierwszych użytkowników, jak prawdopodobne jest, że polecą urządzenie znajomym, i wykorzystaj odpowiedzi do oceny ich ogólnej satysfakcji.', 'Zapytaj pierwszych użytkowników, jak prawdopodobne jest, że polecą urządzenie znajomym, i wykorzystaj odpowiedzi do oceny ich ogólnej satysfakcji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.zmierz-poziom-satysfakcji-nps.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zaktualizuj-oprogramowanie-ukladowe-firmware', 'Zaktualizuj oprogramowanie układowe (Firmware)',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wypuść pierwszą zdalną aktualizację firmware''u, aby naprawić błędy wykryte podczas rzeczywistego użytkowania sprzętu.', 'Wypuść pierwszą zdalną aktualizację firmware''u, aby naprawić błędy wykryte podczas rzeczywistego użytkowania sprzętu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.zaktualizuj-oprogramowanie-ukladowe-firmware.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['oblicz-wskaznik-awaryjnosci-rma', 'przeprowadz-wywiady-usterkowe-z-uzytkownikami', 'zmierz-poziom-satysfakcji-nps', 'zaktualizuj-oprogramowanie-ukladowe-firmware']);

  -- ── punkt 3: Przygotuj proces reklamacji i obsługi posprzedażowej
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej', 'Przygotuj proces reklamacji i obsługi posprzedażowej', null,
          null, 'Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-procedure-wymiany-wadliwych-sztuk', 'Ustal procedurę wymiany wadliwych sztuk',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Określ prosty sposób zgłaszania i zwracania uszkodzonego sprzętu oraz przygotuj zapasowe urządzenia, które można szybko wysłać w ramach wymiany.', 'Określ prosty sposób zgłaszania i zwracania uszkodzonego sprzętu oraz przygotuj zapasowe urządzenia, które można szybko wysłać w ramach wymiany. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.ustal-procedure-wymiany-wadliwych-sztuk.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'diagnozuj-przyczyny-awarii', 'Diagnozuj przyczyny awarii',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Odbieraj uszkodzone urządzenia, analizuj ich poszczególne elementy i ustalaj bezpośrednią przyczynę każdej usterki.', 'Odbieraj uszkodzone urządzenia, analizuj ich poszczególne elementy i ustalaj bezpośrednią przyczynę każdej usterki. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.diagnozuj-przyczyny-awarii.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'stworz-baze-wiedzy-dla-wsparcia', 'Stwórz bazę wiedzy dla wsparcia',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapisuj najczęściej powtarzające się pytania i problemy, a następnie przygotuj na ich podstawie FAQ, instrukcje lub krótkie materiały wideo.', 'Zapisuj najczęściej powtarzające się pytania i problemy, a następnie przygotuj na ich podstawie FAQ, instrukcje lub krótkie materiały wideo. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.stworz-baze-wiedzy-dla-wsparcia.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ustal-procedure-wymiany-wadliwych-sztuk', 'diagnozuj-przyczyny-awarii', 'stworz-baze-wiedzy-dla-wsparcia']);

  -- ── punkt 4: Zabezpiecz łańcuch dostaw pod większą produkcję
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje', 'Zabezpiecz łańcuch dostaw pod większą produkcję', null,
          null, 'Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'sprawdz-dostepnosc-komponentow-u-dostawcow', 'Sprawdź dostępność komponentów u dostawców',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Upewnij się, że kluczowe układy, materiały i inne komponenty są dostępne w ilościach potrzebnych do kolejnej serii produkcyjnej.', 'Upewnij się, że kluczowe układy, materiały i inne komponenty są dostępne w ilościach potrzebnych do kolejnej serii produkcyjnej. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.sprawdz-dostepnosc-komponentow-u-dostawcow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'renegocjuj-ceny-przy-wyzszym-wolumenie', 'Renegocjuj ceny przy wyższym wolumenie',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wykorzystaj większą liczbę planowanych zamówień do negocjowania z fabryką niższego kosztu jednostkowego produkcji.', 'Wykorzystaj większą liczbę planowanych zamówień do negocjowania z fabryką niższego kosztu jednostkowego produkcji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.renegocjuj-ceny-przy-wyzszym-wolumenie.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zamknij-liste-poprawek-w-projekcie', 'Zamknij listę poprawek w projekcie',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wprowadź ostatnie niezbędne zmiany w obudowie, elektronice lub innych elementach na podstawie problemów wykrytych podczas pierwszej serii.', 'Wprowadź ostatnie niezbędne zmiany w obudowie, elektronice lub innych elementach na podstawie problemów wykrytych podczas pierwszej serii. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.zamknij-liste-poprawek-w-projekcie.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-dostepnosc-komponentow-u-dostawcow', 'renegocjuj-ceny-przy-wyzszym-wolumenie', 'zamknij-liste-poprawek-w-projekcie']);

  -- ── punkt 5: Potwierdź marżowość i zamów serię masową
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa', 'Potwierdź marżowość i zamów serię masową', null,
          null, 'Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.',
          '[]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zderz-rzeczywisty-koszt-jednostkowy-z-przychodem', 'Zderz rzeczywisty koszt jednostkowy z przychodem',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Policz pełny koszt jednego produktu, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównaj go z ceną sprzedaży.', 'Policz pełny koszt jednego produktu, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównaj go z ceną sprzedaży. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-potwierdz-marzowosc-i-zamow-serie-masowa.zderz-rzeczywisty-koszt-jednostkowy-z-przychodem.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'uzyskaj-twarde-zamowienia-na-wiekszy-wolumen', 'Uzyskaj twarde zamówienia na większy wolumen',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zbierz przedsprzedaż lub konkretne deklaracje zamówień od dystrybutorów, aby potwierdzić popyt i pomóc pokryć koszty uruchomienia większej produkcji.', 'Zbierz przedsprzedaż lub konkretne deklaracje zamówień od dystrybutorów, aby potwierdzić popyt i pomóc pokryć koszty uruchomienia większej produkcji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.hardware-potwierdz-marzowosc-i-zamow-serie-masowa.uzyskaj-twarde-zamowienia-na-wiekszy-wolumen.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'podejmij-decyzje-o-zamowieniu-masowym', 'Podejmij decyzję o zamówieniu masowym',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'decision', 'select',
          'Na podstawie marży, jakości produktu i potwierdzonego popytu zdecyduj, czy wpłacić zaliczkę na produkcję masową, czy wstrzymać projekt — co wybierasz?', 'Wybierz kierunek pracy. Żeby wstrzymać albo zarchiwizować startup, zakończ etap decyzją pauza lub archiwum — sama odpowiedź tego nie zrobi.', null,
          true, 'mvp.hardware-potwierdz-marzowosc-i-zamow-serie-masowa.podejmij-decyzje-o-zamowieniu-masowym.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['decision']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zderz-rzeczywisty-koszt-jednostkowy-z-przychodem', 'uzyskaj-twarde-zamowienia-na-wiekszy-wolumen', 'podejmij-decyzje-o-zamowieniu-masowym']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['hardware-zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke', 'hardware-zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu', 'hardware-przygotuj-proces-reklamacji-i-obslugi-posprzedazowej', 'hardware-zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje', 'hardware-potwierdz-marzowosc-i-zamow-serie-masowa']);

  -- ═══ kategoria: B2B ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2b', 'B2B', 'Warstwa dla sprzedaży do firm — MVP, test z klientami biznesowymi, feedback.',
          false, 4)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zbuduj minimalną wersję rozwiązania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-zbuduj-minimalna-wersje-rozwiazania', 'Zbuduj minimalną wersję rozwiązania', null,
          null, '1.1. Zrealizuj podstawowe funkcje MVP
Otwórz ustalenia dotyczące zakresu pierwszej wersji przeznaczonej dla klientów biznesowych. Skup się wyłącznie na stworzeniu tych funkcji, które są absolutnie niezbędne do udowodnienia głównej wartości rozwiązania B2B i rozwiązania konkretnego problemu biznesowego klienta. Unikaj budowania funkcji „na przyszłość”, rozbudowanych ról użytkowników czy zaawansowanych paneli administracyjnych, które wydłużają czas tworzenia i odciągają uwagę od weryfikacji hipotezy głównej.
Podepnij istniejący Goal albo utwórz Goal typu „Wynik budowy”. Może brzmieć: „Dostarczenie minimalnej wersji modułu do automatyzacji faktur B2B bez zbędnych integracji”. Przypisz osobę odpowiedzialną technicznie, uzgodnij termin i wskaż oczekiwany proof, czyli dowód wykonania. W tym przypadku dowodem będzie nagranie ekranu lub prezentacja działającego głównego mechanizmu oraz odnośnik do wersji roboczej.
Uzgodnij w zespole granice wersji minimalnej: jeśli dana funkcja nie wpływa bezpośrednio na decyzję klienta o przetestowaniu lub zakupie, odłóż ją na późniejsze etapy. W Vairo wystarczą zadania przy wspólnym celu do śledzenia postępów prac.
1.2. Połącz kluczowe elementy rozwiązania
Po stworzeniu pojedynczych modułów upewnij się, że składają się one w spójną, działającą ścieżkę użytkownika biznesowego (End-to-End). Użytkownik musi być w stanie przejść cały proces: od pierwszego zalogowania się lub przekazania danych, przez wykonanie kluczowej operacji biznesowej, aż po uzyskanie oczekiwanego wyniku (np. wygenerowanie raportu, wysłanie powiadomienia, przetworzenie pliku).
Przeanalizuj z wykonawcą punkty styku między komponentami:
Czy dane wprowadzane w pierwszym kroku są poprawnie przekazywane do kolejnych modułów?
Czy ewentualne uproszczenia (np. ręczne wykonywanie części procesu w tle przez zespół startupu – tzw. Wizard of Oz) nie przerywają płynności z perspektywy klienta B2B?
W karcie celu (proof) zamieść scenariusz przejścia ścieżki i materiał potwierdzający, że wszystkie elementy współpracują jako spójny produkt.
1.3. Udostępnij MVP do testowania
Nie trzymaj produktu wewnątrz zespołu i nie przedłużaj testów wewnętrznych. Wprowadź minimalną wersję rozwiązania do rzeczywistego środowiska operacyjnego klientów. Oddanie MVP w ręce prawdziwych użytkowników biznesowych jest jedynym sposobem, aby sprawdzić, jak aplikacja zachowuje się w realnych warunkach pracy, przy rzeczywistych procedurach i ograniczeniach firmy klienta.
Przygotuj stabilną instancję testową (środowisko produkcyjne lub stagingowe z odizolowanymi danymi). Upewnij się, że dostępy dla pierwszych firm są skonfigurowane, a poufne dane testowe nie mieszają się między sobą.
Jako proof zachowaj adres udostępnionej wersji, listę nadanych dostępów testowych oraz potwierdzenie uruchomienia środowiska gotowego do przyjmowania użytkowników zewnętrznych.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zrealizuj-podstawowe-funkcje-mvp', 'Zrealizuj podstawowe funkcje MVP',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Stwórz tylko funkcje niezbędne do sprawdzenia głównej wartości rozwiązania. Skup się wyłącznie na tym, co pozwoli sprawdzić, czy Twoje rozwiązanie faktycznie rozwiązuje problem klienta B2B — unikaj dodawania funkcji „na przyszłość”, bo wydłużają czas budowy i odciągają uwagę od głównego celu.', 'Stwórz tylko funkcje niezbędne do sprawdzenia głównej wartości rozwiązania. Skup się wyłącznie na tym, co pozwoli sprawdzić, czy Twoje rozwiązanie faktycznie rozwiązuje problem klienta B2B — unikaj dodawania funkcji „na przyszłość”, bo wydłużają czas budowy i odciągają uwagę od głównego celu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbuduj-minimalna-wersje-rozwiazania.zrealizuj-podstawowe-funkcje-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'polacz-kluczowe-elementy-rozwiazania', 'Połącz kluczowe elementy rozwiązania',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapewnij działanie podstawowej ścieżki użytkownika. Upewnij się, że użytkownik może przejść całą podstawową ścieżkę — od pierwszego kontaktu z produktem aż po uzyskanie głównej wartości — a wszystkie elementy MVP działają razem jako spójna całość, nawet jeśli są uproszczone.', 'Zapewnij działanie podstawowej ścieżki użytkownika. Upewnij się, że użytkownik może przejść całą podstawową ścieżkę — od pierwszego kontaktu z produktem aż po uzyskanie głównej wartości — a wszystkie elementy MVP działają razem jako spójna całość, nawet jeśli są uproszczone. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbuduj-minimalna-wersje-rozwiazania.polacz-kluczowe-elementy-rozwiazania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'udostepnij-mvp-do-testowania', 'Udostępnij MVP do testowania',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wprowadź minimalną wersję rozwiązania do rzeczywistego użytkowania. Oddaj MVP w ręce prawdziwych użytkowników biznesowych, zamiast testować je tylko wewnątrz zespołu — dopiero kontakt z realnymi warunkami pracy klienta pokaże, czy rozwiązanie się sprawdza.', 'Wprowadź minimalną wersję rozwiązania do rzeczywistego użytkowania. Oddaj MVP w ręce prawdziwych użytkowników biznesowych, zamiast testować je tylko wewnątrz zespołu — dopiero kontakt z realnymi warunkami pracy klienta pokaże, czy rozwiązanie się sprawdza. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbuduj-minimalna-wersje-rozwiazania.udostepnij-mvp-do-testowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-podstawowe-funkcje-mvp', 'polacz-kluczowe-elementy-rozwiazania', 'udostepnij-mvp-do-testowania']);

  -- ── punkt 2: Rozpocznij testowanie z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-rozpocznij-testowanie-z-uzytkownikami', 'Rozpocznij testowanie z użytkownikami', null,
          null, '2.1. Określ grupę badawczą i ustal okres badania
Wybierz firmy oraz konkretne osoby (role w organizacji, np. Managerowie, Specjaliści), które najlepiej reprezentują Twoją docelową grupę klientów B2B. Powinny to być podmioty, które bezpośrednio odczuwają problem i szukają jego rozwiązania.
Następnie wyznacz jasny ramowy czas trwania pilotażu/testu:
Zbyt krótki czas (np. 2 dni) nie pozwoli użytkownikom wdrożyć narzędzia do codzienne rutyny i nie pokaże realnego poziomu wykorzystania.
Zbyt długi okres bez wyznaczonego końca rozmywa zaangażowanie i opóźnia zbieranie wniosków. Optymalny okres pilotażu B2B wynosi zazwyczaj od 2 do 4 tygodni.
Podepnij Goal typu „Wynik testu”. W opisie zapisz kryteria doboru firm (profile idealnego klienta - ICP), listę zakwalifikowanych podmiotów oraz daty rozpoczęcia i zakończenia badania.
2.2. Udostępnij MVP użytkownikom oraz obserwuj reakcje użytkowników
Przekaż wybranej grupie badawczej dostępy do rozwiązania wraz z jak najprostszą, zwięzłą instrukcją wdrożeniową (np. krótkim wideo onboardingowym lub 1-stronicowym przewodnikiem PDF). Proces rozpoczęcia korzystania z produktu musi generować jak najmniej tarcia.
W trakcie trwania okresu testowego aktywnie obserwuj zachowanie użytkowników:
Śledź analitykę produktową: które funkcje są uruchamiane codziennie, które zostały użyte tylko raz, a które są całkowicie ignorowane.
Notuj miejsca, w których użytkownicy utknęli lub wymagali asysty zespołu wsparcia. Obiektywne dane o użytkowaniu są znacznie bardziej wiarygodne niż późniejsze deklaracje słowne podczas wywiadów.
Jako proof dołącz raport aktywności użytkowników z okresu testowego (np. z narzędzia analitycznego lub rejestru zdarzeń) wskazujący częstotliwość logowań i wykorzystanie poszczególnych modułów.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'okresl-grupe-badawcza', 'Określ grupę badawczą',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz osoby odpowiednie do testowania rozwiązania. Wybierz firmy lub osoby, które najlepiej reprezentują Twoją docelową grupę klientów B2B i realnie mierzą się z problemem, który rozwiązujesz.', 'Wybierz osoby odpowiednie do testowania rozwiązania. Wybierz firmy lub osoby, które najlepiej reprezentują Twoją docelową grupę klientów B2B i realnie mierzą się z problemem, który rozwiązujesz. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-rozpocznij-testowanie-z-uzytkownikami.okresl-grupe-badawcza.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-okres-badania', 'Ustal okres badania',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Określ, jak długo użytkownicy będą testować MVP. Wyznacz konkretny przedział czasowy testów, aby użytkownicy mieli wystarczająco dużo czasu na poznanie produktu — zbyt krótki okres nie pozwoli zaobserwować realnego sposobu korzystania z rozwiązania.', 'Określ, jak długo użytkownicy będą testować MVP. Wyznacz konkretny przedział czasowy testów, aby użytkownicy mieli wystarczająco dużo czasu na poznanie produktu — zbyt krótki okres nie pozwoli zaobserwować realnego sposobu korzystania z rozwiązania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-rozpocznij-testowanie-z-uzytkownikami.ustal-okres-badania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'udostepnij-mvp-uzytkownikom', 'Udostępnij MVP użytkownikom',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapewnij wybranej grupie dostęp do rozwiązania. Przekaż grupie testowej dostęp do MVP wraz z prostą instrukcją, jak zacząć z niego korzystać, dbając, by proces wdrożenia był jak najprostszy.', 'Zapewnij wybranej grupie dostęp do rozwiązania. Przekaż grupie testowej dostęp do MVP wraz z prostą instrukcją, jak zacząć z niego korzystać, dbając, by proces wdrożenia był jak najprostszy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-rozpocznij-testowanie-z-uzytkownikami.udostepnij-mvp-uzytkownikom.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'obserwuj-reakcje-uzytkownikow', 'Obserwuj reakcje użytkowników',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zwracaj uwagę na sposób korzystania i pojawiające się problemy. Śledź, które funkcje użytkownicy faktycznie wykorzystują, a które ignorują, oraz gdzie napotykają trudności — te obserwacje często mówią więcej niż same deklaracje.', 'Zwracaj uwagę na sposób korzystania i pojawiające się problemy. Śledź, które funkcje użytkownicy faktycznie wykorzystują, a które ignorują, oraz gdzie napotykają trudności — te obserwacje często mówią więcej niż same deklaracje. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-rozpocznij-testowanie-z-uzytkownikami.obserwuj-reakcje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['okresl-grupe-badawcza', 'ustal-okres-badania', 'udostepnij-mvp-uzytkownikom', 'obserwuj-reakcje-uzytkownikow']);

  -- ── punkt 3: Zbierz feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-zbierz-feedback', 'Zbierz feedback', null,
          null, '3.1. Zbieraj opinie użytkowników i konsultuj rozwiązanie z ekspertami
Po upływie wyznaczonego okresu testowego przeprowadź ustrukturyzowane rozmowy (wywiady ewaluacyjne) lub wyślij krótkie ankiety do osób, które testowały MVP. Wywiady B2B powinny obejmować zarówno osoby wykonujące pracę w narzędziu (end-userów), jak i osoby podejmujące decyzje finansowe (decision-makerów/buyerów).
Równolegle skonsultuj rozwiązanie z niezależnymi ekspertami branżowymi, doradcami lub doświadczonymi przedsiębiorcami B2B. Eksperci potrafią wskazać ryzyka systemowe, kwestie prawne, wymogi bezpieczeństwa czy bariery integracyjne, których zwykły użytkownik końcowy może nie zauważyć.
Podepnij Goal dotyczący zbierania informacji ewaluacyjnych. W dowodzie (proof) dołącz nagrania/notatki z wywiadów z użytkownikami oraz podsumowanie opinii uzyskanych od ekspertów branżowych.
3.2. Zbieraj informacje o problemach oraz oczekiwania użytkowników
Stwórz jeden uporządkowany rejestr (np. dokument lub dedykowaną tablicę), w którym zebrany zostanie cały jakościowy materiał zwrotny podzielony na dwie kategoryczne grupy:
Rejestr błędów i barier: Pomyłki techniczne (bugi), błędy interfejsu (UX), momenty dezorientacji, wolne działanie oraz miejsca niejasne dla użytkownika.
Rejestr życzeń i oczekiwań (Feature Requests): Wszystkie propozycje nowych funkcji, zmian w istniejących procesach czy integracji z innymi systemami biznesowymi używanymi w firmie klienta.
Wykonawca oraz osoba odpowiedzialna za produkt powinni pilnować, aby każda zgłoszona usterka miała przypisany kontekst (w jakiej firmie i przy jakiej operacji wystąpiła).
Jako proof dołącz kompletny dokument zawierający zagregowaną listę barier oraz zgłoszonych propozycji rozwojowych.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-opinie-uzytkownikow', 'Zbieraj opinie użytkowników',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Pozyskaj bezpośrednie informacje o doświadczeniach z MVP. Przeprowadź rozmowy, ankiety lub krótkie wywiady, aby poznać subiektywne odczucia użytkowników i dowiedzieć się wprost, co im się podobało, a co sprawiało trudność.', 'Pozyskaj bezpośrednie informacje o doświadczeniach z MVP. Przeprowadź rozmowy, ankiety lub krótkie wywiady, aby poznać subiektywne odczucia użytkowników i dowiedzieć się wprost, co im się podobało, a co sprawiało trudność. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbierz-feedback.zbieraj-opinie-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'konsultuj-rozwiazanie-z-ekspertami', 'Konsultuj rozwiązanie z ekspertami',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zasięgnij opinii osób posiadających odpowiednią wiedzę lub doświadczenie. Skonsultuj się z ekspertami z branży lub doświadczonymi przedsiębiorcami, którzy spojrzą na rozwiązanie z szerszej perspektywy i pomogą wychwycić ryzyka niewidoczne dla użytkowników.', 'Zasięgnij opinii osób posiadających odpowiednią wiedzę lub doświadczenie. Skonsultuj się z ekspertami z branży lub doświadczonymi przedsiębiorcami, którzy spojrzą na rozwiązanie z szerszej perspektywy i pomogą wychwycić ryzyka niewidoczne dla użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbierz-feedback.konsultuj-rozwiazanie-z-ekspertami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-informacje-o-problemach', 'Zbieraj informacje o problemach',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Rejestruj usterki, trudności i niezrozumiałe elementy. Dokumentuj wszystkie zgłoszone błędy techniczne, momenty zagubienia użytkownika i niejasne elementy interfejsu — taka lista stanie się podstawą dalszych poprawek.', 'Rejestruj usterki, trudności i niezrozumiałe elementy. Dokumentuj wszystkie zgłoszone błędy techniczne, momenty zagubienia użytkownika i niejasne elementy interfejsu — taka lista stanie się podstawą dalszych poprawek. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbierz-feedback.zbieraj-informacje-o-problemach.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbieraj-oczekiwania-uzytkownikow', 'Zbieraj oczekiwania użytkowników',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zapisuj propozycje dotyczące funkcji głównych i dodatkowych. Notuj wszystkie pomysły i sugestie użytkowników, aby lepiej zrozumieć, czego naprawdę potrzebuje rynek.', 'Zapisuj propozycje dotyczące funkcji głównych i dodatkowych. Notuj wszystkie pomysły i sugestie użytkowników, aby lepiej zrozumieć, czego naprawdę potrzebuje rynek. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-zbierz-feedback.zbieraj-oczekiwania-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zbieraj-opinie-uzytkownikow', 'konsultuj-rozwiazanie-z-ekspertami', 'zbieraj-informacje-o-problemach', 'zbieraj-oczekiwania-uzytkownikow']);

  -- ── punkt 4: Przeanalizuj feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-przeanalizuj-feedback', 'Przeanalizuj feedback', null,
          null, '4.1. Oceń poziom zadowolenia i przeanalizuj zgłaszane problemy
Przejdź od zgromadzonych danych do wyciągania wniosków. Oceń ogólny poziom satysfakcji użytkowników z wykorzystaniem prostych wskaźników jakościowych i ilościowych (np. wskaźnik NPS – Net Promoter Score, ocena przydatności narzędzia w skali 1-5 lub wskaźnik Customer Effort Score).
Następnie pogrupuj zebrane usterki i bariery:
Policz częstotliwość występowania poszczególnych problemów (który błąd dotknął 80% użytkowników, a który był incydentem jednorazowym).
Określ krytyczność błędu: czy problem blokuje uzyskanie głównej wartości, czy jest jedynie drobną niedogodnością wizualną.
Zapisz wynik priorytetyzacji błędów w karcie celu, wskazując usterki o najwyższym wpływie na satysfakcję klientów B2B.
4.2. Przeanalizuj potrzeby dotyczące funkcji i wyciągnij najważniejsze wnioski
Rozdziel zgłoszone życzenia dotyczące nowych funkcji na dwie kategorie:
Funkcje krytyczne (Must-have): Elementy, bez których klient B2B nie podejmie decyzji o zakupie lub dalszym korzystaniu z aplikacji (np. wymóg konkretnej integracji lub eksportu danych do PDF/XLS).
Dodatki (Nice-to-have): Funkcje ułatwiające pracę, ale niemające kluczowego wpływu na decyzję biznesową i wartość główną.
Zestaw uzyskaną wiedzę z pierwotnymi założeniami biznesowymi startupu. Sporządź podsumowanie w układzie:
Co zostało potwierdzone (które hipotezy okazały się prawdziwe).
Co zostało podważone / obalone (które założenia rynkowe okazały się błędne).
Co nadal pozostaje niewiadomą i wymaga dalszych testów.
Do proof wklej dokument z syntezą analizy oraz zestawieniem potwierdzonych i obalonych założeń biznesowych.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ocen-poziom-zadowolenia', 'Oceń poziom zadowolenia',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, jak użytkownicy oceniają rozwiązanie. Przeanalizuj zebrane opinie, aby ocenić ogólny poziom satysfakcji, korzystając np. z prostej skali ocen lub wskaźnika NPS.', 'Sprawdź, jak użytkownicy oceniają rozwiązanie. Przeanalizuj zebrane opinie, aby ocenić ogólny poziom satysfakcji, korzystając np. z prostej skali ocen lub wskaźnika NPS. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-przeanalizuj-feedback.ocen-poziom-zadowolenia.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeanalizuj-zglaszane-problemy', 'Przeanalizuj zgłaszane problemy',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zidentyfikuj najczęściej pojawiające się usterki i bariery. Pogrupuj zgłoszone problemy według częstotliwości występowania, aby wskazać te dotyczące największej liczby użytkowników i ustalić priorytety dalszych prac.', 'Zidentyfikuj najczęściej pojawiające się usterki i bariery. Pogrupuj zgłoszone problemy według częstotliwości występowania, aby wskazać te dotyczące największej liczby użytkowników i ustalić priorytety dalszych prac. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-przeanalizuj-feedback.przeanalizuj-zglaszane-problemy.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeanalizuj-potrzeby-dotyczace-funkcji', 'Przeanalizuj potrzeby dotyczące funkcji',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Określ, których funkcji użytkownicy rzeczywiście potrzebują. Oddziel funkcje niezbędne dla głównej wartości produktu od tych, które są jedynie miłym dodatkiem, koncentrując się na tym, co realnie wpływa na decyzje zakupowe klientów B2B.', 'Określ, których funkcji użytkownicy rzeczywiście potrzebują. Oddziel funkcje niezbędne dla głównej wartości produktu od tych, które są jedynie miłym dodatkiem, koncentrując się na tym, co realnie wpływa na decyzje zakupowe klientów B2B. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-przeanalizuj-feedback.przeanalizuj-potrzeby-dotyczace-funkcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wyciagnij-najwazniejsze-wnioski', 'Wyciągnij najważniejsze wnioski',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Ustal, co zostało potwierdzone, podważone lub pozostaje niewiadome. Podsumuj, które z pierwotnych założeń biznesowych potwierdziły się w testach, które zostały obalone, a które wciąż wymagają weryfikacji.', 'Ustal, co zostało potwierdzone, podważone lub pozostaje niewiadome. Podsumuj, które z pierwotnych założeń biznesowych potwierdziły się w testach, które zostały obalone, a które wciąż wymagają weryfikacji. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-przeanalizuj-feedback.wyciagnij-najwazniejsze-wnioski.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ocen-poziom-zadowolenia', 'przeanalizuj-zglaszane-problemy', 'przeanalizuj-potrzeby-dotyczace-funkcji', 'wyciagnij-najwazniejsze-wnioski']);

  -- ── punkt 5: Określ kierunek dalszego działania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-okresl-kierunek-dalszego-dzialania', 'Określ kierunek dalszego działania', null,
          null, '5.1. Ustal najważniejsze poprawki i zaplanuj ulepszenie MVP
Na podstawie przeprowadzonej analizy wybierz ograniczony zestaw poprawek o najwyższym priorytecie. Zamiast próbować wdrożyć wszystkie zachcianki użytkowników naraz, skup się na zmianach, które przyniosą największy przyrost wartości i usuną główne blokady sprzedażowe.
Przygotuj realistyczny, osadzony w czasie plan prac naprawczych (Roadmapa poprawek):
Wskazanie konkretnych modyfikacji w kodzie lub interfejsie.
Kolejność wdrożenia (sekwencja zmian).
Szacowany czas wykonania poprawek przez zespół techniczny.
Podepnij Goal typu „Wynik budowy” dla planowanej iteracji. Dołącz zatwierdzony plan ulepszenia MVP ze zdefiniowanym zakresem prac.
5.2. Rozważ zmianę założeń i podejmij decyzję o dalszym działaniu
Przeanalizuj, czy skala negatywnego feedbacku, niskie zaangażowanie lub krytyczne uwagi ekspertów nie wymagają modyfikacji dotychczasowej strategii (Pivot).
Oceń konieczność zmiany w obszarach:
Modelu biznesowego (np. zmiana z subskrypcji na opłatę za użycie).
Grupy docelowej (np. przejście od małych firm do średnich przedsiębiorstw).
Głównej funkcji / propozycji wartości (przesunięcie ciężaru na inny moduł aplikacji).
Na podstawie twardych danych podejmij jedną z trzech decyzji strategicznych:
Kontynuacja i rozwój: Kontynuowanie prac w obecnym kierunku i przejście do ponownych testów po wdrożeniu poprawek.
Pivot: Formalna zmiana strategii, modelu lub grupy docelowej i przeprojektowanie założeń MVP.
Zakończenie projektu (Kill): Świadome zamknięcie prac nad rozwiązaniem, jeśli testy wykazały brak realnego popytu lub nieopłacalność ekonomiczną.
Zapisz wybraną decyzję strategiczną wraz z uzasadnieniem w karcie podsumowującej w Vairo.',
          '[]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ustal-najwazniejsze-poprawki', 'Ustal najważniejsze poprawki',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wybierz zmiany mające największy wpływ na wartość produktu. Wybierz spośród wniosków te zmiany, które przyniosą użytkownikom największą korzyść, zamiast próbować wprowadzić wszystko naraz.', 'Wybierz zmiany mające największy wpływ na wartość produktu. Wybierz spośród wniosków te zmiany, które przyniosą użytkownikom największą korzyść, zamiast próbować wprowadzić wszystko naraz. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-okresl-kierunek-dalszego-dzialania.ustal-najwazniejsze-poprawki.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zaplanuj-ulepszenie-mvp', 'Zaplanuj ulepszenie MVP',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Określ, jak dostosować rozwiązanie do otrzymanego feedbacku. Stwórz konkretny, realistyczny plan działania opisujący, jakie zmiany zostaną wprowadzone, w jakiej kolejności i w jakim czasie.', 'Określ, jak dostosować rozwiązanie do otrzymanego feedbacku. Stwórz konkretny, realistyczny plan działania opisujący, jakie zmiany zostaną wprowadzone, w jakiej kolejności i w jakim czasie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-okresl-kierunek-dalszego-dzialania.zaplanuj-ulepszenie-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'defined', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'rozwaz-zmiane-zalozen', 'Rozważ zmianę założeń',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Oceń, czy potrzebna jest częściowa lub całkowita zmiana kierunku. Zastanów się, czy wyniki testów wskazują na konieczność pivotu — zmiany modelu biznesowego, grupy docelowej lub głównej funkcji produktu.', 'Oceń, czy potrzebna jest częściowa lub całkowita zmiana kierunku. Zastanów się, czy wyniki testów wskazują na konieczność pivotu — zmiany modelu biznesowego, grupy docelowej lub głównej funkcji produktu.', null,
          true, 'mvp.b2b-okresl-kierunek-dalszego-dzialania.rozwaz-zmiane-zalozen.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'podejmij-decyzje-o-dalszym-dzialaniu', 'Podejmij decyzję o dalszym działaniu',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'decision', 'select',
          'Wybierz dalszy rozwój, pivot lub zakończenie projektu. Na podstawie zebranych danych zdecyduj świadomie, czy kontynuować rozwój w obecnym kierunku, zmienić strategię, czy zakończyć projekt — co wybierasz?', 'Wybierz kierunek pracy. Żeby wstrzymać albo zarchiwizować startup, zakończ etap decyzją pauza lub archiwum — sama odpowiedź tego nie zrobi.', null,
          true, 'mvp.b2b-okresl-kierunek-dalszego-dzialania.podejmij-decyzje-o-dalszym-dzialaniu.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['decision']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ustal-najwazniejsze-poprawki', 'zaplanuj-ulepszenie-mvp', 'rozwaz-zmiane-zalozen', 'podejmij-decyzje-o-dalszym-dzialaniu']);

  -- ── punkt 6: Ponownie przetestuj rozwiązanie
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-ponownie-przetestuj-rozwiazanie', 'Ponownie przetestuj rozwiązanie', null,
          null, '6.1. Wprowadź najważniejsze zmiany i ponownie udostępnij rozwiązanie użytkownikom
Zrealizuj prace programistyczne i konfiguracyjne zgodnie z przygotowanym planem poprawek. Wdróż wybrane modyfikacje w produkcie, dbając o zachowanie spójności całej ścieżki i nie naruszając funkcji, które wcześniej działały poprawnie.
Następnie ponownie udostępnij poprawioną wersję MVP użytkownikom:
W pierwszej kolejności przekaż zaktualizowaną wersję tym samym firmom, które zgłaszały wcześniejsze problemy, aby sprawdzić, czy zmiana odpowiada na ich potrzeby.
W razie potrzeby rozszerz grupę o kilka nowych podmiotów B2B w celu weryfikacji powtarzalności wyników.
Jako proof dołącz opis wprowadzonych zmian (Changelog / Wersja 1.1) oraz potwierdzenie udostępnienia zaktualizowanego środowiska grupie testowej.
6.2. Porównaj wyniki przed i po zmianach oraz powtórz proces walidacji
Przeprowadź ponowne pomiary i zbierz opinie od użytkowników korzystających ze zmienionej wersji produktu.
Zestaw bezpośrednio wyniki z obu rund badawczych:
Ilościowo: Czy wzrosła częstotliwość logowań, czas spędzany w aplikacji lub wskaźnik ukończenia kluczowej ścieżki? Czy spadła liczba zgłoszeń błędów?
Jakościowo: Czy użytkownicy potwierdzają, że wcześniej zgłoszone usterki i bariery zostały skutecznie usunięte?
Traktuj walidację jako powtarzalny, ciągły cykl ulepszeń (Cykl Kolba / Pętla Build-Measure-Learn). Po każdej rundzie zmian wracaj do pomiaru, analizy wniosków i podejmowania decyzji o kolejnych iteracjach.
Gdy wyniki drugiej rundy testów potwierdzą gotowość produktu B2B, a kluczowe bariery zostaną wyeliminowane, wybierz status „Wersja gotowa do pierwszego użycia / komercjalizacji” w systemie trackingowym Vairo. Zamknięcie etapu następuje zgodnie z ogólnymi wytycznymi platformy po spełnieniu warunków wymaganych dowodów.',
          '[]'::jsonb, null,
          null, 6)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'wprowadz-najwazniejsze-zmiany', 'Wprowadź najważniejsze zmiany',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Dostosuj MVP zgodnie z wynikami analizy. Wdróż zmiany wynikające z analizy feedbacku, koncentrując się na tych o największym wpływie na wartość dla użytkownika i zachowując spójność z resztą rozwiązania.', 'Dostosuj MVP zgodnie z wynikami analizy. Wdróż zmiany wynikające z analizy feedbacku, koncentrując się na tych o największym wpływie na wartość dla użytkownika i zachowując spójność z resztą rozwiązania. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-ponownie-przetestuj-rozwiazanie.wprowadz-najwazniejsze-zmiany.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'Ponownie udostępnij rozwiązanie użytkownikom',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź reakcję na zmienioną wersję. Przekaż zaktualizowane MVP tej samej lub podobnej grupie użytkowników i obserwuj, czy nowe rozwiązania faktycznie usuwają wcześniej zgłoszone problemy.', 'Sprawdź reakcję na zmienioną wersję. Przekaż zaktualizowane MVP tej samej lub podobnej grupie użytkowników i obserwuj, czy nowe rozwiązania faktycznie usuwają wcześniej zgłoszone problemy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-ponownie-przetestuj-rozwiazanie.ponownie-udostepnij-rozwiazanie-uzytkownikom.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'porownaj-wyniki-przed-i-po-zmianach', 'Porównaj wyniki przed i po zmianach',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Oceń wpływ wprowadzonych zmian. Zestaw wyniki testów sprzed i po poprawkach, zwracając uwagę zarówno na wskaźniki ilościowe, jak i jakościowe opinie użytkowników.', 'Oceń wpływ wprowadzonych zmian. Zestaw wyniki testów sprzed i po poprawkach, zwracając uwagę zarówno na wskaźniki ilościowe, jak i jakościowe opinie użytkowników. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-ponownie-przetestuj-rozwiazanie.porownaj-wyniki-przed-i-po-zmianach.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'powtorz-proces-walidacji', 'Powtórz proces walidacji',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Kontynuuj cykl testowania, feedbacku i ulepszania. Traktuj walidację MVP jako powtarzalny cykl, a nie jednorazowe działanie — po każdej rundzie testów wracaj do zbierania feedbacku i wprowadzania kolejnych ulepszeń.', 'Kontynuuj cykl testowania, feedbacku i ulepszania. Traktuj walidację MVP jako powtarzalny cykl, a nie jednorazowe działanie — po każdej rundzie testów wracaj do zbierania feedbacku i wprowadzania kolejnych ulepszeń. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2b-ponownie-przetestuj-rozwiazanie.powtorz-proces-walidacji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wprowadz-najwazniejsze-zmiany', 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'porownaj-wyniki-przed-i-po-zmianach', 'powtorz-proces-walidacji']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['b2b-zbuduj-minimalna-wersje-rozwiazania', 'b2b-rozpocznij-testowanie-z-uzytkownikami', 'b2b-zbierz-feedback', 'b2b-przeanalizuj-feedback', 'b2b-okresl-kierunek-dalszego-dzialania', 'b2b-ponownie-przetestuj-rozwiazanie']);

  -- ═══ kategoria: B2C ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2c', 'B2C', 'Warstwa dla produktów konsumenckich — udostępnienie, test, poprawki.',
          false, 5)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przetestuj pozyskiwanie użytkowników i konwersję
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje', 'Przetestuj pozyskiwanie użytkowników i konwersję', null,
          null, '1.1. Uruchom płatne kampanie akwizycyjne i zmierz wskaźnik konwersji oraz koszt pozyskania (CAC)
Otwórz przygotowane materiały marketingowe i założenia budżetowe dla pierwszej wersji produktu B2C. Wybierz podstawowe kanały dotarcia (np. reklamy w mediach społecznościowych lub wyszukiwarce) i uruchom kampanie płatne z niewielkim, kontrolowanym budżetem testowym. Celem nie jest jeszcze skalowanie sprzedaży, ale sprowadzenie na stronę lub do aplikacji pierwszej grupy realnych użytkowników z grupy docelowej i sprawdzenie, czy przygotowany przekaz generuje autentyczne zainteresowanie.
Podepnij istniejący Goal albo utwórz Goal typu „Wynik testu”. Może brzmieć: „Uruchomienie kampanii testowej na kwotę 500 zł, sprowadzenie pierwszych 1000 odwiedzających i zmierzenie konwersji”. Przypisz osobę odpowiedzialną za marketing lub wzrost (Growth), uzgodnij czas trwania próby oraz wskaż oczekiwany proof, czyli dowód wykonania. W tym podpunkcie dowodem powinien być raport z panelu reklamowego oraz z narzędzia analitycznego strony (np. Google Analytics, PostHog), zawierający wydatki, liczbę kliknięć, liczbę przejść do koszyka oraz finalnych zakupów.
Przeanalizuj uzyskane wskaźniki:
Wskaźnik konwersji (Conversion Rate): jaki procent unikalnych osób odwiedzających stronę sfinalizował zakup lub założył darmowe konto.
Koszt pozyskania klienta (CAC): podziel całkowitą kwotę wydaną na reklamy przez liczbę płacących klientów pozyskanych w tym okresie.
Osoba odpowiedzialna za Goal musi zadbać o to, aby Analityka prawidłowo zliczała zdarzenia zakupu (tzw. Pixel lub Conversion API). Zapisz wyliczone CAC oraz wskaźnik konwersji w opisie wyniku. Wykorzystaj zebrane dane jako punkt odniesienia do kolejnych prób optymalizacyjnych.
1.2. Znajdź i usuń wąskie gardła oraz zoptymalizuj kreacje i komunikaty
Gdy pierwsze dane spłyną z kampanii, przyjrzyj się całej drodze, jaką pokonuje użytkownik od zobaczenia reklamy do sfinalizowania zakupu. Rzadko się zdarza, aby pierwsza wersja lejka działała optymalnie. Użyj narzędzi do analityki produktowej oraz nagrań sesji (np. Hotjar, Clarity, PostHog), aby dokładnie zlokalizować momenty, w których użytkownicy masowo porzucają stronę lub rezygnują z zakupu.
Przeanalizuj wyznaczone punkty oporu (wąskie gardła):
Czy strona ładuje się wystarczająco szybko na urządzeniach mobilnych?
Czy nagłówek na landing page bezpośrednio nawiązuje do obietnicy z reklamy?
Czy formularz zamówienia lub rejestracji nie wymaga zbyt wielu niepotrzebnych pól?
Czy cennik i koszty dostawy/subskrypcji są proste i przejrzyste?
Na podstawie wniosków z analityki przygotuj hipotezy do testów A/B. Zmieniaj pojedyncze elementy: testuj odmienne nagłówki, inne grafiki lub wideo w reklamach, bardziej bezpośrednie przyciski wezwania do działania (CTA) czy zmodyfikowaną strukturę oferty. Nie wprowadzaj wszystkich zmian naraz, ponieważ nie będziesz wiedzieć, która modyfikacja przyniosła poprawę.
Wykonaj kolejną próbę kampanii z wybranymi wariantami. Do proof w karcie celu dołącz zestawienie wyników „przed i po” – pokazujące, jak zmiana komunikatów lub usunięcie przeszkody wpłynęły na spadek CAC oraz wzrost wskaźnika konwersji.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'uruchom-platne-kampanie-akwizycyjne', 'Uruchom płatne kampanie akwizycyjne',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wypuść przygotowane reklamy z małym budżetem, aby sprowadzić na stronę pierwszą grupę realnych użytkowników i sprawdzić, czy reklamy generują zainteresowanie.', 'Wypuść przygotowane reklamy z małym budżetem, aby sprowadzić na stronę pierwszą grupę realnych użytkowników i sprawdzić, czy reklamy generują zainteresowanie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.uruchom-platne-kampanie-akwizycyjne.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac', 'Zmierz wskaźnik konwersji i koszt pozyskania (CAC)',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, jaki procent odwiedzających dokonuje zakupu oraz ile średnio kosztuje pozyskanie jednego płacącego klienta.', 'Sprawdź, jaki procent odwiedzających dokonuje zakupu oraz ile średnio kosztuje pozyskanie jednego płacącego klienta. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'znajdz-i-usun-waskie-gardla', 'Znajdź i usuń wąskie gardła',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Przeanalizuj dane z analityki strony i nagrania sesji, aby znaleźć moment, w którym użytkownicy najczęściej rezygnują z zakupu.', 'Przeanalizuj dane z analityki strony i nagrania sesji, aby znaleźć moment, w którym użytkownicy najczęściej rezygnują z zakupu. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.znajdz-i-usun-waskie-gardla.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zoptymalizuj-kreacje-i-komunikaty', 'Zoptymalizuj kreacje i komunikaty',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Testuj różne nagłówki, teksty i grafiki reklamowe metodą A/B, aby znaleźć warianty, które skuteczniej prowadzą do sprzedaży przy niższym koszcie.', 'Testuj różne nagłówki, teksty i grafiki reklamowe metodą A/B, aby znaleźć warianty, które skuteczniej prowadzą do sprzedaży przy niższym koszcie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.zoptymalizuj-kreacje-i-komunikaty.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['uruchom-platne-kampanie-akwizycyjne', 'zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac', 'znajdz-i-usun-waskie-gardla', 'zoptymalizuj-kreacje-i-komunikaty']);

  -- ── punkt 2: Oceń zaangażowanie i utrzymanie użytkowników (Retention)
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention', 'Oceń zaangażowanie i utrzymanie użytkowników (Retention)', null,
          null, '2.1. Zmierz poziom powracalności do produktu (Retention) oraz przeanalizuj aktywność w programie poleceń
Pozyskanie klienta to dopiero początek drogi w modelu B2C. Równie ważne jest sprawdzanie, czy użytkownik faktycznie korzysta z zakupionego produktu lub aplikacji i czy wraca do niego po pierwszym kontakcie. Przygotuj i przeanalizuj wskaźniki powracalności (Retention Rate) po 1, 7 oraz 30 dniach od momentu zakupu lub rejestracji.
Zorganizuj śledzenie powracalności w panelu analitycznym:
Day 1 Retention: ilu użytkowników otwiera aplikację lub wraca na platformę następnego dnia?
Day 7 i Day 30 Retention: jaki odsetek klientów nadal aktywnie korzysta z usługi po tygodniu i po miesiącu?
Jeśli w produkcie zaplanowano mechanizm wirusowy lub program poleceń (Referral Program), sprawdź jego realne działanie. Zmierz, ilu użytkowników generuje i udostępnia swój unikalny link polecający oraz jaki procent zaproszonych osób z tego linku faktycznie zakłada konto lub dokonuje zakupu.
Podepnij Goal typu „Wynik testu” obejmujący analizę retencji i poleceń. W dowodzie wykonania (proof) wklej zestawienie kohort retencji z analityki oraz statystyki programu poleceń. Jeśli retencja drastycznie spada po pierwszym dniu, jest to sygnał, że sam proces onboarding-u (wprowadzenia do produktu) lub wartość początkowa wymagają poprawy.
2.2. Zidentyfikuj moment kluczowej wartości (Aha! Moment) oraz zbadaj powody rezygnacji (Churn)
Aby budować powracalność, musisz dokładnie wiedzieć, jaka czynność w produkcie daje użytkownikowi najszybsze poczucie korzyści. Jest to tzw. Moment Kluczowej Varości (lub Aha! Moment) – konkretna akcja, po wykonaniu której drastycznie rośnie szansa, że użytkownik zostanie z produktem na stałe.
Odebranie i analiza tych zachowań wymaga połączenia danych i rozmów:
Przeanalizuj dane zachowań klientów powracających (np. „użytkownicy, którzy dodali min. 3 znajomych lub stworzyli pierwszą playlistę w ciągu pierwszych 24h, mają o 80% wyższy Retention D30”).
Zidentyfikuj tę kluczową akcję i skonfiguruj onboarding tak, aby jak najszybciej doprowadzić do niej każdego nowego użytkownika.
Równolegle zbierz i przeanalizuj dane o rezygnacjach (Churn). Skontaktuj się bezpośrednio (e-mailowo, telefonicznie lub poprzez ankietę wyjściową – Exit Survey) z osobami, które anulowały subskrypcję, przestały otwierać aplikację lub poprosiły o zwrot środków. Zapytaj wprost, co było głównym powodem odejścia (np. brak czasu, zbyt wysoka cena, brak zrozumienia funkcji, błędy techniczne).
Zapisz zidentyfikowany Aha! Moment oraz listę najczęstszych przyczyn rezygnacji w podsumowaniu celu. Te informacje będą kluczowe dla zespołu produktowego i marketingowego do przeprowadzenia poprawek przed skalowaniem.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-poziom-powracalnosci-do-produktu', 'Zmierz poziom powracalności do produktu',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu, aby ocenić, czy produkt jest używany także po pierwszym kontakcie.', 'Sprawdź, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu, aby ocenić, czy produkt jest używany także po pierwszym kontakcie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zmierz-poziom-powracalnosci-do-produktu.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'przeanalizuj-aktywnosc-w-programie-polecen', 'Przeanalizuj aktywność w programie poleceń',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, ilu użytkowników udostępnia swój link polecający oraz ile nowych osób faktycznie trafia do produktu dzięki tym zaproszeniom.', 'Sprawdź, ilu użytkowników udostępnia swój link polecający oraz ile nowych osób faktycznie trafia do produktu dzięki tym zaproszeniom. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.przeanalizuj-aktywnosc-w-programie-polecen.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zidentyfikuj-moment-kluczowej-wartosci', 'Zidentyfikuj moment kluczowej wartości',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Określ konkretną akcję lub moment, po którym użytkownicy zaczynają regularnie korzystać z produktu i otrzymują z niego realną wartość.', 'Określ konkretną akcję lub moment, po którym użytkownicy zaczynają regularnie korzystać z produktu i otrzymują z niego realną wartość. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zidentyfikuj-moment-kluczowej-wartosci.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbadaj-powody-rezygnacji-churn', 'Zbadaj powody rezygnacji (Churn)',
          null, false,
          null, null, null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Porozmawiaj z osobami, które przestały korzystać z produktu lub poprosiły o zwrot pieniędzy, aby ustalić główne przyczyny ich odejścia.', 'Porozmawiaj z osobami, które przestały korzystać z produktu lub poprosiły o zwrot pieniędzy, aby ustalić główne przyczyny ich odejścia. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zbadaj-powody-rezygnacji-churn.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-poziom-powracalnosci-do-produktu', 'przeanalizuj-aktywnosc-w-programie-polecen', 'zidentyfikuj-moment-kluczowej-wartosci', 'zbadaj-powody-rezygnacji-churn']);

  -- ── punkt 3: Obsłuż zwroty, reklamacje i kwestie prawne
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne', 'Obsłuż zwroty, reklamacje i kwestie prawne', null,
          null, '3.1. Zmierz wskaźnik zwrotów oraz uruchom odzyskiwanie porzuconych koszyków
Przeanalizuj transakcje pod kątem zwrotów, reklamacji i niedokończonych zakupów. Szybkie reagowanie na sygnały niezadowolenia oraz wyłapywanie "porzuconych szans" pozwala zabezpieczyć przychody startupu.
Działania do wykonania w tym zakresie:
Obsługa i pomiar zwrotów: Prowadź stałą ewidencję prośb o zwrot pieniędzy. Policz wskaźnik zwrotów (Refund Rate) jako stosunek liczby zwrotów do całkowitej liczby transakcji. Każdą prośbę kategoryzuj wedle powodu (np. „produkt niezgodny z opisem”, „problem z płatnością”, „klient rozmyślił się”).
Odzyskiwanie porzuconych koszyków: Zbuduj i uruchom automatyczne sekwencje przypomnień (np. e-mail, SMS lub push) kierowane do osób, które podały dane kontaktowe lub rozpoczęły proces zakupu, ale nie sfinalizowały płatności. Sprawdź, czy maile wychodzą we właściwym czasie (np. po 1 godzinie, po 24 godzinach) i czy zawierają bezpośredni link do dokończenia transakcji.
Podepnij Goal typu „Wynik budowy” lub „Wynik testu”. Do dowodu (proof) dołącz zsumowany wskaźnik zwrotów wraz z listą powodów oraz zrzuty ekranu / raport z działającego systemu automatycznego odzyskiwania koszyków pokazujący odsetek odzyskanych sprzedaży.
3.2. Dopilnuj zgód prawnych i RODO
Zanim zwiększysz budżety reklamowe i zaczniesz zbierać dane na dużą skalę, upewnij się, że cała warstwa prawna i zbieranie danych osobowych w produkcie B2C są w pełni zgodne z przepisami (m.in. RODO/GDPR, dyrektywa Omnibus, prawo konsumenckie).
Sprawdź ze specjalistą lub na podstawie zweryfikowanych wzorców następujące obszary:
Zbieranie e-maili i zgody marketingowe: Czy checkboxy pod formularzami rejestracji i zapisu na newsletter są dobrowolne, niezaznaczone domyślnie i zawierają poprawną klauzulę informacyjną?
Analityka i pliki Cookies: Czy baner cookie (Cookiebot/CMP) blokuje ładowanie skryptów śledzących (np. Meta Pixel, Google Analytics) do momentu wyrażenia wyraźnej zgody przez użytkownika?
Regulamin i Polityka Prywatności: Czy regulamin sprzedaży/usługi jasno określa warunki świadczenia usług, prawo do odstąpienia od umowy w ciągu 14 dni, procedurę reklamacji oraz pełne dane rejestrowe firmy?
Do proof dołącz linki do opublikowanego Regulaminu, Polityki Prywatności oraz zrzut ekranu poprawnie skonfigurowanego baneru cookies ze sprawdzonym trybem uzyskiwania zgód.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zmierz-wskaznik-zwrotow', 'Zmierz wskaźnik zwrotów',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Policz, jaki procent klientów prosi o zwrot pieniędzy i zapisuj konkretne powody, aby wiedzieć, jakie problemy wymagają poprawy.', 'Policz, jaki procent klientów prosi o zwrot pieniędzy i zapisuj konkretne powody, aby wiedzieć, jakie problemy wymagają poprawy. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne.zmierz-wskaznik-zwrotow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'uruchom-odzyskiwanie-porzuconych-koszykow', 'Uruchom odzyskiwanie porzuconych koszyków',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Wysyłaj automatyczne przypomnienia osobom, które rozpoczęły proces zakupu lub podały e-mail, ale nie zakończyły płatności.', 'Wysyłaj automatyczne przypomnienia osobom, które rozpoczęły proces zakupu lub podały e-mail, ale nie zakończyły płatności. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne.uruchom-odzyskiwanie-porzuconych-koszykow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'dopilnuj-zgod-prawnych-i-rodo', 'Dopilnuj zgód prawnych i RODO',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Upewnij się, że zbieranie e-maili, analityka oraz regulamin sprzedaży są odpowiednio przygotowane i zgodne z obowiązującymi zasadami przed dalszym pozyskiwaniem klientów.', 'Upewnij się, że zbieranie e-maili, analityka oraz regulamin sprzedaży są odpowiednio przygotowane i zgodne z obowiązującymi zasadami przed dalszym pozyskiwaniem klientów. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne.dopilnuj-zgod-prawnych-i-rodo.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-wskaznik-zwrotow', 'uruchom-odzyskiwanie-porzuconych-koszykow', 'dopilnuj-zgod-prawnych-i-rodo']);

  -- ── punkt 4: Przeprowadź pogłębione wywiady z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami', 'Przeprowadź pogłębione wywiady z użytkownikami', null,
          null, '4.1. Porozmawiaj z płacącymi klientami oraz zbierz powody braku zakupu od niepłacących
Dane ilościowe z analityki pokazują co robią użytkownicy, ale tylko bezpośrednie rozmowy jakościowe wyjaśniają dlaczego tak się zachowują. Przeprowadź wywiady z dwiema różnymi grupami odbiorców:
Płacący klienci: Skontaktuj się z kilkoma osobami, które dokonały zakupu. Przeprowadź z nimi krótkie rozmowy (np. 15-20 min na Google Meet). Dowiedz się:
Z jakim głównym problemem lub potrzebą przyszli do Twojego produktu?
Co dokładnie w przekazie lub samym produkcie przekonało ich do wyciągnięcia karty i zapłaty?
Jakie inne rozwiązania rozważali wcześniej?
Odwiedzający bez zakupu: Skontaktuj się z osobami, które spędziły czas na stronie, zapisały się na wersję próbną lub opuściły koszyk, ale nie dokonały zakupu. Zapytaj nieoceniającym tonem:
Co sprawiło, że nie zdecydowali się na zakup w tym momencie?
Jakie obawy, wątpliwości lub bariery powstrzymały ich na ostatniej prostej (np. niejasna oferta, zbyt wysoka cena, brak zaufania)?
Zapisz kluczowe cytaty, wnioski i powtarzające się wzorce z tych rozmów w osobnym dokumencie Vairo lub notatce.
4.2. Pozyskaj opinie i dowody społeczne (Social Proof)
Zaufanie jest kluczowym czynnikiem wpływającym na konwersję w segmencie B2C. Pierwsze pozytywne doświadczenia i opinie realnych klientów są najskuteczniejszym narzędziem przełamywania obaw kolejnych odwiedzających.
Działania do wykonania:
Wystąp do pierwszych zadowolonych, płacących użytkowników z prośbą o krótką opinię, ocenę w skali gwiazdkowej lub wypowiedź (testimonial).
Uzyskaj od nich formalną zgodę na wykorzystanie wizerunku/imienia/nazwy profilu oraz ich wypowiedzi w materiałach marketingowych.
Wdrożyj uzyskane opinie, referencje lub widgety ocen bezpośrednio na landing page, w lejkach sprzedażowych oraz w e-mailach odzyskujących koszyki.
Do dowodu (proof) w karcie celu podepnij odnośnik do strony zawierającej zaktualizowany sekcje z dowodami społecznymi (Social Proof) oraz podsumowanie uzyskanych referencji.',
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
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'porozmawiaj-z-placacymi-klientami', 'Porozmawiaj z płacącymi klientami',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Przeprowadź rozmowy z osobami, które kupiły produkt, i dowiedz się, jaki problem chcieli rozwiązać oraz co przekonało ich do zapłaty.', 'Przeprowadź rozmowy z osobami, które kupiły produkt, i dowiedz się, jaki problem chcieli rozwiązać oraz co przekonało ich do zapłaty. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami.porozmawiaj-z-placacymi-klientami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zbierz-powody-braku-zakupu', 'Zbierz powody braku zakupu',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Porozmawiaj z osobami, które odwiedziły stronę, ale nie kupiły produktu, aby poznać ich główne wątpliwości i bariery zakupowe.', 'Porozmawiaj z osobami, które odwiedziły stronę, ale nie kupiły produktu, aby poznać ich główne wątpliwości i bariery zakupowe. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami.zbierz-powody-braku-zakupu.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'research', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['research']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'pozyskaj-opinie-i-dowody-spoleczne', 'Pozyskaj opinie i dowody społeczne',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Zbieraj opinie od pierwszych zadowolonych użytkowników i za ich zgodą wykorzystuj je jako referencje lub social proof na stronie.', 'Zbieraj opinie od pierwszych zadowolonych użytkowników i za ich zgodą wykorzystuj je jako referencje lub social proof na stronie. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami.pozyskaj-opinie-i-dowody-spoleczne.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'build_result', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['build_result']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['porozmawiaj-z-placacymi-klientami', 'zbierz-powody-braku-zakupu', 'pozyskaj-opinie-i-dowody-spoleczne']);

  -- ── punkt 5: Potwierdź opłacalność biznesu i wyznacz kolejny krok
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok', 'Potwierdź opłacalność biznesu i wyznacz kolejny krok', null,
          null, '5.1. Zestaw koszt pozyskania (CAC) z wartością klienta (LTV), osiągnij cel MVP i podejmij decyzję (Scale or Pivot)
To jest moment podsumowania całego etapu Execution dla B2C. Na podstawie wszystkich zgromadzonych dowodów, pomiarów i wywiadów musisz ocenić biznesowy potencjał produktu i podjąć decyzję o dalszych krokach startupu.
Kluczowe kroki oceny:
Zestawienie CAC z LTV: Porównaj średni koszt pozyskania klienta (CAC z punktu 1.1) z przewidywaną lub rzeczywistą życiową wartością klienta (LTV – Lifetime Value). W modelach subskrypcyjnych LTV szacuje się na podstawie średniej długości utrzymania klienta i miesięcznej opłaty. Zrównoważony model B2C zazwyczaj wymaga, aby LTV było co najmniej 3-krotnie wyższe od CAC ($LTV \ge 3 \times CAC$).
Walidacja założenia ilościowego MVP: Sprawdź, czy startup zdobył ustaloną na początku etapu walidacji liczbę płacących klientów (np. pierwszych 50 lub 100 płacących użytkowników).
Decyzja strategiczna (Skalowanie vs Poprawa/Pivot):
Skalowanie: Jeśli $CAC$ jest bezpiecznie niski, retencja stabilna, a wskaźnik zwrotów i churn są pod kontrolą – podejmij decyzję o zwiększeniu budżetów reklamowych i skalowaniu kanałów akwizycji.
Poprawa / Pivot: Jeśli pozyskanie klienta jest zbyt drogie ($CAC > LTV$), klienci masowo rezygnują po kilku dniach, a wskaźnik zwrotów jest wysoki – wstrzymaj zwiększanie budżetów reklamowych. Skup się na poprawie wartości produktu, przebudowie oferty lub zmianie grupy docelowej.
Wskaż podjętą decyzję oraz podepnij wszystkie dowody (proofs) z podpunktów 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1 i 4.2. Jeśli warunki walidacji zostały spełnione i biznes wykazuje potencjał opłacalności, wybierz opcję potwierdzającą „Wersja gotowa do pierwszego użycia / skalowania” w systemie trackingowym.',
          '[]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv', 'Zestaw koszt pozyskania (CAC) z wartością klienta (LTV)',
          null, false,
          null, null, null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Porównaj koszt pozyskania klienta z wartością, jaką klient generuje w czasie, aby sprawdzić, czy model biznesowy może być opłacalny.', 'Porównaj koszt pozyskania klienta z wartością, jaką klient generuje w czasie, aby sprawdzić, czy model biznesowy może być opłacalny. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'osiagnij-zalozony-cel-ilosciowy-mvp', 'Osiągnij założony cel ilościowy MVP',
          null, false,
          null, null, null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'note', 'long_text',
          'Sprawdź, czy startup zdobył wcześniej ustaloną liczbę płacących klientów potrzebną do walidacji produktu i modelu biznesowego.', 'Sprawdź, czy startup zdobył wcześniej ustaloną liczbę płacących klientów potrzebną do walidacji produktu i modelu biznesowego. Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu.', null,
          true, 'mvp.b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.osiagnij-zalozony-cel-ilosciowy-mvp.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'product_test', 1,
          null, 'completed', false, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['product_test']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'podejmij-decyzje-o-skalowaniu-lub-zmianie', 'Podejmij decyzję o skalowaniu lub zmianie',
          null, false,
          null, null, null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'decision', 'select',
          'Na podstawie wyników zdecyduj, czy zwiększyć budżet i skalować pozyskiwanie użytkowników, czy najpierw poprawić najważniejsze elementy produktu — co wybierasz?', 'Wybierz kierunek pracy. Żeby wstrzymać albo zarchiwizować startup, zakończ etap decyzją pauza lub archiwum — sama odpowiedź tego nie zrobi.', null,
          true, 'mvp.b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.podejmij-decyzje-o-skalowaniu-lub-zmianie.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['decision']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv', 'osiagnij-zalozony-cel-ilosciowy-mvp', 'podejmij-decyzje-o-skalowaniu-lub-zmianie']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['b2c-przetestuj-pozyskiwanie-uzytkownikow-i-konwersje', 'b2c-ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention', 'b2c-obsluz-zwroty-reklamacje-i-kwestie-prawne', 'b2c-przeprowadz-poglebione-wywiady-z-uzytkownikami', 'b2c-potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general', 'saas', 'hardware', 'b2b', 'b2c']);

end;
$$;

-- Weryfikacja: policz, co wjechało
select
  (select count(*) from public.stage_points p
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'mvp') as punktow,
  (select count(*) from public.stage_subpoints s
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'mvp') as podpunktow,
  (select count(*) from public.stage_fields f
     join public.stage_subpoints s on s.id = f.subpoint_id
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'mvp') as pol;
