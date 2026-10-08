-- ============================================================================
-- 021 · Treść etapu: MVP Stage (v1)
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
  values (v_category, 'zbuduj-minimalna-wersje-rozwiazania', 'Zbuduj minimalną wersję rozwiązania', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Zbuduj wyłącznie funkcje potrzebne do sprawdzenia głównego założenia.', 'Zbuduj wyłącznie funkcje potrzebne do sprawdzenia głównego założenia.', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.zrealizuj-podstawowe-funkcje-mvp.note',
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
          'Spraw, by użytkownik mógł wykonać główne działanie w rozwiązaniu.', 'Spraw, by użytkownik mógł wykonać główne działanie w rozwiązaniu.', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.polacz-kluczowe-elementy-rozwiazania.note',
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
          'Doprowadź MVP do stanu gotowego do użycia przez pierwszych odbiorców.', 'Doprowadź MVP do stanu gotowego do użycia przez pierwszych odbiorców.', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.przygotuj-mvp-do-testowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-podstawowe-funkcje-mvp', 'polacz-kluczowe-elementy-rozwiazania', 'przygotuj-mvp-do-testowania']);

  -- ── punkt 2: Rozpocznij testowanie z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'rozpocznij-testowanie-z-uzytkownikami', 'Rozpocznij testowanie z użytkownikami', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Wybierz osoby najlepiej pasujące do testowania rozwiązania.', 'Wybierz osoby najlepiej pasujące do testowania rozwiązania.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.okresl-grupe-badawcza.note',
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
          'Wyznacz, jak długo potrwają testy MVP.', 'Wyznacz, jak długo potrwają testy MVP.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.ustal-okres-badania.note',
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
          'Daj wybranej grupie dostęp do MVP.', 'Daj wybranej grupie dostęp do MVP.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.udostepnij-mvp-uzytkownikom.note',
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
          'Śledź, jak użytkownicy korzystają z produktu i jakie mają problemy.', 'Śledź, jak użytkownicy korzystają z produktu i jakie mają problemy.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.obserwuj-reakcje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['okresl-grupe-badawcza', 'ustal-okres-badania', 'udostepnij-mvp-uzytkownikom', 'obserwuj-reakcje-uzytkownikow']);

  -- ── punkt 3: Zbierz feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zbierz-feedback', 'Zbierz feedback', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Zapytaj użytkowników wprost o ich doświadczenia z MVP.', 'Zapytaj użytkowników wprost o ich doświadczenia z MVP.', null,
          true, 'mvp.zbierz-feedback.zbieraj-opinie-uzytkownikow.note',
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
          'Skonsultuj rozwiązanie ze specjalistami i doświadczonymi osobami.', 'Skonsultuj rozwiązanie ze specjalistami i doświadczonymi osobami.', null,
          true, 'mvp.zbierz-feedback.konsultuj-rozwiazanie-z-ekspertami.note',
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
          'Zapisuj usterki, trudności i niejasne elementy.', 'Zapisuj usterki, trudności i niejasne elementy.', null,
          true, 'mvp.zbierz-feedback.zbieraj-informacje-o-problemach.note',
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
          'Notuj propozycje użytkowników dotyczące funkcji głównych i dodatkowych.', 'Notuj propozycje użytkowników dotyczące funkcji głównych i dodatkowych.', null,
          true, 'mvp.zbierz-feedback.zbieraj-oczekiwania-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zbieraj-opinie-uzytkownikow', 'konsultuj-rozwiazanie-z-ekspertami', 'zbieraj-informacje-o-problemach', 'zbieraj-oczekiwania-uzytkownikow']);

  -- ── punkt 4: Przeanalizuj feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przeanalizuj-feedback', 'Przeanalizuj feedback', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Sprawdź, jak bardzo użytkownicy są zadowoleni z rozwiązania.', 'Sprawdź, jak bardzo użytkownicy są zadowoleni z rozwiązania.', null,
          true, 'mvp.przeanalizuj-feedback.ocen-poziom-zadowolenia.note',
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
          'Znajdź najczęściej powtarzające się usterki i bariery.', 'Znajdź najczęściej powtarzające się usterki i bariery.', null,
          true, 'mvp.przeanalizuj-feedback.przeanalizuj-zglaszane-problemy.note',
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
          'Sprawdź, których funkcji użytkownicy naprawdę potrzebują.', 'Sprawdź, których funkcji użytkownicy naprawdę potrzebują.', null,
          true, 'mvp.przeanalizuj-feedback.przeanalizuj-potrzeby-dotyczace-funkcji.note',
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
          'Ustal, co wymaga zmiany, a co dalszego sprawdzenia.', 'Ustal, co wymaga zmiany, a co dalszego sprawdzenia.', null,
          true, 'mvp.przeanalizuj-feedback.wyciagnij-najwazniejsze-wnioski.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ocen-poziom-zadowolenia', 'przeanalizuj-zglaszane-problemy', 'przeanalizuj-potrzeby-dotyczace-funkcji', 'wyciagnij-najwazniejsze-wnioski']);

  -- ── punkt 5: Opracuj kierunek dalszego rozwoju
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'opracuj-kierunek-dalszego-rozwoju', 'Opracuj kierunek dalszego rozwoju', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Wybierz zmiany o największym wpływie na wartość produktu.', 'Wybierz zmiany o największym wpływie na wartość produktu.', null,
          true, 'mvp.opracuj-kierunek-dalszego-rozwoju.ustal-najwazniejsze-poprawki.note',
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
          'Zaplanuj, jak dostosować MVP do zebranego feedbacku.', 'Zaplanuj, jak dostosować MVP do zebranego feedbacku.', null,
          true, 'mvp.opracuj-kierunek-dalszego-rozwoju.zaplanuj-ulepszenie-mvp.note',
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
          true, 'mvp.opracuj-kierunek-dalszego-rozwoju.rozwaz-zmiane-zalozen.note',
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
          true, 'mvp.opracuj-kierunek-dalszego-rozwoju.okresl-kolejny-kierunek-dzialania.note',
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
  values (v_category, 'ponownie-skonsultuj-rozwiazanie', 'Ponownie skonsultuj rozwiązanie', null,
          null, 'Ogólna walidacja MVP polega na zbudowaniu minimalnej wersji rozwiązania: zrealizowaniu tylko funkcji niezbędnych do realizacji głównego założenia, połączeniu kluczowych elementów tak, aby użytkownik mógł wykonać główne działanie, oraz przygotowaniu MVP do stanu umożliwiającego jego użycie przez pierwszych odbiorców. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — określenie grupy badawczej odpowiedniej do testowania rozwiązania, ustalenie okresu badania, udostępnienie MVP wybranej grupie oraz obserwowanie, jak korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o doświadczeniach z MVP, konsultowanie rozwiązania ze specjalistami i innymi doświadczonymi osobami, rejestrowanie usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeanalizowaniu zgłaszanych problemów w celu znalezienia najczęściej powtarzających się usterek i barier, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co wymaga zmiany, a co dalszego sprawdzenia. Na podstawie tych wniosków opracowywany jest kierunek dalszego rozwoju: ustalenie najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ulepszenia MVP zgodnie z feedbackiem, rozważenie częściowej lub całkowitej zmiany pomysłu oraz określenie kolejnego kierunku działania. Na koniec rozwiązanie jest ponownie konsultowane: wprowadzenie najważniejszych zmian do MVP, ponowne udostępnienie go użytkownikom, porównanie reakcji sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i ulepszania — jako cyklu walidacji.',
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
          'Wprowadź do MVP zmiany wynikające z analizy.', 'Wprowadź do MVP zmiany wynikające z analizy.', null,
          true, 'mvp.ponownie-skonsultuj-rozwiazanie.wprowadz-najwazniejsze-zmiany.note',
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
          'Udostępnij zmienioną wersję i sprawdź reakcję użytkowników.', 'Udostępnij zmienioną wersję i sprawdź reakcję użytkowników.', null,
          true, 'mvp.ponownie-skonsultuj-rozwiazanie.ponownie-udostepnij-rozwiazanie-uzytkownikom.note',
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
          'Sprawdź, czy zmiany poprawiły odbiór rozwiązania.', 'Sprawdź, czy zmiany poprawiły odbiór rozwiązania.', null,
          true, 'mvp.ponownie-skonsultuj-rozwiazanie.porownaj-reakcje-przed-i-po-zmianach.note',
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
          'Powtarzaj cykl testowania, feedbacku i ulepszania.', 'Powtarzaj cykl testowania, feedbacku i ulepszania.', null,
          true, 'mvp.ponownie-skonsultuj-rozwiazanie.powtorz-proces-walidacji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wprowadz-najwazniejsze-zmiany', 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'porownaj-reakcje-przed-i-po-zmianach', 'powtorz-proces-walidacji']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['zbuduj-minimalna-wersje-rozwiazania', 'rozpocznij-testowanie-z-uzytkownikami', 'zbierz-feedback', 'przeanalizuj-feedback', 'opracuj-kierunek-dalszego-rozwoju', 'ponownie-skonsultuj-rozwiazanie']);

  -- ═══ kategoria: SaaS ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'saas', 'SaaS', 'Dodatkowe punkty, gdy budujesz oprogramowanie jako usługę.',
          false, 2)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Uruchom pierwszą wersję SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'uruchom-pierwsza-wersje-saas', 'Uruchom pierwszą wersję SaaS', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Zbuduj tylko funkcje potrzebne do sprawdzenia głównej wartości produktu.', 'Zbuduj tylko funkcje potrzebne do sprawdzenia głównej wartości produktu.', null,
          true, 'mvp.uruchom-pierwsza-wersje-saas.zrealizuj-zakres-mvp.note',
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
          'Spraw, by użytkownik mógł przejść całą podstawową ścieżkę w aplikacji.', 'Spraw, by użytkownik mógł przejść całą podstawową ścieżkę w aplikacji.', null,
          true, 'mvp.uruchom-pierwsza-wersje-saas.polacz-kluczowe-elementy-saas.note',
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
          'Uruchom produkt na prawdziwej infrastrukturze, dostępnej dla realnych użytkowników.', 'Uruchom produkt na prawdziwej infrastrukturze, dostępnej dla realnych użytkowników.', null,
          true, 'mvp.uruchom-pierwsza-wersje-saas.udostepnij-saas-w-srodowisku-produkcyjnym.note',
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
          'Upewnij się, że integracje z innymi systemami działają poprawnie w praktyce.', 'Upewnij się, że integracje z innymi systemami działają poprawnie w praktyce.', null,
          true, 'mvp.uruchom-pierwsza-wersje-saas.sprawdz-dzialanie-kluczowych-integracji.note',
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
          'Upewnij się, że płatność, zmiana planu i anulowanie subskrypcji działają bez problemów.', 'Upewnij się, że płatność, zmiana planu i anulowanie subskrypcji działają bez problemów.', null,
          true, 'mvp.uruchom-pierwsza-wersje-saas.sprawdz-dzialanie-platnosci-i-subskrypcji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-zakres-mvp', 'polacz-kluczowe-elementy-saas', 'udostepnij-saas-w-srodowisku-produkcyjnym', 'sprawdz-dzialanie-kluczowych-integracji', 'sprawdz-dzialanie-platnosci-i-subskrypcji']);

  -- ── punkt 2: Przetestuj SaaS z rzeczywistymi użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przetestuj-saas-z-rzeczywistymi-uzytkownikami', 'Przetestuj SaaS z rzeczywistymi użytkownikami', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Daj dostęp do SaaS wybranej grupie testowych użytkowników.', 'Daj dostęp do SaaS wybranej grupie testowych użytkowników.', null,
          true, 'mvp.przetestuj-saas-z-rzeczywistymi-uzytkownikami.udostepnij-produkt-pierwszym-uzytkownikom.note',
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
          'Sprawdź, czy nowi użytkownicy sami poradzą sobie z rozpoczęciem korzystania z produktu.', 'Sprawdź, czy nowi użytkownicy sami poradzą sobie z rozpoczęciem korzystania z produktu.', null,
          true, 'mvp.przetestuj-saas-z-rzeczywistymi-uzytkownikami.przeprowadz-onboarding-uzytkownikow.note',
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
          'Śledź, jak użytkownicy faktycznie korzystają z produktu.', 'Śledź, jak użytkownicy faktycznie korzystają z produktu.', null,
          true, 'mvp.przetestuj-saas-z-rzeczywistymi-uzytkownikami.obserwuj-zachowania-uzytkownikow.note',
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
          'Zapisuj napotkane błędy i trudności użytkowników.', 'Zapisuj napotkane błędy i trudności użytkowników.', null,
          true, 'mvp.przetestuj-saas-z-rzeczywistymi-uzytkownikami.rejestruj-problemy-podczas-uzytkowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['udostepnij-produkt-pierwszym-uzytkownikom', 'przeprowadz-onboarding-uzytkownikow', 'obserwuj-zachowania-uzytkownikow', 'rejestruj-problemy-podczas-uzytkowania']);

  -- ── punkt 3: Zmierz wykorzystanie SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zmierz-wykorzystanie-saas', 'Zmierz wykorzystanie SaaS', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Sprawdź, ilu użytkowników dociera do pierwszego momentu wartości.', 'Sprawdź, ilu użytkowników dociera do pierwszego momentu wartości.', null,
          true, 'mvp.zmierz-wykorzystanie-saas.zmierz-aktywacje-uzytkownikow.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Sprawdź, które funkcje są rzeczywiście używane.', 'Sprawdź, które funkcje są rzeczywiście używane.', null,
          true, 'mvp.zmierz-wykorzystanie-saas.zmierz-wykorzystanie-kluczowych-funkcji.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Sprawdź, jak często użytkownicy wracają do produktu.', 'Sprawdź, jak często użytkownicy wracają do produktu.', null,
          true, 'mvp.zmierz-wykorzystanie-saas.zmierz-czestotliwosc-korzystania.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Sprawdź, ilu użytkowników pozostaje aktywnych po pewnym czasie.', 'Sprawdź, ilu użytkowników pozostaje aktywnych po pewnym czasie.', null,
          true, 'mvp.zmierz-wykorzystanie-saas.zmierz-retencje-uzytkownikow.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Zestaw rzeczywiste dane z wcześniej ustalonymi celami.', 'Zestaw rzeczywiste dane z wcześniej ustalonymi celami.', null,
          true, 'mvp.zmierz-wykorzystanie-saas.porownaj-wyniki-z-zalozeniami.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-aktywacje-uzytkownikow', 'zmierz-wykorzystanie-kluczowych-funkcji', 'zmierz-czestotliwosc-korzystania', 'zmierz-retencje-uzytkownikow', 'porownaj-wyniki-z-zalozeniami']);

  -- ── punkt 4: Zweryfikuj wartość SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zweryfikuj-wartosc-saas', 'Zweryfikuj wartość SaaS', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Oceń, czy produkt realnie daje użytkownikom zakładaną wartość.', 'Oceń, czy produkt realnie daje użytkownikom zakładaną wartość.', null,
          true, 'mvp.zweryfikuj-wartosc-saas.sprawdz-osiaganie-glownego-rezultatu.note',
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
          'Zapytaj użytkowników, czy produkt jest dla nich przydatny.', 'Zapytaj użytkowników, czy produkt jest dla nich przydatny.', null,
          true, 'mvp.zweryfikuj-wartosc-saas.zbierz-feedback-uzytkownikow.note',
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
          'Znajdź, co przeszkadza użytkownikom w osiągnięciu wartości.', 'Znajdź, co przeszkadza użytkownikom w osiągnięciu wartości.', null,
          true, 'mvp.zweryfikuj-wartosc-saas.zidentyfikuj-bariery-uzytkowania.note',
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
          'Sprawdź, czy użytkownicy mają powód wracać do produktu regularnie.', 'Sprawdź, czy użytkownicy mają powód wracać do produktu regularnie.', null,
          true, 'mvp.zweryfikuj-wartosc-saas.ocen-powtarzalnosc-wartosci.note',
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
          'Wybierz problemy, które najbardziej wpływają na wartość produktu.', 'Wybierz problemy, które najbardziej wpływają na wartość produktu.', null,
          true, 'mvp.zweryfikuj-wartosc-saas.okresl-najwazniejsze-problemy.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-osiaganie-glownego-rezultatu', 'zbierz-feedback-uzytkownikow', 'zidentyfikuj-bariery-uzytkowania', 'ocen-powtarzalnosc-wartosci', 'okresl-najwazniejsze-problemy']);

  -- ── punkt 5: Zweryfikuj model subskrypcyjny
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zweryfikuj-model-subskrypcyjny', 'Zweryfikuj model subskrypcyjny', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Sprawdź, ilu użytkowników przechodzi na płatną wersję.', 'Sprawdź, ilu użytkowników przechodzi na płatną wersję.', null,
          true, 'mvp.zweryfikuj-model-subskrypcyjny.sprawdz-konwersje-na-platne-plany.note',
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
          'Sprawdź, czy płacący użytkownicy odnawiają subskrypcję.', 'Sprawdź, czy płacący użytkownicy odnawiają subskrypcję.', null,
          true, 'mvp.zweryfikuj-model-subskrypcyjny.monitoruj-odnowienia-subskrypcji.note',
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
          'Sprawdź, ile osób rezygnuje i dlaczego.', 'Sprawdź, ile osób rezygnuje i dlaczego.', null,
          true, 'mvp.zweryfikuj-model-subskrypcyjny.monitoruj-anulowania-subskrypcji.note',
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
          'Oblicz, jaki procent klientów rezygnuje z subskrypcji.', 'Oblicz, jaki procent klientów rezygnuje z subskrypcji.', null,
          true, 'mvp.zweryfikuj-model-subskrypcyjny.zmierz-churn.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Sprawdź, czy model subskrypcyjny się opłaca.', 'Sprawdź, czy model subskrypcyjny się opłaca.', null,
          true, 'mvp.zweryfikuj-model-subskrypcyjny.porownaj-przychody-z-kosztami-obslugi.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-konwersje-na-platne-plany', 'monitoruj-odnowienia-subskrypcji', 'monitoruj-anulowania-subskrypcji', 'zmierz-churn', 'porownaj-przychody-z-kosztami-obslugi']);

  -- ── punkt 6: Ulepsz lub zmień kierunek SaaS
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'ulepsz-lub-zmien-kierunek-saas', 'Ulepsz lub zmień kierunek SaaS', null,
          null, 'Etap MVP dla SaaS polega na uruchomieniu pierwszej wersji produktu: zrealizowaniu zakresu MVP obejmującego tylko funkcje niezbędne do sprawdzenia głównej wartości, połączeniu ich w działającą podstawową ścieżkę użytkownika, udostępnieniu SaaS w środowisku produkcyjnym oraz sprawdzeniu działania kluczowych integracji, a także procesu płatności i subskrypcji. Kolejnym krokiem jest przetestowanie SaaS z rzeczywistymi użytkownikami — udostępnienie produktu pierwszej grupie użytkowników, przeprowadzenie onboardingu sprawdzającego, czy potrafią samodzielnie rozpocząć korzystanie z produktu, obserwowanie ich zachowań oraz rejestrowanie napotykanych błędów i trudności. Następnie mierzone jest wykorzystanie SaaS: aktywacja użytkowników, czyli odsetek osiągających pierwszy moment wartości, wykorzystanie kluczowych funkcji, częstotliwość korzystania z produktu, retencja użytkowników oraz porównanie uzyskanych wyników z wcześniejszymi założeniami. Kolejnym etapem jest weryfikacja wartości SaaS — sprawdzenie, czy produkt dostarcza zakładany główny rezultat, zebranie feedbacku dotyczącego użyteczności i wartości, zidentyfikowanie barier utrudniających osiągnięcie wartości, ocena, czy wartość ta jest powtarzalna, oraz określenie najważniejszych problemów wymagających uwagi. Weryfikowany jest także model subskrypcyjny: sprawdzenie konwersji na płatne plany, monitorowanie odnowień i anulowań subskrypcji, pomiar wskaźnika churn oraz porównanie przychodów z kosztami obsługi w celu oceny podstawowej opłacalności modelu. Na koniec następuje ulepszenie lub zmiana kierunku SaaS: ustalenie priorytetów zmian, wprowadzenie najważniejszych poprawek na podstawie danych i feedbacku, ponowne przetestowanie zmienionych elementów, ocena potrzeby głębszej zmiany kierunku oraz określenie kolejnej iteracji rozwoju produktu.',
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
          'Wybierz problemy o największym wpływie na wartość produktu.', 'Wybierz problemy o największym wpływie na wartość produktu.', null,
          true, 'mvp.ulepsz-lub-zmien-kierunek-saas.ustal-priorytety-zmian.note',
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
          'Zmień produkt zgodnie z danymi i feedbackiem.', 'Zmień produkt zgodnie z danymi i feedbackiem.', null,
          true, 'mvp.ulepsz-lub-zmien-kierunek-saas.wprowadz-najwazniejsze-poprawki.note',
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
          'Sprawdź, czy wprowadzone zmiany przyniosły efekt.', 'Sprawdź, czy wprowadzone zmiany przyniosły efekt.', null,
          true, 'mvp.ulepsz-lub-zmien-kierunek-saas.ponownie-przetestuj-zmienione-elementy.note',
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
          'Oceń potrzebę zmiany kierunku — co wybierasz?', 'Zdecyduj, czy potrzebna jest głębsza zmiana produktu lub modelu.', null,
          true, 'mvp.ulepsz-lub-zmien-kierunek-saas.ocen-potrzebe-zmiany-kierunku.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"},{"value":"stop","label":"Wstrzymuję projekt"}]}'::jsonb, 1)
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
          true, 'mvp.ulepsz-lub-zmien-kierunek-saas.okresl-kolejna-iteracje.note',
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
  where category_id = v_category and key <> all(array['uruchom-pierwsza-wersje-saas', 'przetestuj-saas-z-rzeczywistymi-uzytkownikami', 'zmierz-wykorzystanie-saas', 'zweryfikuj-wartosc-saas', 'zweryfikuj-model-subskrypcyjny', 'ulepsz-lub-zmien-kierunek-saas']);

  -- ═══ kategoria: Hardware ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'hardware', 'Hardware', 'Dodatkowe punkty dla urządzenia i łańcucha dostaw.',
          false, 3)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zrealizuj pierwszą wysyłkę i przetestuj logistykę
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke', 'Zrealizuj pierwszą wysyłkę i przetestuj logistykę', null,
          null, 'Etap MVP dla hardware startupu zaczyna się od wysłania pierwszej małej serii produktu, obejmującej 50–100 sztuk, do pierwszych klientów lub testerów. Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.

Najpierw należy sprawdzić logistykę. Trzeba kontrolować stan przesyłek i jakość pakowania, aby upewnić się, że urządzenia przechodzą transport bez uszkodzeń. Warto również zmierzyć, ile czasu zajmuje użytkownikowi rozpakowanie i pierwsze uruchomienie sprzętu. Dzięki temu można wykryć problemy, które mogą prowadzić do frustracji lub zwrotów. Równocześnie należy obserwować obsługę klienta: liczbę pytań technicznych, liczbę zgłoszeń oraz czas potrzebny na udzielenie pomocy.

Następnie należy zbadać awaryjność i satysfakcję z użytkowania. Startup powinien policzyć, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach. Ważne jest również przeprowadzenie rozmów z użytkownikami na temat baterii, obudowy, przycisków, łączności i innych problemów. Poziom satysfakcji można dodatkowo sprawdzić za pomocą NPS. Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.

Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej. Startup powinien mieć jasną procedurę zwrotu i wymiany wadliwych urządzeń oraz odpowiedni zapas produktów do wymiany. Każde uszkodzone urządzenie powinno być analizowane, aby ustalić bezpośrednią przyczynę awarii. Powtarzające się pytania i problemy należy zapisywać w bazie wiedzy i zamieniać w FAQ, instrukcje lub materiały wideo.

Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii. Przy większym wolumenie warto renegocjować ceny z fabryką i obniżyć koszt jednostkowy. Jednocześnie należy zamknąć listę poprawek w projekcie, wprowadzając ostatnie konieczne zmiany w obudowie, elektronice lub innych elementach.

Na końcu startup musi potwierdzić, że produkt jest ekonomicznie opłacalny i że istnieje wystarczający popyt na większą serię. Należy policzyć rzeczywisty koszt jednostkowy, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównać go z ceną sprzedaży. Kolejnym krokiem jest zdobycie konkretnych zamówień, przedsprzedaży lub deklaracji od dystrybutorów. Na podstawie marży, jakości produktu i potwierdzonego popytu należy podjąć decyzję o uruchomieniu produkcji masowej albo wstrzymaniu projektu, jeśli wyniki są niewystarczające.',
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
          'Przekaż wyprodukowane 50–100 sztuk pierwszym klientom lub testerom i sprawdź cały proces od przygotowania zamówienia do dostarczenia produktu.', 'Przekaż wyprodukowane 50–100 sztuk pierwszym klientom lub testerom i sprawdź cały proces od przygotowania zamówienia do dostarczenia produktu.', null,
          true, 'mvp.zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.wyslij-pierwsza-serie-produktow-pvt.note',
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
          'Sprawdź, czy opakowania dobrze chronią urządzenia podczas transportu oraz czy produkty docierają do odbiorców bez uszkodzeń.', 'Sprawdź, czy opakowania dobrze chronią urządzenia podczas transportu oraz czy produkty docierają do odbiorców bez uszkodzeń.', null,
          true, 'mvp.zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.skontroluj-stan-przesylek-i-pakowanie.note',
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
          'Sprawdź, ile czasu użytkownik potrzebuje na rozpakowanie, podłączenie i uruchomienie urządzenia, aby wykryć elementy powodujące frustrację lub zwroty.', 'Sprawdź, ile czasu użytkownik potrzebuje na rozpakowanie, podłączenie i uruchomienie urządzenia, aby wykryć elementy powodujące frustrację lub zwroty.', null,
          true, 'mvp.zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.zmierz-czas-unboxingu-i-pierwszego-uruchomienia.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Obserwuj liczbę pytań technicznych i zgłoszeń oraz czas potrzebny zespołowi na udzielenie użytkownikom pomocy.', 'Obserwuj liczbę pytań technicznych i zgłoszeń oraz czas potrzebny zespołowi na udzielenie użytkownikom pomocy.', null,
          true, 'mvp.zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke.zweryfikuj-wydajnosc-obslugi-klienta.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wyslij-pierwsza-serie-produktow-pvt', 'skontroluj-stan-przesylek-i-pakowanie', 'zmierz-czas-unboxingu-i-pierwszego-uruchomienia', 'zweryfikuj-wydajnosc-obslugi-klienta']);

  -- ── punkt 2: Zbadaj awaryjność i satysfakcję w użytkowaniu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu', 'Zbadaj awaryjność i satysfakcję w użytkowaniu', null,
          null, 'Etap MVP dla hardware startupu zaczyna się od wysłania pierwszej małej serii produktu, obejmującej 50–100 sztuk, do pierwszych klientów lub testerów. Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.

Najpierw należy sprawdzić logistykę. Trzeba kontrolować stan przesyłek i jakość pakowania, aby upewnić się, że urządzenia przechodzą transport bez uszkodzeń. Warto również zmierzyć, ile czasu zajmuje użytkownikowi rozpakowanie i pierwsze uruchomienie sprzętu. Dzięki temu można wykryć problemy, które mogą prowadzić do frustracji lub zwrotów. Równocześnie należy obserwować obsługę klienta: liczbę pytań technicznych, liczbę zgłoszeń oraz czas potrzebny na udzielenie pomocy.

Następnie należy zbadać awaryjność i satysfakcję z użytkowania. Startup powinien policzyć, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach. Ważne jest również przeprowadzenie rozmów z użytkownikami na temat baterii, obudowy, przycisków, łączności i innych problemów. Poziom satysfakcji można dodatkowo sprawdzić za pomocą NPS. Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.

Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej. Startup powinien mieć jasną procedurę zwrotu i wymiany wadliwych urządzeń oraz odpowiedni zapas produktów do wymiany. Każde uszkodzone urządzenie powinno być analizowane, aby ustalić bezpośrednią przyczynę awarii. Powtarzające się pytania i problemy należy zapisywać w bazie wiedzy i zamieniać w FAQ, instrukcje lub materiały wideo.

Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii. Przy większym wolumenie warto renegocjować ceny z fabryką i obniżyć koszt jednostkowy. Jednocześnie należy zamknąć listę poprawek w projekcie, wprowadzając ostatnie konieczne zmiany w obudowie, elektronice lub innych elementach.

Na końcu startup musi potwierdzić, że produkt jest ekonomicznie opłacalny i że istnieje wystarczający popyt na większą serię. Należy policzyć rzeczywisty koszt jednostkowy, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównać go z ceną sprzedaży. Kolejnym krokiem jest zdobycie konkretnych zamówień, przedsprzedaży lub deklaracji od dystrybutorów. Na podstawie marży, jakości produktu i potwierdzonego popytu należy podjąć decyzję o uruchomieniu produkcji masowej albo wstrzymaniu projektu, jeśli wyniki są niewystarczające.',
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
          'Policz, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach użytkowania.', 'Policz, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach użytkowania.', null,
          true, 'mvp.zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.oblicz-wskaznik-awaryjnosci-rma.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Zapytaj użytkowników o problemy z baterią, obudową, przyciskami, łącznością i innymi elementami urządzenia, aby znaleźć powtarzające się usterki.', 'Zapytaj użytkowników o problemy z baterią, obudową, przyciskami, łącznością i innymi elementami urządzenia, aby znaleźć powtarzające się usterki.', null,
          true, 'mvp.zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.przeprowadz-wywiady-usterkowe-z-uzytkownikami.note',
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
          'Zapytaj pierwszych użytkowników, jak prawdopodobne jest, że polecą urządzenie znajomym, i wykorzystaj odpowiedzi do oceny ich ogólnej satysfakcji.', 'Zapytaj pierwszych użytkowników, jak prawdopodobne jest, że polecą urządzenie znajomym, i wykorzystaj odpowiedzi do oceny ich ogólnej satysfakcji.', null,
          true, 'mvp.zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.zmierz-poziom-satysfakcji-nps.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Wypuść pierwszą zdalną aktualizację firmware''u, aby naprawić błędy wykryte podczas rzeczywistego użytkowania sprzętu.', 'Wypuść pierwszą zdalną aktualizację firmware''u, aby naprawić błędy wykryte podczas rzeczywistego użytkowania sprzętu.', null,
          true, 'mvp.zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu.zaktualizuj-oprogramowanie-ukladowe-firmware.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['oblicz-wskaznik-awaryjnosci-rma', 'przeprowadz-wywiady-usterkowe-z-uzytkownikami', 'zmierz-poziom-satysfakcji-nps', 'zaktualizuj-oprogramowanie-ukladowe-firmware']);

  -- ── punkt 3: Przygotuj proces reklamacji i obsługi posprzedażowej
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przygotuj-proces-reklamacji-i-obslugi-posprzedazowej', 'Przygotuj proces reklamacji i obsługi posprzedażowej', null,
          null, 'Etap MVP dla hardware startupu zaczyna się od wysłania pierwszej małej serii produktu, obejmującej 50–100 sztuk, do pierwszych klientów lub testerów. Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.

Najpierw należy sprawdzić logistykę. Trzeba kontrolować stan przesyłek i jakość pakowania, aby upewnić się, że urządzenia przechodzą transport bez uszkodzeń. Warto również zmierzyć, ile czasu zajmuje użytkownikowi rozpakowanie i pierwsze uruchomienie sprzętu. Dzięki temu można wykryć problemy, które mogą prowadzić do frustracji lub zwrotów. Równocześnie należy obserwować obsługę klienta: liczbę pytań technicznych, liczbę zgłoszeń oraz czas potrzebny na udzielenie pomocy.

Następnie należy zbadać awaryjność i satysfakcję z użytkowania. Startup powinien policzyć, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach. Ważne jest również przeprowadzenie rozmów z użytkownikami na temat baterii, obudowy, przycisków, łączności i innych problemów. Poziom satysfakcji można dodatkowo sprawdzić za pomocą NPS. Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.

Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej. Startup powinien mieć jasną procedurę zwrotu i wymiany wadliwych urządzeń oraz odpowiedni zapas produktów do wymiany. Każde uszkodzone urządzenie powinno być analizowane, aby ustalić bezpośrednią przyczynę awarii. Powtarzające się pytania i problemy należy zapisywać w bazie wiedzy i zamieniać w FAQ, instrukcje lub materiały wideo.

Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii. Przy większym wolumenie warto renegocjować ceny z fabryką i obniżyć koszt jednostkowy. Jednocześnie należy zamknąć listę poprawek w projekcie, wprowadzając ostatnie konieczne zmiany w obudowie, elektronice lub innych elementach.

Na końcu startup musi potwierdzić, że produkt jest ekonomicznie opłacalny i że istnieje wystarczający popyt na większą serię. Należy policzyć rzeczywisty koszt jednostkowy, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównać go z ceną sprzedaży. Kolejnym krokiem jest zdobycie konkretnych zamówień, przedsprzedaży lub deklaracji od dystrybutorów. Na podstawie marży, jakości produktu i potwierdzonego popytu należy podjąć decyzję o uruchomieniu produkcji masowej albo wstrzymaniu projektu, jeśli wyniki są niewystarczające.',
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
          'Określ prosty sposób zgłaszania i zwracania uszkodzonego sprzętu oraz przygotuj zapasowe urządzenia, które można szybko wysłać w ramach wymiany.', 'Określ prosty sposób zgłaszania i zwracania uszkodzonego sprzętu oraz przygotuj zapasowe urządzenia, które można szybko wysłać w ramach wymiany.', null,
          true, 'mvp.przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.ustal-procedure-wymiany-wadliwych-sztuk.note',
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
          'Odbieraj uszkodzone urządzenia, analizuj ich poszczególne elementy i ustalaj bezpośrednią przyczynę każdej usterki.', 'Odbieraj uszkodzone urządzenia, analizuj ich poszczególne elementy i ustalaj bezpośrednią przyczynę każdej usterki.', null,
          true, 'mvp.przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.diagnozuj-przyczyny-awarii.note',
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
          'Zapisuj najczęściej powtarzające się pytania i problemy, a następnie przygotuj na ich podstawie FAQ, instrukcje lub krótkie materiały wideo.', 'Zapisuj najczęściej powtarzające się pytania i problemy, a następnie przygotuj na ich podstawie FAQ, instrukcje lub krótkie materiały wideo.', null,
          true, 'mvp.przygotuj-proces-reklamacji-i-obslugi-posprzedazowej.stworz-baze-wiedzy-dla-wsparcia.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ustal-procedure-wymiany-wadliwych-sztuk', 'diagnozuj-przyczyny-awarii', 'stworz-baze-wiedzy-dla-wsparcia']);

  -- ── punkt 4: Zabezpiecz łańcuch dostaw pod większą produkcję
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje', 'Zabezpiecz łańcuch dostaw pod większą produkcję', null,
          null, 'Etap MVP dla hardware startupu zaczyna się od wysłania pierwszej małej serii produktu, obejmującej 50–100 sztuk, do pierwszych klientów lub testerów. Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.

Najpierw należy sprawdzić logistykę. Trzeba kontrolować stan przesyłek i jakość pakowania, aby upewnić się, że urządzenia przechodzą transport bez uszkodzeń. Warto również zmierzyć, ile czasu zajmuje użytkownikowi rozpakowanie i pierwsze uruchomienie sprzętu. Dzięki temu można wykryć problemy, które mogą prowadzić do frustracji lub zwrotów. Równocześnie należy obserwować obsługę klienta: liczbę pytań technicznych, liczbę zgłoszeń oraz czas potrzebny na udzielenie pomocy.

Następnie należy zbadać awaryjność i satysfakcję z użytkowania. Startup powinien policzyć, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach. Ważne jest również przeprowadzenie rozmów z użytkownikami na temat baterii, obudowy, przycisków, łączności i innych problemów. Poziom satysfakcji można dodatkowo sprawdzić za pomocą NPS. Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.

Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej. Startup powinien mieć jasną procedurę zwrotu i wymiany wadliwych urządzeń oraz odpowiedni zapas produktów do wymiany. Każde uszkodzone urządzenie powinno być analizowane, aby ustalić bezpośrednią przyczynę awarii. Powtarzające się pytania i problemy należy zapisywać w bazie wiedzy i zamieniać w FAQ, instrukcje lub materiały wideo.

Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii. Przy większym wolumenie warto renegocjować ceny z fabryką i obniżyć koszt jednostkowy. Jednocześnie należy zamknąć listę poprawek w projekcie, wprowadzając ostatnie konieczne zmiany w obudowie, elektronice lub innych elementach.

Na końcu startup musi potwierdzić, że produkt jest ekonomicznie opłacalny i że istnieje wystarczający popyt na większą serię. Należy policzyć rzeczywisty koszt jednostkowy, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównać go z ceną sprzedaży. Kolejnym krokiem jest zdobycie konkretnych zamówień, przedsprzedaży lub deklaracji od dystrybutorów. Na podstawie marży, jakości produktu i potwierdzonego popytu należy podjąć decyzję o uruchomieniu produkcji masowej albo wstrzymaniu projektu, jeśli wyniki są niewystarczające.',
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
          'Upewnij się, że kluczowe układy, materiały i inne komponenty są dostępne w ilościach potrzebnych do kolejnej serii produkcyjnej.', 'Upewnij się, że kluczowe układy, materiały i inne komponenty są dostępne w ilościach potrzebnych do kolejnej serii produkcyjnej.', null,
          true, 'mvp.zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.sprawdz-dostepnosc-komponentow-u-dostawcow.note',
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
          'Wykorzystaj większą liczbę planowanych zamówień do negocjowania z fabryką niższego kosztu jednostkowego produkcji.', 'Wykorzystaj większą liczbę planowanych zamówień do negocjowania z fabryką niższego kosztu jednostkowego produkcji.', null,
          true, 'mvp.zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.renegocjuj-ceny-przy-wyzszym-wolumenie.note',
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
          'Wprowadź ostatnie niezbędne zmiany w obudowie, elektronice lub innych elementach na podstawie problemów wykrytych podczas pierwszej serii.', 'Wprowadź ostatnie niezbędne zmiany w obudowie, elektronice lub innych elementach na podstawie problemów wykrytych podczas pierwszej serii.', null,
          true, 'mvp.zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje.zamknij-liste-poprawek-w-projekcie.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['sprawdz-dostepnosc-komponentow-u-dostawcow', 'renegocjuj-ceny-przy-wyzszym-wolumenie', 'zamknij-liste-poprawek-w-projekcie']);

  -- ── punkt 5: Potwierdź marżowość i zamów serię masową
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'potwierdz-marzowosc-i-zamow-serie-masowa', 'Potwierdź marżowość i zamów serię masową', null,
          null, 'Etap MVP dla hardware startupu zaczyna się od wysłania pierwszej małej serii produktu, obejmującej 50–100 sztuk, do pierwszych klientów lub testerów. Celem jest przetestowanie nie tylko samego urządzenia, ale całej ścieżki od przygotowania zamówienia do dostarczenia produktu użytkownikowi.

Najpierw należy sprawdzić logistykę. Trzeba kontrolować stan przesyłek i jakość pakowania, aby upewnić się, że urządzenia przechodzą transport bez uszkodzeń. Warto również zmierzyć, ile czasu zajmuje użytkownikowi rozpakowanie i pierwsze uruchomienie sprzętu. Dzięki temu można wykryć problemy, które mogą prowadzić do frustracji lub zwrotów. Równocześnie należy obserwować obsługę klienta: liczbę pytań technicznych, liczbę zgłoszeń oraz czas potrzebny na udzielenie pomocy.

Następnie należy zbadać awaryjność i satysfakcję z użytkowania. Startup powinien policzyć, ile urządzeń z pierwszej serii uległo awarii lub miało wady fabryczne w pierwszych tygodniach. Ważne jest również przeprowadzenie rozmów z użytkownikami na temat baterii, obudowy, przycisków, łączności i innych problemów. Poziom satysfakcji można dodatkowo sprawdzić za pomocą NPS. Jeśli podczas użytkowania pojawią się błędy, należy przygotować i wydać pierwszą zdalną aktualizację firmware''u.

Kolejnym krokiem jest przygotowanie procesu reklamacji i obsługi posprzedażowej. Startup powinien mieć jasną procedurę zwrotu i wymiany wadliwych urządzeń oraz odpowiedni zapas produktów do wymiany. Każde uszkodzone urządzenie powinno być analizowane, aby ustalić bezpośrednią przyczynę awarii. Powtarzające się pytania i problemy należy zapisywać w bazie wiedzy i zamieniać w FAQ, instrukcje lub materiały wideo.

Po przetestowaniu pierwszej serii trzeba przygotować łańcuch dostaw do większej produkcji. Należy sprawdzić dostępność kluczowych komponentów i materiałów u dostawców oraz upewnić się, że można je pozyskać w ilościach potrzebnych do kolejnej serii. Przy większym wolumenie warto renegocjować ceny z fabryką i obniżyć koszt jednostkowy. Jednocześnie należy zamknąć listę poprawek w projekcie, wprowadzając ostatnie konieczne zmiany w obudowie, elektronice lub innych elementach.

Na końcu startup musi potwierdzić, że produkt jest ekonomicznie opłacalny i że istnieje wystarczający popyt na większą serię. Należy policzyć rzeczywisty koszt jednostkowy, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównać go z ceną sprzedaży. Kolejnym krokiem jest zdobycie konkretnych zamówień, przedsprzedaży lub deklaracji od dystrybutorów. Na podstawie marży, jakości produktu i potwierdzonego popytu należy podjąć decyzję o uruchomieniu produkcji masowej albo wstrzymaniu projektu, jeśli wyniki są niewystarczające.',
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
          'Policz pełny koszt jednego produktu, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównaj go z ceną sprzedaży.', 'Policz pełny koszt jednego produktu, uwzględniając produkcję, pakowanie, wysyłkę i zwroty, a następnie porównaj go z ceną sprzedaży.', null,
          true, 'mvp.potwierdz-marzowosc-i-zamow-serie-masowa.zderz-rzeczywisty-koszt-jednostkowy-z-przychodem.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Zbierz przedsprzedaż lub konkretne deklaracje zamówień od dystrybutorów, aby potwierdzić popyt i pomóc pokryć koszty uruchomienia większej produkcji.', 'Zbierz przedsprzedaż lub konkretne deklaracje zamówień od dystrybutorów, aby potwierdzić popyt i pomóc pokryć koszty uruchomienia większej produkcji.', null,
          true, 'mvp.potwierdz-marzowosc-i-zamow-serie-masowa.uzyskaj-twarde-zamowienia-na-wiekszy-wolumen.note',
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
          'Podejmij decyzję o zamówieniu masowym — co wybierasz?', 'Na podstawie marży, jakości produktu i potwierdzonego popytu zdecyduj, czy wpłacić zaliczkę na produkcję masową, czy wstrzymać projekt.', null,
          true, 'mvp.potwierdz-marzowosc-i-zamow-serie-masowa.podejmij-decyzje-o-zamowieniu-masowym.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"},{"value":"stop","label":"Wstrzymuję projekt"}]}'::jsonb, 1)
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
  where category_id = v_category and key <> all(array['zrealizuj-pierwsza-wysylke-i-przetestuj-logistyke', 'zbadaj-awaryjnosc-i-satysfakcje-w-uzytkowaniu', 'przygotuj-proces-reklamacji-i-obslugi-posprzedazowej', 'zabezpiecz-lancuch-dostaw-pod-wieksza-produkcje', 'potwierdz-marzowosc-i-zamow-serie-masowa']);

  -- ═══ kategoria: B2B ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2b', 'B2B', 'Dodatkowe punkty, gdy sprzedajesz firmom.',
          false, 4)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zbuduj minimalną wersję rozwiązania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zbuduj-minimalna-wersje-rozwiazania', 'Zbuduj minimalną wersję rozwiązania', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Stwórz tylko funkcje niezbędne do sprawdzenia głównej wartości rozwiązania. Skup się wyłącznie na tym, co pozwoli sprawdzić, czy Twoje rozwiązanie faktycznie rozwiązuje problem klienta B2B — unikaj dodawania funkcji „na przyszłość”, bo wydłużają czas budowy i odciągają uwagę od głównego celu.', 'Stwórz tylko funkcje niezbędne do sprawdzenia głównej wartości rozwiązania. Skup się wyłącznie na tym, co pozwoli sprawdzić, czy Twoje rozwiązanie faktycznie rozwiązuje problem klienta B2B — unikaj dodawania funkcji „na przyszłość”, bo wydłużają czas budowy i odciągają uwagę o…', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.zrealizuj-podstawowe-funkcje-mvp.note',
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
          'Zapewnij działanie podstawowej ścieżki użytkownika. Upewnij się, że użytkownik może przejść całą podstawową ścieżkę — od pierwszego kontaktu z produktem aż po uzyskanie głównej wartości — a wszystkie elementy MVP działają razem jako spójna całość, nawet jeśli są uproszczone.', 'Zapewnij działanie podstawowej ścieżki użytkownika. Upewnij się, że użytkownik może przejść całą podstawową ścieżkę — od pierwszego kontaktu z produktem aż po uzyskanie głównej wartości — a wszystkie elementy MVP działają razem jako spójna całość, nawet jeśli są uproszczone.', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.polacz-kluczowe-elementy-rozwiazania.note',
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
          'Wprowadź minimalną wersję rozwiązania do rzeczywistego użytkowania. Oddaj MVP w ręce prawdziwych użytkowników biznesowych, zamiast testować je tylko wewnątrz zespołu — dopiero kontakt z realnymi warunkami pracy klienta pokaże, czy rozwiązanie się sprawdza.', 'Wprowadź minimalną wersję rozwiązania do rzeczywistego użytkowania. Oddaj MVP w ręce prawdziwych użytkowników biznesowych, zamiast testować je tylko wewnątrz zespołu — dopiero kontakt z realnymi warunkami pracy klienta pokaże, czy rozwiązanie się sprawdza.', null,
          true, 'mvp.zbuduj-minimalna-wersje-rozwiazania.udostepnij-mvp-do-testowania.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zrealizuj-podstawowe-funkcje-mvp', 'polacz-kluczowe-elementy-rozwiazania', 'udostepnij-mvp-do-testowania']);

  -- ── punkt 2: Rozpocznij testowanie z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'rozpocznij-testowanie-z-uzytkownikami', 'Rozpocznij testowanie z użytkownikami', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Wybierz osoby odpowiednie do testowania rozwiązania. Wybierz firmy lub osoby, które najlepiej reprezentują Twoją docelową grupę klientów B2B i realnie mierzą się z problemem, który rozwiązujesz.', 'Wybierz osoby odpowiednie do testowania rozwiązania. Wybierz firmy lub osoby, które najlepiej reprezentują Twoją docelową grupę klientów B2B i realnie mierzą się z problemem, który rozwiązujesz.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.okresl-grupe-badawcza.note',
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
          'Określ, jak długo użytkownicy będą testować MVP. Wyznacz konkretny przedział czasowy testów, aby użytkownicy mieli wystarczająco dużo czasu na poznanie produktu — zbyt krótki okres nie pozwoli zaobserwować realnego sposobu korzystania z rozwiązania.', 'Określ, jak długo użytkownicy będą testować MVP. Wyznacz konkretny przedział czasowy testów, aby użytkownicy mieli wystarczająco dużo czasu na poznanie produktu — zbyt krótki okres nie pozwoli zaobserwować realnego sposobu korzystania z rozwiązania.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.ustal-okres-badania.note',
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
          'Zapewnij wybranej grupie dostęp do rozwiązania. Przekaż grupie testowej dostęp do MVP wraz z prostą instrukcją, jak zacząć z niego korzystać, dbając, by proces wdrożenia był jak najprostszy.', 'Zapewnij wybranej grupie dostęp do rozwiązania. Przekaż grupie testowej dostęp do MVP wraz z prostą instrukcją, jak zacząć z niego korzystać, dbając, by proces wdrożenia był jak najprostszy.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.udostepnij-mvp-uzytkownikom.note',
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
          'Zwracaj uwagę na sposób korzystania i pojawiające się problemy. Śledź, które funkcje użytkownicy faktycznie wykorzystują, a które ignorują, oraz gdzie napotykają trudności — te obserwacje często mówią więcej niż same deklaracje.', 'Zwracaj uwagę na sposób korzystania i pojawiające się problemy. Śledź, które funkcje użytkownicy faktycznie wykorzystują, a które ignorują, oraz gdzie napotykają trudności — te obserwacje często mówią więcej niż same deklaracje.', null,
          true, 'mvp.rozpocznij-testowanie-z-uzytkownikami.obserwuj-reakcje-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['okresl-grupe-badawcza', 'ustal-okres-badania', 'udostepnij-mvp-uzytkownikom', 'obserwuj-reakcje-uzytkownikow']);

  -- ── punkt 3: Zbierz feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zbierz-feedback', 'Zbierz feedback', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Pozyskaj bezpośrednie informacje o doświadczeniach z MVP. Przeprowadź rozmowy, ankiety lub krótkie wywiady, aby poznać subiektywne odczucia użytkowników i dowiedzieć się wprost, co im się podobało, a co sprawiało trudność.', 'Pozyskaj bezpośrednie informacje o doświadczeniach z MVP. Przeprowadź rozmowy, ankiety lub krótkie wywiady, aby poznać subiektywne odczucia użytkowników i dowiedzieć się wprost, co im się podobało, a co sprawiało trudność.', null,
          true, 'mvp.zbierz-feedback.zbieraj-opinie-uzytkownikow.note',
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
          'Zasięgnij opinii osób posiadających odpowiednią wiedzę lub doświadczenie. Skonsultuj się z ekspertami z branży lub doświadczonymi przedsiębiorcami, którzy spojrzą na rozwiązanie z szerszej perspektywy i pomogą wychwycić ryzyka niewidoczne dla użytkowników.', 'Zasięgnij opinii osób posiadających odpowiednią wiedzę lub doświadczenie. Skonsultuj się z ekspertami z branży lub doświadczonymi przedsiębiorcami, którzy spojrzą na rozwiązanie z szerszej perspektywy i pomogą wychwycić ryzyka niewidoczne dla użytkowników.', null,
          true, 'mvp.zbierz-feedback.konsultuj-rozwiazanie-z-ekspertami.note',
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
          'Rejestruj usterki, trudności i niezrozumiałe elementy. Dokumentuj wszystkie zgłoszone błędy techniczne, momenty zagubienia użytkownika i niejasne elementy interfejsu — taka lista stanie się podstawą dalszych poprawek.', 'Rejestruj usterki, trudności i niezrozumiałe elementy. Dokumentuj wszystkie zgłoszone błędy techniczne, momenty zagubienia użytkownika i niejasne elementy interfejsu — taka lista stanie się podstawą dalszych poprawek.', null,
          true, 'mvp.zbierz-feedback.zbieraj-informacje-o-problemach.note',
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
          'Zapisuj propozycje dotyczące funkcji głównych i dodatkowych. Notuj wszystkie pomysły i sugestie użytkowników, aby lepiej zrozumieć, czego naprawdę potrzebuje rynek.', 'Zapisuj propozycje dotyczące funkcji głównych i dodatkowych. Notuj wszystkie pomysły i sugestie użytkowników, aby lepiej zrozumieć, czego naprawdę potrzebuje rynek.', null,
          true, 'mvp.zbierz-feedback.zbieraj-oczekiwania-uzytkownikow.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zbieraj-opinie-uzytkownikow', 'konsultuj-rozwiazanie-z-ekspertami', 'zbieraj-informacje-o-problemach', 'zbieraj-oczekiwania-uzytkownikow']);

  -- ── punkt 4: Przeanalizuj feedback
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przeanalizuj-feedback', 'Przeanalizuj feedback', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Sprawdź, jak użytkownicy oceniają rozwiązanie. Przeanalizuj zebrane opinie, aby ocenić ogólny poziom satysfakcji, korzystając np. z prostej skali ocen lub wskaźnika NPS.', 'Sprawdź, jak użytkownicy oceniają rozwiązanie. Przeanalizuj zebrane opinie, aby ocenić ogólny poziom satysfakcji, korzystając np. z prostej skali ocen lub wskaźnika NPS.', null,
          true, 'mvp.przeanalizuj-feedback.ocen-poziom-zadowolenia.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Zidentyfikuj najczęściej pojawiające się usterki i bariery. Pogrupuj zgłoszone problemy według częstotliwości występowania, aby wskazać te dotyczące największej liczby użytkowników i ustalić priorytety dalszych prac.', 'Zidentyfikuj najczęściej pojawiające się usterki i bariery. Pogrupuj zgłoszone problemy według częstotliwości występowania, aby wskazać te dotyczące największej liczby użytkowników i ustalić priorytety dalszych prac.', null,
          true, 'mvp.przeanalizuj-feedback.przeanalizuj-zglaszane-problemy.note',
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
          'Określ, których funkcji użytkownicy rzeczywiście potrzebują. Oddziel funkcje niezbędne dla głównej wartości produktu od tych, które są jedynie miłym dodatkiem, koncentrując się na tym, co realnie wpływa na decyzje zakupowe klientów B2B.', 'Określ, których funkcji użytkownicy rzeczywiście potrzebują. Oddziel funkcje niezbędne dla głównej wartości produktu od tych, które są jedynie miłym dodatkiem, koncentrując się na tym, co realnie wpływa na decyzje zakupowe klientów B2B.', null,
          true, 'mvp.przeanalizuj-feedback.przeanalizuj-potrzeby-dotyczace-funkcji.note',
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
          'Ustal, co zostało potwierdzone, podważone lub pozostaje niewiadome. Podsumuj, które z pierwotnych założeń biznesowych potwierdziły się w testach, które zostały obalone, a które wciąż wymagają weryfikacji.', 'Ustal, co zostało potwierdzone, podważone lub pozostaje niewiadome. Podsumuj, które z pierwotnych założeń biznesowych potwierdziły się w testach, które zostały obalone, a które wciąż wymagają weryfikacji.', null,
          true, 'mvp.przeanalizuj-feedback.wyciagnij-najwazniejsze-wnioski.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['ocen-poziom-zadowolenia', 'przeanalizuj-zglaszane-problemy', 'przeanalizuj-potrzeby-dotyczace-funkcji', 'wyciagnij-najwazniejsze-wnioski']);

  -- ── punkt 5: Określ kierunek dalszego działania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'okresl-kierunek-dalszego-dzialania', 'Określ kierunek dalszego działania', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Wybierz zmiany mające największy wpływ na wartość produktu. Wybierz spośród wniosków te zmiany, które przyniosą użytkownikom największą korzyść, zamiast próbować wprowadzić wszystko naraz.', 'Wybierz zmiany mające największy wpływ na wartość produktu. Wybierz spośród wniosków te zmiany, które przyniosą użytkownikom największą korzyść, zamiast próbować wprowadzić wszystko naraz.', null,
          true, 'mvp.okresl-kierunek-dalszego-dzialania.ustal-najwazniejsze-poprawki.note',
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
          'Określ, jak dostosować rozwiązanie do otrzymanego feedbacku. Stwórz konkretny, realistyczny plan działania opisujący, jakie zmiany zostaną wprowadzone, w jakiej kolejności i w jakim czasie.', 'Określ, jak dostosować rozwiązanie do otrzymanego feedbacku. Stwórz konkretny, realistyczny plan działania opisujący, jakie zmiany zostaną wprowadzone, w jakiej kolejności i w jakim czasie.', null,
          true, 'mvp.okresl-kierunek-dalszego-dzialania.zaplanuj-ulepszenie-mvp.note',
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
          true, 'mvp.okresl-kierunek-dalszego-dzialania.rozwaz-zmiane-zalozen.note',
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
          'Podejmij decyzję o dalszym działaniu — co wybierasz?', 'Wybierz dalszy rozwój, pivot lub zakończenie projektu. Na podstawie zebranych danych zdecyduj świadomie, czy kontynuować rozwój w obecnym kierunku, zmienić strategię, czy zakończyć projekt.', null,
          true, 'mvp.okresl-kierunek-dalszego-dzialania.podejmij-decyzje-o-dalszym-dzialaniu.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"},{"value":"stop","label":"Wstrzymuję projekt"}]}'::jsonb, 1)
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
  values (v_category, 'ponownie-przetestuj-rozwiazanie', 'Ponownie przetestuj rozwiązanie', null,
          null, 'Etap MVP polega na zbudowaniu minimalnej wersji rozwiązania: stworzeniu tylko tych funkcji, które są niezbędne do sprawdzenia głównej wartości produktu, połączeniu ich w jedną, działającą podstawową ścieżkę użytkownika oraz udostępnieniu tej podstawowej wersji do rzeczywistego użytkowania zamiast trzymania jej wyłącznie wewnątrz zespołu. Kolejnym krokiem jest rozpoczęcie testowania z użytkownikami — wybranie grupy badawczej złożonej z osób lub firm najlepiej reprezentujących docelowych klientów B2B, ustalenie, jak długo potrwa badanie, udostępnienie MVP wybranej grupie wraz z prostą instrukcją korzystania oraz obserwowanie przez cały okres testów, jak użytkownicy faktycznie korzystają z produktu i jakie problemy napotykają. Następnie zbierany jest feedback: pozyskiwanie bezpośrednich opinii użytkowników o ich doświadczeniach z MVP, konsultowanie rozwiązania z ekspertami, którzy mogą dostrzec ryzyka niewidoczne dla samych użytkowników, rejestrowanie wszystkich zgłoszonych usterek, trudności i niezrozumiałych elementów, a także zapisywanie oczekiwań użytkowników dotyczących funkcji głównych i dodatkowych. Zebrany feedback poddawany jest analizie — ocenie poziomu zadowolenia użytkowników, przeglądowi zgłaszanych problemów w celu znalezienia tych najczęściej się powtarzających, sprawdzeniu, których funkcji użytkownicy rzeczywiście potrzebują, oraz wyciągnięciu najważniejszych wniosków co do tego, co zostało potwierdzone, co podważone, a co nadal pozostaje niewiadomą. Na podstawie tych wniosków określany jest kierunek dalszego działania: wybór najważniejszych poprawek o największym wpływie na wartość produktu, zaplanowanie ich wdrożenia w MVP, rozważenie, czy potrzebna jest częściowa lub całkowita zmiana założeń, oraz podjęcie decyzji o dalszym rozwoju, pivocie lub zakończeniu projektu. Na koniec rozwiązanie jest ponownie testowane: wprowadzenie ustalonych zmian do MVP, ponowne udostępnienie go użytkownikom w celu sprawdzenia ich reakcji na nową wersję, porównanie wyników sprzed i po zmianach oraz powtórzenie całego procesu — testowania, zbierania feedbacku i wprowadzania ulepszeń — jako powtarzalnego cyklu walidacji produktu.',
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
          'Dostosuj MVP zgodnie z wynikami analizy. Wdróż zmiany wynikające z analizy feedbacku, koncentrując się na tych o największym wpływie na wartość dla użytkownika i zachowując spójność z resztą rozwiązania.', 'Dostosuj MVP zgodnie z wynikami analizy. Wdróż zmiany wynikające z analizy feedbacku, koncentrując się na tych o największym wpływie na wartość dla użytkownika i zachowując spójność z resztą rozwiązania.', null,
          true, 'mvp.ponownie-przetestuj-rozwiazanie.wprowadz-najwazniejsze-zmiany.note',
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
          'Sprawdź reakcję na zmienioną wersję. Przekaż zaktualizowane MVP tej samej lub podobnej grupie użytkowników i obserwuj, czy nowe rozwiązania faktycznie usuwają wcześniej zgłoszone problemy.', 'Sprawdź reakcję na zmienioną wersję. Przekaż zaktualizowane MVP tej samej lub podobnej grupie użytkowników i obserwuj, czy nowe rozwiązania faktycznie usuwają wcześniej zgłoszone problemy.', null,
          true, 'mvp.ponownie-przetestuj-rozwiazanie.ponownie-udostepnij-rozwiazanie-uzytkownikom.note',
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
          'Oceń wpływ wprowadzonych zmian. Zestaw wyniki testów sprzed i po poprawkach, zwracając uwagę zarówno na wskaźniki ilościowe, jak i jakościowe opinie użytkowników.', 'Oceń wpływ wprowadzonych zmian. Zestaw wyniki testów sprzed i po poprawkach, zwracając uwagę zarówno na wskaźniki ilościowe, jak i jakościowe opinie użytkowników.', null,
          true, 'mvp.ponownie-przetestuj-rozwiazanie.porownaj-wyniki-przed-i-po-zmianach.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Kontynuuj cykl testowania, feedbacku i ulepszania. Traktuj walidację MVP jako powtarzalny cykl, a nie jednorazowe działanie — po każdej rundzie testów wracaj do zbierania feedbacku i wprowadzania kolejnych ulepszeń.', 'Kontynuuj cykl testowania, feedbacku i ulepszania. Traktuj walidację MVP jako powtarzalny cykl, a nie jednorazowe działanie — po każdej rundzie testów wracaj do zbierania feedbacku i wprowadzania kolejnych ulepszeń.', null,
          true, 'mvp.ponownie-przetestuj-rozwiazanie.powtorz-proces-walidacji.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wprowadz-najwazniejsze-zmiany', 'ponownie-udostepnij-rozwiazanie-uzytkownikom', 'porownaj-wyniki-przed-i-po-zmianach', 'powtorz-proces-walidacji']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['zbuduj-minimalna-wersje-rozwiazania', 'rozpocznij-testowanie-z-uzytkownikami', 'zbierz-feedback', 'przeanalizuj-feedback', 'okresl-kierunek-dalszego-dzialania', 'ponownie-przetestuj-rozwiazanie']);

  -- ═══ kategoria: B2C ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2c', 'B2C', 'Dodatkowe punkty, gdy sprzedajesz konsumentom.',
          false, 5)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przetestuj pozyskiwanie użytkowników i konwersję
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przetestuj-pozyskiwanie-uzytkownikow-i-konwersje', 'Przetestuj pozyskiwanie użytkowników i konwersję', null,
          null, 'Etap MVP dla B2C startupu zaczyna się od przetestowania pozyskiwania użytkowników i konwersji. Startup powinien uruchomić przygotowane płatne kampanie z małym budżetem i sprowadzić na stronę pierwszą grupę realnych użytkowników. Następnie należy zmierzyć wskaźnik konwersji oraz CAC, czyli koszt pozyskania jednego płacącego klienta. Trzeba także przeanalizować analitykę i nagrania sesji, aby znaleźć miejsca, w których użytkownicy rezygnują z zakupu. Na podstawie wyników można testować różne kreacje i komunikaty reklamowe oraz wybierać te, które skuteczniej prowadzą do sprzedaży.

Drugim krokiem jest ocena zaangażowania i utrzymania użytkowników, czyli Retention. Należy sprawdzić, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu. Warto również przeanalizować program poleceń i sprawdzić, czy użytkownicy zapraszają kolejne osoby. Startup powinien określić moment kluczowej wartości, czyli konkretną akcję, po której użytkownik zaczyna regularnie korzystać z produktu. Ważne jest też poznanie powodów Churnu poprzez rozmowy z osobami, które przestały korzystać z produktu lub poprosiły o zwrot.

Trzecim krokiem jest uporządkowanie zwrotów, reklamacji i kwestii prawnych. Startup powinien mierzyć wskaźnik zwrotów i zapisywać przyczyny, dla których klienci chcą odzyskać pieniądze. Następnie warto uruchomić automatyczne przypomnienia dla osób, które rozpoczęły zakup, ale go nie zakończyły. Jednocześnie trzeba dopilnować, aby zbieranie e-maili, analityka i regulamin sprzedaży były odpowiednio przygotowane oraz zgodne z RODO i obowiązującymi zasadami.

Czwartym krokiem są pogłębione wywiady z użytkownikami. Z płacącymi klientami należy porozmawiać o tym, jaki problem chcieli rozwiązać i co przekonało ich do zakupu. Z osobami, które odwiedziły stronę, ale nie kupiły, trzeba ustalić główne bariery i powody rezygnacji. Pozytywne opinie pierwszych użytkowników można następnie wykorzystać jako referencje i dowody społeczne na stronie.

Na końcu należy potwierdzić opłacalność biznesu i wyznaczyć kolejny krok. Startup powinien porównać CAC z LTV i sprawdzić, czy wartość klienta może przewyższać koszt jego pozyskania. Następnie należy ocenić, czy osiągnięto założoną liczbę płacących klientów potrzebną do walidacji MVP. Na podstawie wszystkich danych startup podejmuje decyzję: zwiększa budżet i skaluje pozyskiwanie użytkowników albo najpierw poprawia kluczowe elementy produktu.',
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
          'Wypuść przygotowane reklamy z małym budżetem, aby sprowadzić na stronę pierwszą grupę realnych użytkowników i sprawdzić, czy reklamy generują zainteresowanie.', 'Wypuść przygotowane reklamy z małym budżetem, aby sprowadzić na stronę pierwszą grupę realnych użytkowników i sprawdzić, czy reklamy generują zainteresowanie.', null,
          true, 'mvp.przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.uruchom-platne-kampanie-akwizycyjne.note',
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
          'Sprawdź, jaki procent odwiedzających dokonuje zakupu oraz ile średnio kosztuje pozyskanie jednego płacącego klienta.', 'Sprawdź, jaki procent odwiedzających dokonuje zakupu oraz ile średnio kosztuje pozyskanie jednego płacącego klienta.', null,
          true, 'mvp.przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Przeanalizuj dane z analityki strony i nagrania sesji, aby znaleźć moment, w którym użytkownicy najczęściej rezygnują z zakupu.', 'Przeanalizuj dane z analityki strony i nagrania sesji, aby znaleźć moment, w którym użytkownicy najczęściej rezygnują z zakupu.', null,
          true, 'mvp.przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.znajdz-i-usun-waskie-gardla.note',
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
          'Testuj różne nagłówki, teksty i grafiki reklamowe metodą A/B, aby znaleźć warianty, które skuteczniej prowadzą do sprzedaży przy niższym koszcie.', 'Testuj różne nagłówki, teksty i grafiki reklamowe metodą A/B, aby znaleźć warianty, które skuteczniej prowadzą do sprzedaży przy niższym koszcie.', null,
          true, 'mvp.przetestuj-pozyskiwanie-uzytkownikow-i-konwersje.zoptymalizuj-kreacje-i-komunikaty.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['uruchom-platne-kampanie-akwizycyjne', 'zmierz-wskaznik-konwersji-i-koszt-pozyskania-cac', 'znajdz-i-usun-waskie-gardla', 'zoptymalizuj-kreacje-i-komunikaty']);

  -- ── punkt 2: Oceń zaangażowanie i utrzymanie użytkowników (Retention)
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention', 'Oceń zaangażowanie i utrzymanie użytkowników (Retention)', null,
          null, 'Etap MVP dla B2C startupu zaczyna się od przetestowania pozyskiwania użytkowników i konwersji. Startup powinien uruchomić przygotowane płatne kampanie z małym budżetem i sprowadzić na stronę pierwszą grupę realnych użytkowników. Następnie należy zmierzyć wskaźnik konwersji oraz CAC, czyli koszt pozyskania jednego płacącego klienta. Trzeba także przeanalizować analitykę i nagrania sesji, aby znaleźć miejsca, w których użytkownicy rezygnują z zakupu. Na podstawie wyników można testować różne kreacje i komunikaty reklamowe oraz wybierać te, które skuteczniej prowadzą do sprzedaży.

Drugim krokiem jest ocena zaangażowania i utrzymania użytkowników, czyli Retention. Należy sprawdzić, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu. Warto również przeanalizować program poleceń i sprawdzić, czy użytkownicy zapraszają kolejne osoby. Startup powinien określić moment kluczowej wartości, czyli konkretną akcję, po której użytkownik zaczyna regularnie korzystać z produktu. Ważne jest też poznanie powodów Churnu poprzez rozmowy z osobami, które przestały korzystać z produktu lub poprosiły o zwrot.

Trzecim krokiem jest uporządkowanie zwrotów, reklamacji i kwestii prawnych. Startup powinien mierzyć wskaźnik zwrotów i zapisywać przyczyny, dla których klienci chcą odzyskać pieniądze. Następnie warto uruchomić automatyczne przypomnienia dla osób, które rozpoczęły zakup, ale go nie zakończyły. Jednocześnie trzeba dopilnować, aby zbieranie e-maili, analityka i regulamin sprzedaży były odpowiednio przygotowane oraz zgodne z RODO i obowiązującymi zasadami.

Czwartym krokiem są pogłębione wywiady z użytkownikami. Z płacącymi klientami należy porozmawiać o tym, jaki problem chcieli rozwiązać i co przekonało ich do zakupu. Z osobami, które odwiedziły stronę, ale nie kupiły, trzeba ustalić główne bariery i powody rezygnacji. Pozytywne opinie pierwszych użytkowników można następnie wykorzystać jako referencje i dowody społeczne na stronie.

Na końcu należy potwierdzić opłacalność biznesu i wyznaczyć kolejny krok. Startup powinien porównać CAC z LTV i sprawdzić, czy wartość klienta może przewyższać koszt jego pozyskania. Następnie należy ocenić, czy osiągnięto założoną liczbę płacących klientów potrzebną do walidacji MVP. Na podstawie wszystkich danych startup podejmuje decyzję: zwiększa budżet i skaluje pozyskiwanie użytkowników albo najpierw poprawia kluczowe elementy produktu.',
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
          'Sprawdź, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu, aby ocenić, czy produkt jest używany także po pierwszym kontakcie.', 'Sprawdź, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu, aby ocenić, czy produkt jest używany także po pierwszym kontakcie.', null,
          true, 'mvp.ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zmierz-poziom-powracalnosci-do-produktu.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
  values (v_subpoint, 'links', 'links',
          'Sprawdź, ilu użytkowników udostępnia swój link polecający oraz ile nowych osób faktycznie trafia do produktu dzięki tym zaproszeniom.', 'Sprawdź, ilu użytkowników udostępnia swój link polecający oraz ile nowych osób faktycznie trafia do produktu dzięki tym zaproszeniom.', null,
          true, 'mvp.ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.przeanalizuj-aktywnosc-w-programie-polecen.links',
          '{"min_items":1,"max_items":5}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['links']);

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
          'Określ konkretną akcję lub moment, po którym użytkownicy zaczynają regularnie korzystać z produktu i otrzymują z niego realną wartość.', 'Określ konkretną akcję lub moment, po którym użytkownicy zaczynają regularnie korzystać z produktu i otrzymują z niego realną wartość.', null,
          true, 'mvp.ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zidentyfikuj-moment-kluczowej-wartosci.note',
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
          'Porozmawiaj z osobami, które przestały korzystać z produktu lub poprosiły o zwrot pieniędzy, aby ustalić główne przyczyny ich odejścia.', 'Porozmawiaj z osobami, które przestały korzystać z produktu lub poprosiły o zwrot pieniędzy, aby ustalić główne przyczyny ich odejścia.', null,
          true, 'mvp.ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention.zbadaj-powody-rezygnacji-churn.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-poziom-powracalnosci-do-produktu', 'przeanalizuj-aktywnosc-w-programie-polecen', 'zidentyfikuj-moment-kluczowej-wartosci', 'zbadaj-powody-rezygnacji-churn']);

  -- ── punkt 3: Obsłuż zwroty, reklamacje i kwestie prawne
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'obsluz-zwroty-reklamacje-i-kwestie-prawne', 'Obsłuż zwroty, reklamacje i kwestie prawne', null,
          null, 'Etap MVP dla B2C startupu zaczyna się od przetestowania pozyskiwania użytkowników i konwersji. Startup powinien uruchomić przygotowane płatne kampanie z małym budżetem i sprowadzić na stronę pierwszą grupę realnych użytkowników. Następnie należy zmierzyć wskaźnik konwersji oraz CAC, czyli koszt pozyskania jednego płacącego klienta. Trzeba także przeanalizować analitykę i nagrania sesji, aby znaleźć miejsca, w których użytkownicy rezygnują z zakupu. Na podstawie wyników można testować różne kreacje i komunikaty reklamowe oraz wybierać te, które skuteczniej prowadzą do sprzedaży.

Drugim krokiem jest ocena zaangażowania i utrzymania użytkowników, czyli Retention. Należy sprawdzić, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu. Warto również przeanalizować program poleceń i sprawdzić, czy użytkownicy zapraszają kolejne osoby. Startup powinien określić moment kluczowej wartości, czyli konkretną akcję, po której użytkownik zaczyna regularnie korzystać z produktu. Ważne jest też poznanie powodów Churnu poprzez rozmowy z osobami, które przestały korzystać z produktu lub poprosiły o zwrot.

Trzecim krokiem jest uporządkowanie zwrotów, reklamacji i kwestii prawnych. Startup powinien mierzyć wskaźnik zwrotów i zapisywać przyczyny, dla których klienci chcą odzyskać pieniądze. Następnie warto uruchomić automatyczne przypomnienia dla osób, które rozpoczęły zakup, ale go nie zakończyły. Jednocześnie trzeba dopilnować, aby zbieranie e-maili, analityka i regulamin sprzedaży były odpowiednio przygotowane oraz zgodne z RODO i obowiązującymi zasadami.

Czwartym krokiem są pogłębione wywiady z użytkownikami. Z płacącymi klientami należy porozmawiać o tym, jaki problem chcieli rozwiązać i co przekonało ich do zakupu. Z osobami, które odwiedziły stronę, ale nie kupiły, trzeba ustalić główne bariery i powody rezygnacji. Pozytywne opinie pierwszych użytkowników można następnie wykorzystać jako referencje i dowody społeczne na stronie.

Na końcu należy potwierdzić opłacalność biznesu i wyznaczyć kolejny krok. Startup powinien porównać CAC z LTV i sprawdzić, czy wartość klienta może przewyższać koszt jego pozyskania. Następnie należy ocenić, czy osiągnięto założoną liczbę płacących klientów potrzebną do walidacji MVP. Na podstawie wszystkich danych startup podejmuje decyzję: zwiększa budżet i skaluje pozyskiwanie użytkowników albo najpierw poprawia kluczowe elementy produktu.',
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
          'Policz, jaki procent klientów prosi o zwrot pieniędzy i zapisuj konkretne powody, aby wiedzieć, jakie problemy wymagają poprawy.', 'Policz, jaki procent klientów prosi o zwrot pieniędzy i zapisuj konkretne powody, aby wiedzieć, jakie problemy wymagają poprawy.', null,
          true, 'mvp.obsluz-zwroty-reklamacje-i-kwestie-prawne.zmierz-wskaznik-zwrotow.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Wysyłaj automatyczne przypomnienia osobom, które rozpoczęły proces zakupu lub podały e-mail, ale nie zakończyły płatności.', 'Wysyłaj automatyczne przypomnienia osobom, które rozpoczęły proces zakupu lub podały e-mail, ale nie zakończyły płatności.', null,
          true, 'mvp.obsluz-zwroty-reklamacje-i-kwestie-prawne.uruchom-odzyskiwanie-porzuconych-koszykow.note',
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
          'Upewnij się, że zbieranie e-maili, analityka oraz regulamin sprzedaży są odpowiednio przygotowane i zgodne z obowiązującymi zasadami przed dalszym pozyskiwaniem klientów.', 'Upewnij się, że zbieranie e-maili, analityka oraz regulamin sprzedaży są odpowiednio przygotowane i zgodne z obowiązującymi zasadami przed dalszym pozyskiwaniem klientów.', null,
          true, 'mvp.obsluz-zwroty-reklamacje-i-kwestie-prawne.dopilnuj-zgod-prawnych-i-rodo.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['zmierz-wskaznik-zwrotow', 'uruchom-odzyskiwanie-porzuconych-koszykow', 'dopilnuj-zgod-prawnych-i-rodo']);

  -- ── punkt 4: Przeprowadź pogłębione wywiady z użytkownikami
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'przeprowadz-poglebione-wywiady-z-uzytkownikami', 'Przeprowadź pogłębione wywiady z użytkownikami', null,
          null, 'Etap MVP dla B2C startupu zaczyna się od przetestowania pozyskiwania użytkowników i konwersji. Startup powinien uruchomić przygotowane płatne kampanie z małym budżetem i sprowadzić na stronę pierwszą grupę realnych użytkowników. Następnie należy zmierzyć wskaźnik konwersji oraz CAC, czyli koszt pozyskania jednego płacącego klienta. Trzeba także przeanalizować analitykę i nagrania sesji, aby znaleźć miejsca, w których użytkownicy rezygnują z zakupu. Na podstawie wyników można testować różne kreacje i komunikaty reklamowe oraz wybierać te, które skuteczniej prowadzą do sprzedaży.

Drugim krokiem jest ocena zaangażowania i utrzymania użytkowników, czyli Retention. Należy sprawdzić, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu. Warto również przeanalizować program poleceń i sprawdzić, czy użytkownicy zapraszają kolejne osoby. Startup powinien określić moment kluczowej wartości, czyli konkretną akcję, po której użytkownik zaczyna regularnie korzystać z produktu. Ważne jest też poznanie powodów Churnu poprzez rozmowy z osobami, które przestały korzystać z produktu lub poprosiły o zwrot.

Trzecim krokiem jest uporządkowanie zwrotów, reklamacji i kwestii prawnych. Startup powinien mierzyć wskaźnik zwrotów i zapisywać przyczyny, dla których klienci chcą odzyskać pieniądze. Następnie warto uruchomić automatyczne przypomnienia dla osób, które rozpoczęły zakup, ale go nie zakończyły. Jednocześnie trzeba dopilnować, aby zbieranie e-maili, analityka i regulamin sprzedaży były odpowiednio przygotowane oraz zgodne z RODO i obowiązującymi zasadami.

Czwartym krokiem są pogłębione wywiady z użytkownikami. Z płacącymi klientami należy porozmawiać o tym, jaki problem chcieli rozwiązać i co przekonało ich do zakupu. Z osobami, które odwiedziły stronę, ale nie kupiły, trzeba ustalić główne bariery i powody rezygnacji. Pozytywne opinie pierwszych użytkowników można następnie wykorzystać jako referencje i dowody społeczne na stronie.

Na końcu należy potwierdzić opłacalność biznesu i wyznaczyć kolejny krok. Startup powinien porównać CAC z LTV i sprawdzić, czy wartość klienta może przewyższać koszt jego pozyskania. Następnie należy ocenić, czy osiągnięto założoną liczbę płacących klientów potrzebną do walidacji MVP. Na podstawie wszystkich danych startup podejmuje decyzję: zwiększa budżet i skaluje pozyskiwanie użytkowników albo najpierw poprawia kluczowe elementy produktu.',
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
          'Przeprowadź rozmowy z osobami, które kupiły produkt, i dowiedz się, jaki problem chcieli rozwiązać oraz co przekonało ich do zapłaty.', 'Przeprowadź rozmowy z osobami, które kupiły produkt, i dowiedz się, jaki problem chcieli rozwiązać oraz co przekonało ich do zapłaty.', null,
          true, 'mvp.przeprowadz-poglebione-wywiady-z-uzytkownikami.porozmawiaj-z-placacymi-klientami.note',
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
          'Porozmawiaj z osobami, które odwiedziły stronę, ale nie kupiły produktu, aby poznać ich główne wątpliwości i bariery zakupowe.', 'Porozmawiaj z osobami, które odwiedziły stronę, ale nie kupiły produktu, aby poznać ich główne wątpliwości i bariery zakupowe.', null,
          true, 'mvp.przeprowadz-poglebione-wywiady-z-uzytkownikami.zbierz-powody-braku-zakupu.note',
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
          'Zbieraj opinie od pierwszych zadowolonych użytkowników i za ich zgodą wykorzystuj je jako referencje lub social proof na stronie.', 'Zbieraj opinie od pierwszych zadowolonych użytkowników i za ich zgodą wykorzystuj je jako referencje lub social proof na stronie.', null,
          true, 'mvp.przeprowadz-poglebione-wywiady-z-uzytkownikami.pozyskaj-opinie-i-dowody-spoleczne.note',
          '{"min":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['porozmawiaj-z-placacymi-klientami', 'zbierz-powody-braku-zakupu', 'pozyskaj-opinie-i-dowody-spoleczne']);

  -- ── punkt 5: Potwierdź opłacalność biznesu i wyznacz kolejny krok
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok', 'Potwierdź opłacalność biznesu i wyznacz kolejny krok', null,
          null, 'Etap MVP dla B2C startupu zaczyna się od przetestowania pozyskiwania użytkowników i konwersji. Startup powinien uruchomić przygotowane płatne kampanie z małym budżetem i sprowadzić na stronę pierwszą grupę realnych użytkowników. Następnie należy zmierzyć wskaźnik konwersji oraz CAC, czyli koszt pozyskania jednego płacącego klienta. Trzeba także przeanalizować analitykę i nagrania sesji, aby znaleźć miejsca, w których użytkownicy rezygnują z zakupu. Na podstawie wyników można testować różne kreacje i komunikaty reklamowe oraz wybierać te, które skuteczniej prowadzą do sprzedaży.

Drugim krokiem jest ocena zaangażowania i utrzymania użytkowników, czyli Retention. Należy sprawdzić, ilu klientów wraca do aplikacji lub usługi po 1, 7 i 30 dniach od zakupu. Warto również przeanalizować program poleceń i sprawdzić, czy użytkownicy zapraszają kolejne osoby. Startup powinien określić moment kluczowej wartości, czyli konkretną akcję, po której użytkownik zaczyna regularnie korzystać z produktu. Ważne jest też poznanie powodów Churnu poprzez rozmowy z osobami, które przestały korzystać z produktu lub poprosiły o zwrot.

Trzecim krokiem jest uporządkowanie zwrotów, reklamacji i kwestii prawnych. Startup powinien mierzyć wskaźnik zwrotów i zapisywać przyczyny, dla których klienci chcą odzyskać pieniądze. Następnie warto uruchomić automatyczne przypomnienia dla osób, które rozpoczęły zakup, ale go nie zakończyły. Jednocześnie trzeba dopilnować, aby zbieranie e-maili, analityka i regulamin sprzedaży były odpowiednio przygotowane oraz zgodne z RODO i obowiązującymi zasadami.

Czwartym krokiem są pogłębione wywiady z użytkownikami. Z płacącymi klientami należy porozmawiać o tym, jaki problem chcieli rozwiązać i co przekonało ich do zakupu. Z osobami, które odwiedziły stronę, ale nie kupiły, trzeba ustalić główne bariery i powody rezygnacji. Pozytywne opinie pierwszych użytkowników można następnie wykorzystać jako referencje i dowody społeczne na stronie.

Na końcu należy potwierdzić opłacalność biznesu i wyznaczyć kolejny krok. Startup powinien porównać CAC z LTV i sprawdzić, czy wartość klienta może przewyższać koszt jego pozyskania. Następnie należy ocenić, czy osiągnięto założoną liczbę płacących klientów potrzebną do walidacji MVP. Na podstawie wszystkich danych startup podejmuje decyzję: zwiększa budżet i skaluje pozyskiwanie użytkowników albo najpierw poprawia kluczowe elementy produktu.',
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
          'Porównaj koszt pozyskania klienta z wartością, jaką klient generuje w czasie, aby sprawdzić, czy model biznesowy może być opłacalny.', 'Porównaj koszt pozyskania klienta z wartością, jaką klient generuje w czasie, aby sprawdzić, czy model biznesowy może być opłacalny.', null,
          true, 'mvp.potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.zestaw-koszt-pozyskania-cac-z-wartoscia-klienta-ltv.note',
          '{"min":15}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['note']);

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
          'Sprawdź, czy startup zdobył wcześniej ustaloną liczbę płacących klientów potrzebną do walidacji produktu i modelu biznesowego.', 'Sprawdź, czy startup zdobył wcześniej ustaloną liczbę płacących klientów potrzebną do walidacji produktu i modelu biznesowego.', null,
          true, 'mvp.potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.osiagnij-zalozony-cel-ilosciowy-mvp.note',
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
          'Podejmij decyzję o skalowaniu lub zmianie — co wybierasz?', 'Na podstawie wyników zdecyduj, czy zwiększyć budżet i skalować pozyskiwanie użytkowników, czy najpierw poprawić najważniejsze elementy produktu.', null,
          true, 'mvp.potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok.podejmij-decyzje-o-skalowaniu-lub-zmianie.decision',
          '{"options":[{"value":"continue","label":"Kontynuuję w tym kierunku"},{"value":"improve","label":"Najpierw poprawiam produkt"},{"value":"pivot","label":"Zmieniam kierunek"},{"value":"stop","label":"Wstrzymuję projekt"}]}'::jsonb, 1)
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
  where category_id = v_category and key <> all(array['przetestuj-pozyskiwanie-uzytkownikow-i-konwersje', 'ocen-zaangazowanie-i-utrzymanie-uzytkownikow-retention', 'obsluz-zwroty-reklamacje-i-kwestie-prawne', 'przeprowadz-poglebione-wywiady-z-uzytkownikami', 'potwierdz-oplacalnosc-biznesu-i-wyznacz-kolejny-krok']);

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
