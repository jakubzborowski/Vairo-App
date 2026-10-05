-- ============================================================================
-- 020 · Treść etapu: Execution (v1)
-- ----------------------------------------------------------------------------
-- PLIK GENEROWANY — nie edytuj ręcznie.
-- Źródło: supabase/content/execution-v1.json
-- Regeneracja: npm run content:build -- execution-v1
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
  values ('execution', 1, 'Execution', 'Zbuduj pierwszą wersję',
          'Prowadzisz budowę w trackerze celów. Punkty programu mówią, jaki wynik jest wymagany. Dodatkowe cele nie blokują przejścia.', 4, 'Przechodzę do MVP', now())
  on conflict (key, version) do update set
    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,
    position = excluded.position, finish_label = excluded.finish_label,
    published_at = now()
  returning id into v_template;

  -- ═══ kategoria: Ogólne ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'general', 'Ogólne', 'Te punkty dotyczą każdej budowy. Kategorie dokładają własne wyniki.',
          true, 1)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Wybierz najbliższy wynik i przydziel pracę
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'next', 'Wybierz najbliższy wynik i przydziel pracę', null,
          'Około 15 minut', '1.1. Ustal, co ma być gotowe
Zacznij od pracy, której wynik pozwoli zrobić następny krok w budowie. Sięgnij do wcześniejszych ustaleń i wymagań swojej kategorii. Jeśli masz już odpowiedni Goal, czyli zapisany cel, otwórz jego kartę. Uzupełnij tylko brakujące informacje.
Nazwij cel tak, żeby po jego wykonaniu dało się sprawdzić, co powstało. Samo „Popracować nad produktem” niewiele mówi. Pomocny wzór to: „Gotowy [element], który pozwala [wykonać konkretne działanie]”. Jeśli pod jedną nazwą kryje się kilka niezależnych wyników, wybierz ten potrzebny najbliżej albo podziel pracę na mniejsze cele.
Już teraz ustal proof, czyli dowód ukończenia. Może nim być konkretny plik, zdjęcie, nagranie działania lub zapis wyniku próby. Dopasuj go do celu i wymagań punktu programu. Zdjęcie może pokazać wygląd przedmiotu, ale do potwierdzenia jego działania może być potrzebne nagranie albo wynik sprawdzenia. Na początku określasz, co pokażesz; gotowy dowód dodasz po wykonaniu pracy.
1.2. Przydziel pracę i ustal termin
Wybierz jedną osobę, która dopilnuje osiągnięcia całego celu. Może korzystać z pomocy innych, ale odpowiada za zebranie potrzebnych części i doprowadzenie pracy do końca. Wykorzystaj podział odpowiedzialności ustalony w Preparation. Gdy pracujesz sam, właścicielem celu jesteś ty.
Uzgodnij termin z wykonawcą. Uwzględnij jego dostępność oraz to, czy najpierw potrzebuje wyniku pracy innej osoby. Jeśli całość jest za duża na wybrany termin, wydziel mniejszy wynik, który można w tym czasie osiągnąć. Pozostałą pracę zachowaj na później.
Dodawaj zadania wtedy, gdy pomagają podzielić pracę między osoby albo ustalić jej kolejność. Każde powinno jasno wskazywać, co trzeba zrobić. Unikaj rozpisywania pojedynczych kliknięć i oczywistych czynności. Jeżeli ktoś czeka na wynik drugiej osoby, ustalcie termin przekazania tej części.
Podepnij materiały, bez których wykonawca będzie musiał szukać informacji lub dopytywać. Wybierz aktualny dokument albo plik już zapisany w Vairo. Materiały dotyczące innych prac mogą pozostać w swoich miejscach.',
          '["Geoff Ralston, YC’s Essential Startup Advice (2017): skupienie na najważniejszej pracy i upraszczanie zakresu. Opis Goals i proof jest opracowaniem dla Vairo.","Y Combinator, 10 Questions to Discuss with a Potential Co-founder (2023): podział odpowiedzialności, dostępność i ustalanie kolejności prac. Przypisania w kartach Goals i zadań są zastosowaniem tych wskazówek w Vairo."]'::jsonb, null,
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
  values (v_point, 'setup', 'Ustal wynik, właściciela, termin i dowód',
          'Cel może nadal być w trakcie. Zadania i materiały są opcjonalne.', false,
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
  values (v_subpoint, 'open', 'action',
          'Otwórz istniejący cel albo utwórz go dla najbliższej pracy.', 'Samo kliknięcie nie zalicza punktu. Liczy się cel z nazwanym wynikiem, właścicielem, terminem i ustalonym dowodem.', null,
          false, 'execution.next.setup.open',
          '{"href":"/app/goals?new=1&from=preparation","label":"Utwórz cel z listy Preparation"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'custom', 1,
          null, 'defined', true, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['custom']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['setup']);

  -- ── punkt 2: Prowadź pracę do ukończonego wyniku
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'work', 'Prowadź pracę do ukończonego wyniku', null,
          'Przez całą budowę', '2.1. Zapisuj postęp przy wykonywanej pracy
Pracę możesz wykonywać w narzędziach, które do niej wybrałeś. Do karty w Vairo wracaj, gdy zmienił się stan zadania, powstał przydatny wynik albo pojawiła się przeszkoda. Aktualizacja ma pozwolić tobie i zespołowi szybko zobaczyć, co jest gotowe i co trzeba zrobić dalej.
Zapisuj tylko informacje potrzebne do dalszej pracy. Przykład: „Gotowy pierwszy wariant. Brakuje jeszcze [element]. Aktualny plik: [link]”. Jeżeli wystarczy zmiana statusu i podpięcie pliku, na tym zakończ aktualizację. Osobny raport z całego dnia nie jest potrzebny.
Przy powrocie do pracy korzystaj z tej samej karty. Wspólny zapis pozwala uniknąć sytuacji, w której jedna osoba pracuje na starej wersji, a druga szuka wyniku w wiadomościach.
2.2. Odblokuj pracę, jeśli utkniesz
Status „Zablokowany” ustaw wtedy, gdy konkretna przeszkoda uniemożliwia dalszą pracę. Opisz ją tak, żeby było wiadomo, czego brakuje. „Czekam na decyzję, który z dwóch wariantów przygotowujemy” daje zespołowi więcej informacji niż „Nie mogę ruszyć”. Samo przekroczenie terminu oznacza opóźnienie; nie musi oznaczać blokady.
Ustal najbliższe działanie, które usunie przeszkodę, i przypisz je konkretnej osobie. Na przykład: „Ola wybierze wariant do czwartku”. Zapisz to w istniejącym zadaniu albo dodaj zadanie pod danym celem. Gdy pomoc wymaga zmiany wykonawcy lub terminu, popraw dotychczasowe przypisanie.
Jeśli przeszkoda dotyczy sposobu wykonania, rozważ prostszą drogę do tego samego potrzebnego wyniku. Na początku część pracy można wykonać ręcznie albo z czyjąś pomocą. Takie uproszczenie musi nadal spełniać wymagania celu. Zapisz wybrane rozwiązanie przy pracy, żeby pozostałe osoby wiedziały, jak kontynuować.
2.3. Zamknij osiągnięty cel
Porównaj wynik z tym, co miało powstać. Jeżeli celu jeszcze nie osiągnąłeś, pozostaw go otwartego i popraw zadania. Odhaczenie wszystkich czynności nie wystarcza, gdy brakuje ich oczekiwanego efektu.
Rozróżnij cel sprawdzenia czegoś od celu zbudowania działającego elementu. Jeśli celem było przeprowadzenie próby, jej negatywny wynik też jest wynikiem do zapisania. Jeśli celem było uzyskanie działającego elementu, nieudana próba oznacza, że ten cel wymaga dalszej pracy. Dzięki temu zespół widzi zarówno wykonane sprawdzenie, jak i pozostały problem.
Gdy cel został osiągnięty, wskaż wymagany proof i oznacz go jako ukończony. Możesz wykorzystać materiał już zapisany w karcie. Upewnij się, że pokazujesz właściwą wersję i że dowód odpowiada temu, co chciałeś potwierdzić.
Vairo uwzględni wynik w jawnie powiązanych punktach programu. Pierwszy ukończony Goal pozwala zaliczyć ten punkt General. Pozostałe wymagania budowy nadal wykonujesz w swoich kategoriach, korzystając z tych samych kart i zasad pracy.',
          '["Michael Seibel, The Scientific Method for Startups (2016): podejmowanie decyzji na podstawie obserwowanych wyników. Sposób zapisywania postępu w kartach pracy jest adaptacją tej zasady dla Vairo.","Paul Graham, Do Things that Don’t Scale (2013): korzystanie z prostych, także ręcznych sposobów działania na początku. Obsługa przeszkód i przypisywanie działań wynikają z przyjętego sposobu pracy w Vairo.","Michael Seibel, The Scientific Method for Startups (2016): sprawdzanie założeń, wyciąganie wniosków i dalsza praca na podstawie wyników. Zasady ukończenia Goal i zaliczania punktów pochodzą z programu Vairo."]'::jsonb, null,
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
  values (v_point, 'done', 'Zamknij osiągnięty cel',
          'Jeden jawnie podpięty cel bieżącej budowy, ukończony i z wymaganym dowodem.', false,
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
  values (v_subpoint, 'open', 'action',
          'Wskaż dowód i oznacz cel jako ukończony.', 'Jeśli wyniku jeszcze nie ma, zostaw cel otwarty i popraw zadania.', null,
          false, 'execution.work.done.open',
          '{"href":"/app/goals","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  insert into public.stage_goal_conditions
    (subpoint_id, goal_type_id, min_count, proof_kind, counts_when, match_any_type, position)
  values (v_subpoint, 'custom', 1,
          null, 'completed', true, 1)
  on conflict (subpoint_id, goal_type_id) do update set
    min_count = excluded.min_count, proof_kind = excluded.proof_kind,
    counts_when = excluded.counts_when, match_any_type = excluded.match_any_type,
    position = excluded.position;

  delete from public.stage_goal_conditions
  where subpoint_id = v_subpoint and goal_type_id <> all(array['custom']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['done']);

  -- ── punkt 3: Zamknij Execution
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'close', 'Zamknij Execution', null,
          'Gdy reszta wymagań jest spełniona', '3.1. Dokończ wymagane prace
Otwórz podsumowanie etapu i sprawdź wskazane braki. Jeśli praca jest wykonana, ale nie ma zapisanego dowodu, podepnij istniejący wynik. Jeśli brakuje samego wyniku, wróć do odpowiedniego Goal i dokończ pracę. Korzystaj z wymagań General oraz wybranych kategorii.
Oddziel brak potrzebny do ukończenia pierwszej wersji od pomysłu na jej dalszą rozbudowę. Pomaga pytanie: „Czy bez tej zmiany pierwsza wersja wykona to, co ma zapewnić użytkownikowi?”. Dodatki mogą pozostać w otwartych Goals. Wymagania dotyczące działania i bezpieczeństwa wynikające z twoich kategorii muszą zostać spełnione przed przejściem dalej.
3.2. Przejdź do MVP Stage
Gdy pozostałe wymagania są spełnione, Founder lub Admin potwierdza zakończenie Execution. Podsumowanie wykorzystuje zapisane wcześniej wyniki. Nie musisz przygotowywać kolejnego opisu całej wykonanej pracy.
W MVP Stage zajmiesz się udostępnieniem pierwszej wersji odbiorcom, zebraniem ich reakcji i kolejnymi poprawkami. Tracker, zespół, materiały oraz otwarte Goals pozostają dostępne. Ukończenie budowy nie rozstrzyga jeszcze, jak odbiorcy będą korzystać z produktu. Dlatego dalszą pracę oprzesz także na tym, co wydarzy się po jego udostępnieniu.',
          '["Geoff Ralston, YC’s Essential Startup Advice (2017): ograniczanie zbędnej rozbudowy pierwszej wersji. Paul Graham, Do Things that Don’t Scale (2013): unikanie odkładania pierwszego użycia w oczekiwaniu na doskonałość, z uwzględnieniem konsekwencji błędów. Lista wymaganych prac wynika z programu Vairo.","Geoff Ralston, YC’s Essential Startup Advice (2017): udostępnienie użytecznej pierwszej wersji i dalsze poprawki oparte na kontakcie z użytkownikami. Warunki przejścia do MVP Stage i zachowanie danych wynikają z zasad Vairo."]'::jsonb, null,
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
  values (v_point, 'summary', 'Sprawdź, czego brakuje',
          'Ten punkt nie jest warunkiem pojawienia się przycisku zakończenia.', true,
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
  values (v_subpoint, 'open', 'action',
          'Otwórz podsumowanie etapu i uzupełnij brakujące wyniki.', 'Przycisk zakończenia liczy pozostałe wymagane punkty, nie ten podpunkt.', null,
          false, 'execution.close.summary.open',
          '{"href":"/app/stage/summary","label":"Podsumowanie"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['summary']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['next', 'work', 'close']);

  -- ═══ kategoria: SaaS ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'saas', 'SaaS', 'Pierwsza wersja programu: działanie, dostęp, dane, próby i gotowość do poprawiania.',
          false, 2)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zbuduj główne działanie programu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-core', 'Zbuduj główne działanie programu', null,
          null, '1.1. Doprowadź użytkownika do pierwszego wyniku
Otwórz opis pierwszej wersji przygotowany wcześniej. Wybierz główną czynność, którą program ma umożliwiać, i doprowadź ją do działającego wyniku. Jeżeli tworzysz narzędzie do przygotowywania raportów, użytkownik powinien móc przekazać dane i otrzymać właściwy raport. Już podczas budowy możesz pokazać tę drogę na prostym przykładzie. Pozwoli to wcześnie zauważyć, że poszczególne części programu nie współpracują tak, jak zakładaliście.
Podepnij istniejący Goal albo utwórz Goal typu „Wynik budowy”. Może brzmieć: „Użytkownik dodaje plik z danymi i pobiera przygotowany na jego podstawie raport”. Przypisz osobę odpowiedzialną, uzgodnij termin i wskaż oczekiwany proof, czyli dowód wykonania. W tym przykładzie może nim być nagranie całej czynności oraz otrzymany raport. Uzgodnienie wyniku przed rozpoczęciem pracy ułatwia późniejsze sprawdzenie, czy zadanie zostało wykonane.
Podziel pracę tam, gdzie można odebrać konkretny fragment. Jedna osoba może przygotować przyjmowanie pliku, druga obliczenia, a trzecia widok wyniku. Wcześniej uzgodnijcie, jakie dane przekazują sobie te części. Osoba odpowiedzialna za Goal pilnuje również ich połączenia. Kiedy wykonawca mówi, że jego część jest gotowa, sprawdźcie ją z częścią, która ma z niej korzystać. W Vairo wystarczą zadania przy wspólnym celu. Wielkość zadania dopasuj do możliwości pokazania i sprawdzenia wyniku.
Jeśli korzystasz z gotowej platformy do tworzenia aplikacji bez pisania kodu, ten sam wynik możesz uzyskać przez konfigurację jej funkcji. Gdy odbiorcą usługi jest inny program, połączenie odbywa się przez API, czyli ustalony sposób wymiany danych między programami. W takim przypadku pokaż wysłanie potrzebnych danych i otrzymaną odpowiedź. Przy dłuższym przetwarzaniu odbiorca powinien móc sprawdzić, czy praca trwa, zakończyła się czy wymaga ponowienia.
Do proof dołącz wynik uzyskany na przykładowych danych oraz oznaczenie sprawdzanej wersji. Wersja może mieć prostą nazwę, np. „0.1”, powiązaną z zapisem kodu lub historią gotowej platformy. Dzięki temu zespół będzie wiedzieć, czego dotyczy nagranie po wprowadzeniu następnych zmian. Wykorzystaj ten sam materiał w kolejnych podpunktach, jeżeli odpowiada także na ich pytania.',
          '["Google Engineering Practices, Small CLs opisuje pracę przez niewielkie zmiany, które można osobno sprawdzić. Atlassian, Roles and Responsibilities wyjaśnia uzgadnianie odpowiedzialności i udziału współpracowników. Przykład oraz sposób prowadzenia Goala dopasowano do Vairo."]'::jsonb, null,
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
  values (v_point, 'result', 'Doprowadź użytkownika do pierwszego wyniku',
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
  values (v_subpoint, 'open', 'action',
          'Podepnij albo utwórz cel typu „Wynik budowy”.', 'Dowód pokazuje wersję, działanie i wynik.', null,
          false, 'execution.saas-core.result.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['result']);

  -- ── punkt 2: Zadbaj o dostęp i dane
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-access', 'Zadbaj o dostęp i dane', null,
          null, '2.1. Wprowadź zasady dostępu do programu
Wykorzystaj ustalenia z Preparation i przekaż je osobie budującej dostęp. Powinna wiedzieć, kto może wejść do programu oraz jakie działania są dla tej osoby dostępne. Przy kontach użytkowników warto wykorzystać gotowe mechanizmy logowania. Sprawdźcie też, jak użytkownik odzyska dostęp, gdy zgubi hasło lub przestanie działać wybrany sposób logowania. Przy programie publicznym określone działania mogą być dostępne bez konta, a zarządzanie usługą nadal wymaga ochrony.
Zalogowanie potwierdza tożsamość użytkownika. Uprawnienia określają, co wolno mu zrobić z konkretnym materiałem. Osoba, która utworzyła raport, może mieć prawo go zmienić, podczas gdy zaproszony odbiorca może go tylko przeczytać. Jeśli program obsługuje kilka firm, dostęp do jednej z nich nie powinien otwierać danych pozostałych. Tę samą zasadę zastosuj do prywatnych kont pojedynczych osób.
Przygotujcie dwa konta testowe z oddzielnymi materiałami. Poproś osobę techniczną, żeby sprawdziła, czy z drugiego konta można odczytać lub zmienić cudzy materiał, także przez bezpośrednie wysłanie żądania do usługi. Ukryty przycisk nie zabezpiecza takiego żądania. Kontrola musi działać w części programu, która rozpatruje je i udostępnia dane. Przy gotowej platformie trzeba sprawdzić jej ustawienia dostępu w użytej konfiguracji.
Jeżeli dostęp jest płatny, wdrożcie zasady wybrane wcześniej. Potwierdzenie zapłaty powinno pochodzić z wiarygodnego źródła, np. systemu operatora płatności. Gdy początkowo odblokowujecie konta ręcznie, uzgodnijcie, kto sprawdza płatność i na jak długo przyznaje dostęp. Koniec opłaconego okresu oraz rezygnacja z kolejnego odnowienia powinny prowadzić do zachowania ustalonego w Preparation.
Osobę odpowiedzialną za techniczne sprawdzenie dobierz według jej umiejętności. Jako founder możesz ustalić zasady i odebrać wynik wspólnie z nią. W proof zachowaj opis działającego dostępu oraz wynik prób na kontach testowych. Ten materiał przyda się ponownie przy sprawdzaniu całego programu w podpunkcie 3.1.
2.2. Obsłuż dane w całym działaniu programu
Przejdź drogę jednej informacji przez program. Na przykład użytkownik dodaje plik do projektu, program tworzy raport, a użytkownik później otwiera go ponownie. Sprawdź, czy raport korzysta z właściwego pliku i pozostaje przypisany do właściwego projektu. Wystarczy kilka łatwych do odróżnienia danych testowych. Pomogą zauważyć, że dwa projekty zostały pomylone albo wynik nie zachował się po ponownym wejściu.
Uzgodnij z wykonawcą, jakie dane program może przyjąć. Jeśli oczekuje liczby zamówień, powinien odpowiednio zareagować na tekst lub niedozwoloną wartość. Jeśli przyjmuje pliki, potrzebuje sprawdzania ich rodzaju i dopuszczalnej wielkości. Kontrola powinna odbywać się przed przetwarzaniem po stronie usługi. Komunikat przy formularzu pomaga użytkownikowi poprawić pomyłkę, ale sprawdzenie w samej przeglądarce można ominąć.
Zwróć uwagę na czynności, które zmieniają kilka rzeczy jednocześnie. Przy rezerwacji miejsca program może zapisać zgłoszenie i zmniejszyć liczbę wolnych miejsc. Uzgodnijcie, co się stanie, jeżeli zapis zgłoszenia się powiedzie, a drugi krok zostanie przerwany. Powiązane zmiany w jednej bazie można często połączyć w transakcję, czyli operację wykonywaną w całości albo wycofywaną. Gdy praca obejmuje różne usługi, wykonawca musi dobrać sposób rozpoznania wykonanych kroków i bezpiecznego dokończenia lub cofnięcia pozostałych.
Zastosujcie wcześniej ustalony sposób zachowywania i usuwania informacji. Plik oraz odnośnik do niego mogą być przechowywane w różnych miejscach. Usunięcie wpisu z ekranu nie musi więc usuwać samego pliku. Sprawdźcie, co dzieje się z danymi w miejscach używanych przez program, także po zakończeniu dostępu. Jeżeli wynik jest potrzebny tylko podczas pojedynczego przetwarzania, dopilnujcie zakończenia tego przetwarzania i usunięcia danych zgodnie z przyjętymi zasadami.
Wspólny Goal może obejmować całą drogę danych, nawet gdy różne osoby przygotowują jej fragmenty. Uzgodnijcie moment wspólnej próby, żeby wykryć pomyłki przy przekazywaniu informacji. Jako proof zachowaj opis sprawdzenia i jego wynik. Wykorzystaj materiały powstające podczas pracy, bez przepisywania dokumentacji technicznej do kolejnego formularza.',
          '["OWASP, Authorization Cheat Sheet wyjaśnia uprawnienia i sprawdzanie dostępu po stronie usługi. AWS, Tenant isolation opisuje oddzielenie zasobów klientów. Stripe, Webhooks przedstawia sprawdzanie pochodzenia powiadomień od operatora płatności.","OWASP, Input Validation Cheat Sheet opisuje sprawdzanie danych wejściowych i plików. PostgreSQL, Transactions wyjaśnia zasadę wspólnego zatwierdzania powiązanych zmian w bazie. Zakres zachowywania i usuwania danych wynika z ustaleń twojego produktu."]'::jsonb, null,
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
  values (v_point, 'rules', 'Wprowadź zasady dostępu do programu',
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
  values (v_subpoint, 'open', 'action',
          'Pokaż, że wybrany sposób dostępu działa.', null, null,
          false, 'execution.saas-access.rules.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'data', 'Obsłuż dane w całym działaniu programu',
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
  values (v_subpoint, 'open', 'action',
          'Opisz działającą obsługę danych i wskaż wynik jej sprawdzenia.', null, null,
          false, 'execution.saas-access.data.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['rules', 'data']);

  -- ── punkt 3: Sprawdź program podczas korzystania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-check', 'Sprawdź program podczas korzystania', null,
          null, '3.1. Sprawdź wynik działania i reakcję na problemy
Zacznij próbę od sytuacji, w której znajdzie się nowy odbiorca. Przygotuj świeże konto lub inny właściwy dla produktu sposób wejścia. Wykonaj główną czynność bez korzystania z materiałów pozostawionych na koncie twórcy. Sprawdź również sam wynik. Raport może się otworzyć, a jednocześnie zawierać błędne obliczenia. Program podsumowujący tekst może oddać odpowiedź, która pomija najważniejszą informację.
Następnie sprawdź zachowanie przy pomyłce lub przerwaniu pracy. Co zobaczy użytkownik, gdy prześle niewłaściwy plik? Czy będzie wiadomo, że zewnętrzna usługa nie odpowiedziała? Tam, gdzie powtórzenie czynności mogłoby utworzyć drugą rezerwację albo ponownie pobrać opłatę, sprawdźcie także ponowienie tego samego żądania. Skutek operacji powinien odpowiadać zamiarowi użytkownika. Wykorzystajcie wyniki kontroli dostępu z podpunktu 2.1, jeśli nadal dotyczą badanej wersji.
Przy połączeniach z zewnętrznymi usługami czasem otrzymujesz automatyczne wiadomości o zdarzeniach. Nazywa się je webhookami. Taką wiadomością może być informacja o opłaceniu dostępu. Wykonawca powinien sprawdzić jej pochodzenie metodą wskazaną przez dostawcę i obsłużyć ponowne dostarczenie. Sprawdźcie też opóźnienia oraz inną kolejność wiadomości, jeżeli integracja może tak działać. Przy płatnościach wykorzystajcie środowisko testowe operatora, aby próby nie powodowały pobrania pieniędzy.
Rozdziel sprawdzenia według umiejętności. Osoba znająca potrzeby użytkownika może ocenić zrozumiałość działania i poprawność raportu. Osoba techniczna sprawdzi żądania kierowane do usługi oraz jej zachowanie podczas błędów. Jeśli pracujesz sam, korzystaj z wcześniej zapisanych oczekiwań i odpowiedniej pomocy przy sprawach, których nie potrafisz ocenić. Powtarzalne sprawdzenia kluczowych operacji warto z wykonawcą rozważyć jako testy uruchamiane automatycznie po zmianach.
Przy Goalu typu „Wynik testu” zachowaj badaną wersję i wyniki. Wystarczy zapis pozwalający odtworzyć próbę, np. „Dodano plik bez daty. Oczekiwano komunikatu o brakującej dacie. Program utworzył pusty raport”. Taki wynik może zakończyć Goal dotyczący przeprowadzenia testu. Wykryty problem nadal wymaga poprawienia przed potwierdzeniem gotowości funkcji. Zebrane próby mogą pozostać w jednym dokumencie podpiętym jako proof.
3.2. Sprawdź obciążenie i koszt korzystania
Wróć do liczby pierwszych użytkowników i sposobu korzystania przyjętych w Preparation. Odtwórz przewidywaną pracę na przygotowanej wersji programu. Jeśli kilka osób może jednocześnie tworzyć raporty, sprawdź właśnie taką sytuację. Zmierz czas oczekiwania i zobacz, czy wszystkie zadania kończą się poprawnie. Sama liczba kont nie pokazuje obciążenia. Znaczenie ma to, co użytkownicy robią w tym samym czasie i jak duże dane przetwarzają.
Zacznij od małej próby i zwiększaj obciążenie do potrzebnego zakresu. Uzgodnij z wykonawcą bezpieczny sposób przeprowadzenia jej na waszej usłudze. Przy połączeniach z dostawcami zewnętrznymi uwzględnij ich warunki testowania i dostępne limity. Wskaż, na jakiej konfiguracji wykonano próbę. Wynik z mocniejszej maszyny może nie odpowiadać działaniu programu w tańszym pakiecie, który planujesz udostępnić odbiorcom.
Przyjrzyj się zużyciu usług podczas wykonanych czynności. Koszt miesiąca można wstępnie oszacować jako opłaty stałe powiększone o koszt przewidywanego użycia. Przykładowo, przy opłacie stałej 50 zł i koszcie 20 groszy za raport wykonanie 50 raportów kosztowałoby łącznie około 60 zł. To wyłącznie przykład obliczenia. Użyj cen swoich dostawców i uwzględnij inne płatne czynności programu. Dłuższy plik lub ponowienie nieudanego przetwarzania może zmienić koszt.
Jeżeli przewidywane użycie przekracza budżet, ogranicz to, co generuje wydatek. Może to być liczba raportów albo długość przesyłanego nagrania. Sprawdź z wykonawcą, czy ograniczenie działa także przy bezpośrednim żądaniu do usługi. Po dojściu do limitu użytkownik powinien otrzymać zrozumiałą informację. Jeżeli wybrany dostawca sam zapewnia potrzebne ograniczenie, sprawdź jego działanie i skutek dla odbiorcy.
Do proof dodaj warunki próby i uzyskane wyniki. Zapisz też oszacowanie kosztu dla pierwszej grupy oraz potrzebne limity. Oddziel pomiar od przewidywania: „wykonaliśmy 20 raportów” opisuje próbę, a „100 raportów będzie kosztować około…” opisuje obliczenie. Osoba odpowiedzialna za ten Goal powinna uzgodnić z wykonawcą wynik techniczny, a z osobą pilnującą budżetu dopuszczalny koszt.
3.3. Popraw problem i sprawdź zmianę
Skorzystaj z tego podpunktu, gdy podczas pracy znajdziesz usterkę. Zacznij od jej odtworzenia na podstawie zapisanej próby. Informacja „raport nie działa” pozostawia wykonawcy wiele zgadywania. Opis pliku, wykonanej czynności i otrzymanego wyniku pozwala szybciej dotrzeć do przyczyny. Jeśli błąd pojawia się tylko czasami, zachowaj także godzinę próby, żeby można było znaleźć odpowiadający jej zapis w programie.
Ustalcie, co powoduje problem. Przekroczenie czasu oczekiwania może wynikać zarówno z błędu w waszym programie, jak i z opóźnienia zewnętrznej usługi. Poproś wykonawcę o wyjaśnienie oparte na sprawdzeniu. Gdy przyczyna pozostaje nieznana, najbliższym zadaniem może być właśnie jej ustalenie. Pomaga to uniknąć dużej przebudowy podejmowanej bez wiedzy, co trzeba naprawić.
Rozmowę z zespołem prowadź tak, żeby ludzie szybko zgłaszali problemy. Zapytaj, co się wydarzyło i jakie informacje mieli podczas pracy. Jeśli przyczyną była niejasna zasada albo różne wersje ustaleń, poprawcie również sposób ich przekazywania. Uzgodnijcie jedną osobę pilnującą poprawki do momentu jej sprawdzenia. Samo przekazanie zadania programiście nie kończy tej pracy.
Po zmianie powtórz próbę, która wcześniej wykazała błąd. Sprawdź również części programu, na które poprawka mogła wpłynąć. Zmiana zapisywania dat w raporcie może na przykład zmienić kolejność dokumentów w historii. Ten rodzaj sprawdzania pomaga wychwycić sytuację, w której naprawa jednej funkcji psuje inną. Zakres prób dobierzcie do zmiany. Drobna poprawka tekstu i zmiana zasad dostępu wymagają innego zakresu sprawdzenia.
Zachowaj wcześniejszy wynik, oznacz nową wersję i dołącz rezultat ponownej próby do powiązanej pracy. Jeśli aktualizujesz zatwierdzony proof ukończonego Goala, otwórz go ponownie zgodnie z działaniem Vairo. Cel „naprawić tworzenie raportu” kończy się po pokazaniu poprawnego działania. Gdy nie wykryliście usterki, ten podpunkt nie wymaga wymyślania dodatkowej pracy.',
          '["Google SRE, Testing for Reliability opisuje sprawdzanie połączonego systemu i dobór testów. Stripe, Webhooks wyjaśnia weryfikację wiadomości oraz obsługę powtórzeń i kolejności zdarzeń. OWASP, Input Validation Cheat Sheet wspiera dobór prób z niepoprawnymi danymi. Zapis wyników w Goals wynika z programu Vairo.","AWS, Load test your workload opisuje dobór obciążenia, warunków i pomiarów. Google SRE, Reliable Product Launches at Scale uwzględnia ograniczenia użycia przy przygotowaniu usługi. Przykład kosztu jest obliczeniem pomocniczym dla programu Vairo.","Google SRE, Postmortem Culture: Learning from Failure opisuje wyjaśnianie przyczyn i warunki sprzyjające zgłaszaniu błędów. Google SRE, Testing for Reliability wyjaśnia ponowne sprawdzanie działania po zmianach. Obsługa proof i ponownego otwarcia Goala wynika z zasad Vairo."]'::jsonb, null,
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
  values (v_point, 'behavior', 'Sprawdź wynik działania i reakcję na problemy',
          null, false,
          null, null, array['saas-core.result', 'saas-access.rules', 'saas-access.data']::text[], 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Zapisz wersję, zakres prób, oczekiwane i uzyskane wyniki oraz wykryte problemy.', null, null,
          false, 'execution.saas-check.behavior.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'load', 'Sprawdź obciążenie i koszt korzystania',
          null, false,
          null, null, array['saas-core.result']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Zapisz warunki użycia, wynik próby obciążenia i oszacowanie kosztu.', null, null,
          false, 'execution.saas-check.load.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'fix', 'Popraw problem i sprawdź zmianę',
          'Brak usterki nie tworzy obowiązku poprawki.', true,
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
  values (v_subpoint, 'open', 'action',
          'Jeśli coś blokuje użycie, popraw to w trackerze i sprawdź zmianę.', null, null,
          false, 'execution.saas-check.fix.open',
          '{"href":"/app/goals","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['behavior', 'load', 'fix']);

  -- ── punkt 4: Przygotuj program do utrzymania i aktualizacji
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-keep', 'Przygotuj program do utrzymania i aktualizacji', null,
          null, '4.1. Uruchom wersję, którą można udostępnić i poprawiać
Uruchom przygotowaną wersję w miejscu, z którego będą mogli korzystać pierwsi odbiorcy. Dostęp podczas przygotowań możesz ograniczyć do zespołu. Sprawdź główną czynność właśnie tam, ponieważ ustawienia różniące się od tych na komputerze twórcy mogą zmienić działanie programu. Jeśli budujesz na gotowej platformie, wykorzystaj jej sposób publikowania i sprawdź opublikowaną wersję.
Oddziel dane używane do prób od danych przyszłych odbiorców. Tak samo rozdziel ustawienia testowych i działających usług, szczególnie płatności. Połączenie z programem powinno być szyfrowane, zwykle przez HTTPS. Prywatne klucze do usług przechowuj w przeznaczonych do tego ustawieniach dostawcy lub innym odpowiednio zabezpieczonym miejscu. Klucz umieszczony w kodzie przesyłanym do przeglądarki może zostać odczytany przez użytkownika. Do Vairo dodaj informację, gdzie zarządza się dostępem, bez kopiowania sekretów.
Zachowaj kod oraz informacje o wersjach potrzebnych składników programu. Repozytorium, np. w GitHub, przechowuje kod i historię jego zmian. Sam kod może jednak nie wystarczyć do ponownego uruchomienia, jeśli zabraknie właściwych ustawień albo informacji o używanych bibliotekach. Przy gotowej platformie wykorzystaj jej historię wersji lub dostępny eksport. Z wykonawcą uzgodnij, co pozwoli odtworzyć waszą aplikację i jakie ograniczenia ma wybrana usługa.
Przeprowadźcie aktualizację przygotowanej wersji, a następnie sprawdźcie główne działanie. Jeżeli kilka osób zmienia program, uzgodnijcie, kto składa i publikuje daną wersję. Pozostali powinni wiedzieć, co weszło do tej aktualizacji i jakie próby trzeba powtórzyć. Zachowany zapis zmiany ułatwi też powrót do niej przy wyjaśnianiu późniejszej usterki.
Sprawdźcie, jak dowiecie się o błędzie i gdzie można znaleźć jego zapis. Taki zapis, nazywany logiem, powinien pomóc rozpoznać czynność i moment problemu. Wywołajcie bezpieczny błąd testowy i odszukajcie go. Zapewnijcie również możliwość stwierdzenia, że użytkownik ukończył główne działanie, np. utworzył raport. Ta informacja przyda się w MVP Stage. Ograniczcie zapisywane informacje do potrzebnych; hasła i prywatne materiały użytkowników nie powinny trafiać do logów ani dowodów.
Jako proof wykorzystaj adres i oznaczenie wersji, zapis udanej aktualizacji oraz istniejące materiały potrzebne do jej odtworzenia. Dołącz wynik sprawdzenia błędu i głównej czynności. Osoba odbierająca pracę powinna wiedzieć, gdzie program działa i gdzie szukać informacji, gdy przestanie działać poprawnie.
4.2. Sprawdź odzyskanie działania i potrzebnych danych
Przećwicz sytuację, w której aktualizacja uniemożliwia główne działanie programu. Z wykonawcą wybierz sposób przywrócenia usługi. Może to być powrót do poprzedniej wersji albo wprowadzenie przygotowanej poprawki. Dobierzcie warunki próby tak, żeby nie uszkodzić danych odbiorców. Możecie wykorzystać oddzielną wersję testową lub próbną aplikację u wybranego dostawcy.
Zapytaj, czy aktualizacja zmienia również sposób zapisania danych. Starsza wersja programu może nie rozumieć ich nowej postaci. Dlatego powrót do wcześniejszego kodu nie zawsze przywraca działanie całej usługi. Osoba techniczna powinna uwzględnić to w procedurze i sprawdzić ją razem z danymi. W proof zachowaj informację, dla jakiej aktualizacji i konfiguracji wykonano próbę.
Jeżeli program przechowuje materiały użytkownika potrzebne do dalszej pracy, sprawdźcie ich odtworzenie z kopii. Przywróćcie próbne dane w osobnym miejscu i otwórzcie je w programie. Zobaczcie, czy można wykonać z nimi potrzebną czynność. Komunikat dostawcy o udanej kopii nie pokazuje jeszcze, czy zespół potrafi z niej odzyskać użyteczne dane. Gdy aplikacja przetwarza informacje tylko chwilowo, skupcie się na odzyskaniu działania i potrzebnych ustawień.
Zapiszcie, z jakiego momentu pochodzą odzyskane dane i ile trwała próba. Przykładowo, kopia wykonana poprzedniego wieczoru może nie zawierać dzisiejszej pracy. Ustalcie, czy taki zakres odzyskania wystarczy dla pierwszego użycia produktu. Jeśli nie, zmieńcie sposób wykonywania kopii lub odzyskiwania. Korzystając z gotowej platformy, sprawdźcie możliwości dostępne w waszym pakiecie i przećwiczcie odpowiednią procedurę.
Zachowaj krótki opis wykonanych kroków oraz wynik. Możesz podpiąć instrukcję dostawcy i dopisać tylko ustawienia potrzebne dla waszej aplikacji. W zespole sprawdźcie, czy osoba, która ma reagować na awarię, ma potrzebny dostęp i rozumie tę instrukcję. Goal testowy może zakończyć się wynikiem negatywnym, ale przed potwierdzeniem gotowości wersji potrzebujecie skutecznej próby odzyskania.',
          '["The Twelve-Factor App, Codebase, Dependencies i Config opisują wersjonowanie, zależności oraz oddzielenie konfiguracji. OWASP, Logging Cheat Sheet wyjaśnia zapisywanie zdarzeń i ochronę informacji w logach. Microsoft, Safe deployment practices opisuje sprawdzanie wprowadzanych zmian. Wariant dla gotowej platformy dopasowano do sposobu budowy produktu.","Microsoft, Safe deployment practices opisuje odzyskanie działania po aktualizacji, także przy zmianach danych. AWS, Perform periodic recovery of the data to verify backup integrity and processes wyjaśnia sprawdzanie odtworzonych danych, czasu odzyskania i momentu, do którego można wrócić."]'::jsonb, null,
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
  values (v_point, 'release', 'Uruchom wersję, którą można udostępnić i poprawiać',
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
  values (v_subpoint, 'open', 'action',
          'Wskaż adres i wersję, materiały do odtworzenia oraz udaną aktualizację.', null, null,
          false, 'execution.saas-keep.release.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'recover', 'Sprawdź odzyskanie działania i potrzebnych danych',
          null, false,
          null, null, array['saas-access.data', 'saas-keep.release']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Zapisz sposób odzyskania i wynik wykonanej próby.', null, null,
          false, 'execution.saas-keep.recover.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['release', 'recover']);

  -- ── punkt 5: Potwierdź gotowość pierwszej wersji
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'saas-ready', 'Potwierdź gotowość pierwszej wersji', null,
          null, '5.1. Potwierdź gotowość wskazanej wersji
Wskaż konkretną wersję, którą przygotowaliście do pierwszego użycia. Podepnij dowody z wcześniejszych podpunktów i sprawdź, czy nadal jej dotyczą. Jeżeli po próbie zmieniono sposób zapisywania raportu, wcześniejszy wynik może wymagać uzupełnienia. Poproś osobę odpowiedzialną za zmianę o wskazanie, co trzeba ponownie sprawdzić. Materiały zachowujące ważność mogą zostać wykorzystane ponownie.
Przejrzyjcie pozostałe problemy pod kątem planowanego użycia. Brak dodatkowego koloru wykresu może poczekać. Błędny wynik raportu albo możliwość odczytania cudzych danych uniemożliwiają uznanie odpowiedniej funkcji za gotową. Pytaj o skutek dla odbiorcy i o dowód poprawnego działania. Sama informacja, że wykonawca skończył kodowanie, nie rozstrzyga tych pytań.
Uwzględnijcie warunki, dla których wykonano próby. Jeśli sprawdziliście użycie przez małą grupę, potwierdzenie dotyczy właśnie takiego początku. Przygotowane ograniczenia powinny pomagać utrzymać te warunki. Zespół powinien też wiedzieć, jak zauważy problem oraz jak przywróci działanie. Wykorzystajcie wyniki podpunktów 3.2, 4.1 i 4.2.
Osoba zbierająca dowody korzysta z ocen wykonawców odpowiedzialnych za poszczególne części. Przy sprawach wymagających specjalistycznej wiedzy oprzyj decyzję na właściwym sprawdzeniu. Jeśli pozostaje przeszkoda, wskaż ją przy powiązanej pracy i pozostaw potwierdzenie gotowości puste. Konkretna informacja, np. „nie wykonano ponownej próby po zmianie dostępu do plików”, pozwala od razu ustalić następne działanie.
Gdy wskazana wersja spełnia warunki pierwszego użycia, wybierz „Wersja gotowa do pierwszego użycia”. Ten zapis potwierdza wynik kategorii SaaS. Zamknięcie całego Execution odbywa się przez część General po ukończeniu potrzebnych kategorii. Udostępnianie produktu odbiorcom i zbieranie wyników ich korzystania poprowadzisz dalej w MVP Stage, wykorzystując ten sam tracker i zgromadzone materiały.',
          '["Google SRE, Reliable Product Launches at Scale opisuje dopasowanie oceny gotowości do danej usługi i skupienie na sprawach wpływających na jej uruchomienie. Warunki potwierdzenia, ponowne użycie dowodów i przejście między etapami wynikają z programu oraz guidelines CTO Vairo."]'::jsonb, null,
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
  values (v_point, 'confirm', 'Potwierdź gotowość wskazanej wersji',
          null, false,
          null, null, array['saas-core.result', 'saas-access.rules', 'saas-access.data', 'saas-check.behavior', 'saas-check.load', 'saas-keep.release', 'saas-keep.recover']::text[], 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'version', 'short_text',
          'Którą wersję potwierdzasz?', 'Wpisz oznaczenie wersji, której dotyczą wcześniejsze dowody.', null,
          true, 'execution.saas-ready.confirm.version',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ready', 'select',
          'Czy ta wersja jest gotowa do pierwszego użycia?', 'Zostaw puste, dopóki wcześniejsze wyniki nie są gotowe. Nie ma drugiej opcji.', null,
          true, 'execution.saas-ready.confirm.ready',
          '{"options":[{"value":"ready","label":"Wersja gotowa do pierwszego użycia"}]}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['version', 'ready']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['confirm']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['saas-core', 'saas-access', 'saas-check', 'saas-keep', 'saas-ready']);

  -- ═══ kategoria: Hardware ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'hardware', 'Hardware', 'Od wymagań i bezpieczeństwa, przez egzemplarz, po gotowość do pierwszego użycia.',
          false, 3)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Ustal wymagania pierwszej wersji
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hw-spec', 'Ustal wymagania pierwszej wersji', null,
          null, '1.1. Ustal, co sprawdzisz przed pierwszym użyciem
Otwórz opis produktu z poprzedniego etapu. Wyobraź sobie jego pierwsze użycie: kto go bierze do ręki, co chce zrobić i w jakich warunkach będzie pracować. Z tego opisu powinno wynikać, co konstrukcja musi umożliwiać. Uchwyt przeznaczony do spokojnej pracy przy biurku może wymagać innych rozwiązań niż uchwyt używany na poruszającym się pojeździe. Podepnij istniejący opis i uzupełnij brakujące informacje w tym samym miejscu.
Każde ważne wymaganie zapisz tak, żeby dało się rozstrzygnąć, czy zostało spełnione. „Uchwyt jest mocny” pozostawia zbyt dużo miejsca na domysły. „Uchwyt utrzymuje 5 kg przez 30 minut bez zsuwania” wskazuje wynik, który można sprawdzić. To przykład sposobu zapisu. Odpowiednie obciążenie, czas i warunki próby muszą wynikać z przeznaczenia twojego produktu oraz wymagań jego bezpieczeństwa.
Przy wymaganiu dopisz, jak je sprawdzisz. Czasem wystarczy pomiar wymiaru, a czasem potrzebna będzie próba działania lub badanie wykonane przez specjalistę. Osoba przygotowująca konstrukcję i osoba wykonująca sprawdzenie powinny tak samo rozumieć oczekiwany wynik. Wyjaśnienie rozbieżności teraz pozwoli uniknąć wykonania części, którą później trzeba będzie zamówić ponownie.
Uwzględnij próby już przy planowaniu pierwszych egzemplarzy. Jeżeli badanie może uszkodzić część, ustal wcześniej, czy potrzebujesz osobnej próbki. Jeżeli kilka osób będzie korzystać z tego samego egzemplarza, uzgodnij kolejność. Dzięki temu pierwsze zamówienie obejmie to, czego potrzebujesz do uzyskania odpowiedzi, a przygotowanie jednej próby nie zatrzyma pozostałych prac.
1.2. Sprawdź, co jest potrzebne, żeby produkt był bezpieczny i spełniał przepisy
Ustal, jakie wymagania dotyczą właśnie twojego produktu i kraju, w którym zamierzasz go udostępnić. Znaczenie ma także jego przeznaczenie. Podobnie wyglądający przedmiot może podlegać innym wymaganiom, gdy służy do zabawy, pracy albo zastosowania medycznego. Zacznij od oficjalnych informacji dla danej grupy produktów. W Unii Europejskiej punktem startowym może być portal Your Europe.
Oznaczenie CE dotyczy tylko określonych grup produktów. Gdy jest wymagane, trzeba przejść właściwą ocenę zgodności, czyli sprawdzenie i udokumentowanie spełnienia odpowiednich wymagań. Kupienie części z CE nie potwierdza automatycznie zgodności całego produktu, który z niej zbudujesz. Brak obowiązku oznakowania CE również nie oznacza, że produkt nie podlega wymaganiom bezpieczeństwa.
Jeśli potrzebujesz pomocy, przekaż specjaliście opis zastosowania i dostępne materiały konstrukcyjne. Poproś o wskazanie, co trzeba uwzględnić w projekcie oraz jakie sprawdzenia będą potrzebne przed planowanym użyciem. Takie konkretne pytanie daje bardziej użyteczną odpowiedź niż ogólna prośba o „sprawdzenie produktu”.
W zespole ustal, kto zbierze tę odpowiedź i dopilnuje wprowadzenia potrzebnych zmian. Ta osoba może koordynować pracę, korzystając z wiedzy odpowiedniego specjalisty. Jeśli pracujesz sam, możesz zamówić taką konsultację na zewnątrz. Przydzielaj ocenę zagadnienia osobie, która potrafi je ocenić; wolny termin sam w sobie nie wystarcza.
Uzupełnij dokument z podpunktu 1.1 o ustalenia i ich źródło. Niewyjaśnioną sprawę opisz konkretnie, np. „Trzeba potwierdzić, czy wybrany materiał nadaje się do tego zastosowania”. Jeżeli odpowiedź może wymusić zmianę konstrukcji, wyjaśnij ją przed kosztownym zamówieniem. Ukończenie tego podpunktu oznacza rozpoznanie wymagań; potwierdzanie ich spełnienia następuje podczas dalszej pracy.',
          '["NASA, Technical Requirements Definition opisuje przełożenie sposobu użycia na sprawdzalne wymagania. NASA, Product Verification wyjaśnia dobór metod i zasobów potrzebnych do ich sprawdzenia.","Your Europe, CE marking wyjaśnia zakres oznakowania i odpowiedzialność za cały produkt. NASA, Technical Planning opisuje dopasowanie kompetencji i odpowiedzialności do pracy technicznej."]'::jsonb, null,
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
  values (v_point, 'checks', 'Ustal, co sprawdzisz przed pierwszym użyciem',
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
  values (v_subpoint, 'use', 'long_text',
          'Do czego służy pierwsza wersja, kto z niej korzysta i w jakich warunkach?', 'Jeśli masz już taki opis, wklej go albo wskaż plik.', null,
          true, 'execution.hw-spec.checks.use',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'requirements', 'files',
          'Dokument: co produkt musi robić, jaki wynik wystarczy i jak to sprawdzisz.', 'Przy wymaganiu, które może zużyć egzemplarz, uwzględnij dodatkowe sztuki.', null,
          true, 'execution.hw-spec.checks.requirements',
          '{"min_items":1}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['use', 'requirements']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'safety', 'Sprawdź, co jest potrzebne, żeby produkt był bezpieczny i spełniał przepisy',
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
  values (v_subpoint, 'rules', 'long_text',
          'Jakie przepisy, zabezpieczenia, badania i dokumenty dotyczą tego użycia?', 'Podaj źródło. Jeśli czegoś nie wiesz, zapisz, co trzeba wyjaśnić. To rozpoznanie wymagań, nie certyfikat.', null,
          true, 'execution.hw-spec.safety.rules',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['rules']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['checks', 'safety']);

  -- ── punkt 2: Sprawdź niepewny element przed budową całości
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hw-try', 'Sprawdź niepewny element przed budową całości', null,
          null, '2.1. Wykonaj wcześniejszą próbę, jeśli jej wynik może zmienić konstrukcję
Spójrz na projekt i wybierz niewiadomą, przez którą możesz później stracić najwięcej pracy. Może to być sposób łączenia części, którego wytrzymałości jeszcze nie znasz. Może też chodzić o materiał, który musi zachować swoje właściwości w przewidywanych warunkach. Wcześniejsza próba ma sens wtedy, gdy jej wynik pomoże wybrać dalszą konstrukcję. Jeśli masz już odpowiednie wyniki dla tego zastosowania, wykorzystaj je.
Przygotuj tylko taki fragment produktu, który pozwoli odpowiedzieć na wybrane pytanie. Do sprawdzenia połączenia mogą wystarczyć dwie próbki. Model pokazujący kształt może pomóc sprawdzić dopasowanie, ale wnioski o wytrzymałości wymagają odpowiedniego materiału i sposobu wykonania. Dobierz próbkę do tego, czego chcesz się dowiedzieć.
Goal typu „Wynik testu” może brzmieć: „Sprawdzić, czy wybrane połączenie spełnia wymaganie obciążenia z podpunktu 1.1”. Ustal osobę odpowiedzialną i termin uzyskania odpowiedzi. Jako oczekiwany proof wskaż zapis próby z wynikiem oraz wnioskiem. Dzięki temu już przed rozpoczęciem pracy wiadomo, czym ma się ona zakończyć.
Jeżeli pracuje nad tym kilka osób, rozdziel przygotowanie próbki, wykonanie badania i ocenę wyniku na zadania przy tym Goalu. W notatce wyjaśnij, co musi być gotowe przed rozpoczęciem kolejnego zadania. Przy małej próbie wykonywanej samodzielnie możesz poprowadzić całość w jednym Goalu. Szczegółowość podziału powinna pomagać wykonać pracę.
Po próbie zapisz, co badano, w jakich warunkach i co się wydarzyło. Wynik negatywny może zakończyć Goal dotyczący wykonania próby, jeśli uzyskaliście potrzebną odpowiedź. Następna decyzja może wtedy polegać na zmianie połączenia albo materiału. Kolejną próbę podejmuj z konkretnym pytaniem, na które poprzedni wynik jeszcze nie odpowiedział.',
          '["TWI, What is Prototyping? opisuje dobór prototypu do pytania i etapowe sprawdzanie konstrukcji. Michael Seibel, The Scientific Method for Startups przedstawia pracę przez sprawdzanie założeń i wyciąganie wniosków. Przykład Goala jest zastosowaniem tych zasad w Vairo."]'::jsonb, null,
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
  values (v_point, 'probe', 'Wykonaj wcześniejszą próbę, jeśli jej wynik może zmienić konstrukcję',
          null, true,
          null, null, array['hw-spec.checks', 'hw-spec.safety']::text[], 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Cel typu „Wynik testu”: wersja, warunki, wynik i decyzja.', null, null,
          false, 'execution.hw-try.probe.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['probe']);

  -- ── punkt 3: Wykonaj lub zamów pierwszą wersję produktu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hw-build', 'Wykonaj lub zamów pierwszą wersję produktu', null,
          null, '3.1. Wykonaj egzemplarz, który można sprawdzić
Podepnij wymagania i potrzebne pliki do Goala typu „Wynik budowy”, opisującego egzemplarz, który ma powstać. Wskaż wersję, której dotyczy praca. Określ także, co pokaże wykonanie tego Goala. Zdjęcie może potwierdzić powstanie przedmiotu, a film lub zapis odbioru może dodatkowo pokazać jego podstawowe działanie. Dokładne sprawdzenie wymagań wykonasz w podpunkcie 4.1.
Podziel budowę na wyniki, które można przekazać następnej osobie. Przy prostym uchwycie jednym zadaniem może być przygotowanie rysunku z wymiarami mocowania. Kolejnym będzie wykonanie części na podstawie tego rysunku. Następne zadanie obejmie złożenie uchwytu i sprawdzenie dopasowania. Taki podział pokazuje, co ma powstać i na co czeka kolejna osoba.
Zadanie jest wystarczająco małe, gdy osoba odpowiedzialna rozumie jego zakres i potrafi wskazać moment zakończenia. Podziel je dalej, jeśli ukrywa kilka przekazań pracy albo wynik będzie przez długi czas niewidoczny. Drobne czynności montażowe mogą pozostać w instrukcji przy zadaniu. Osobny wpis przydaje się wtedy, gdy pomaga przypisać odpowiedzialność lub śledzić ważny wynik.
Przydział uzgodnij z wykonawcą, uwzględniając jego umiejętności i dostępny czas. Właściciel Goala dopilnowuje powstania całego egzemplarza, a poszczególne zadania mogą wykonywać różne osoby. Przy zleceniu zewnętrznym osoba z twojego zespołu pilnuje ustaleń i odbiera wynik. Przed zamówieniem uzgodnij z wykonawcą, według jakich plików pracuje i co dokładnie ma przekazać.
Jeżeli części powstają równolegle, wcześniej uzgodnij miejsca, w których mają się ze sobą połączyć. Gdy jedna osoba projektuje obudowę, a druga umieszczany w niej element, obie potrzebują zgodnych wymiarów i położenia mocowań. Zmianę tych ustaleń przekaż drugiej osobie przed dalszą pracą.
Przy terminie uwzględnij oczekiwanie na wykonawcę lub dostawę. Jeśli bez zamówionej części nie można złożyć produktu, jej termin wpływa na dalszą pracę. Pozostałe zadania prowadź równolegle tam, gdzie mają już potrzebne dane. Gdy kilka prac czeka na jednego specjalistę albo jedno stanowisko, ustal kolejność zamiast przypisywać wszystkim ten sam termin.
3.2. Zachowaj informacje potrzebne do wykonania tej wersji
Zbieraj dokumentację podczas budowy. Po wykonaniu egzemplarza powinna pokazywać, jak powstała właśnie ta wersja. Jeśli w warsztacie zmieniliście wymiar albo zamieniliście część, uwzględnij to w plikach. Rysunek wcześniejszego pomysłu nie wystarczy do powtórzenia gotowej konstrukcji.
Zachowaj informacje, które pozwolą ponownie dobrać materiał i zamówić właściwe części. Zapis „mały silnik” może prowadzić do kupienia zupełnie innego elementu. Oznaczenie konkretnego modelu i liczba sztuk pozwolą odtworzyć wybór. Taki spis elementów i materiałów często nazywa się BOM. Możesz prowadzić go w zwykłym dokumencie, który już wykorzystujesz przy budowie.
Oznacz wersję plików i powiąż ją z egzemplarzem. Gdy przekazujesz wykonawcy nowy rysunek, jasno wskaż, że zastępuje poprzedni, i potwierdź, czy wcześniejsza część została już wykonana. To prosty sposób na uniknięcie sytuacji, w której dwie osoby pracują według różnych wymiarów. W Goalu umieść odnośnik do właściwych materiałów zamiast tworzyć ich kolejne kopie.
Jeszcze przed zamówieniem porozmawiaj z wykonawcą o tym, jak powstanie potrzebna liczba egzemplarzy. Zapytaj, czy wybrany kształt i materiał nadają się do jego sposobu produkcji. Czasem drobna zmiana konstrukcji pozwala uprościć montaż lub uniknąć drogiego narzędzia. To podstawa projektowania z myślą o wytwarzaniu, określanego skrótem DFM. W tym etapie dopasowujesz wykonanie do pierwszego potrzebnego użycia.
Sprawdź dostępność części, od których zależy dalsza budowa, i zachowaj ofertę wykonawcy. Jeśli budujesz sam, wykorzystaj koszty i doświadczenia z pierwszego egzemplarza. Oddziel koszt jednorazowego przygotowania od kosztu następnej sztuki, jeśli występuje taka różnica. Kiedy montaż wymaga nieopisanej poprawki lub długiego dopasowywania, dopisz tę informację przy konstrukcji. Pozwoli to poprawić projekt albo przygotować wykonawcę przed kolejnym zamówieniem.',
          '["NASA, Technical Planning opisuje wyniki prac, ich kolejność i potrzebne zasoby. NASA, Interface Management wyjaśnia koordynację części tworzonych przez różne osoby. Atlassian, Roles and Responsibilities wspiera rozróżnienie osoby odpowiedzialnej i osób współpracujących. Podział przykładowego Goala na zadania dopasowano do Vairo.","NASA, Configuration Management opisuje identyfikację wersji i kontrolowanie zmian dokumentacji. TWI, What is Design for Manufacturing? wyjaśnia, jak decyzje konstrukcyjne wpływają na wykonanie i montaż."]'::jsonb, null,
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
  values (v_point, 'unit', 'Wykonaj egzemplarz, który można sprawdzić',
          null, false,
          null, null, array['hw-spec.checks', 'hw-spec.safety']::text[], 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Podepnij cel z oznaczeniem wersji i dowodem, że egzemplarz powstał.', null, null,
          false, 'execution.hw-build.unit.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'repeat', 'Zachowaj informacje potrzebne do wykonania tej wersji',
          null, false,
          null, null, array['hw-spec.checks', 'hw-spec.safety']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'how', 'long_text',
          'Jak powstaje ta wersja: dostępność, sposób i koszt pierwszych egzemplarzy?', 'Dołącz rysunki albo projekty, jeśli są potrzebne do powtórzenia.', null,
          true, 'execution.hw-build.repeat.how',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'files', 'files',
          'Pliki tej wersji.', null, null,
          false, 'execution.hw-build.repeat.files',
          '{"min_items":0}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['how', 'files']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['unit', 'repeat']);

  -- ── punkt 4: Sprawdź produkt i popraw wykryte problemy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hw-test', 'Sprawdź produkt i popraw wykryte problemy', null,
          null, '4.1. Sprawdź pierwszą wersję według ustalonych wymagań
Otwórz wymagania z punktu 1 i wykorzystaj je jako podstawę prób. Jeden Goal może obejmować cały potrzebny zestaw sprawdzeń. Możesz wydzielić osobne zadania, gdy badania wykonują różne osoby lub wymagają osobnego przygotowania. Wspólnym wynikiem ma być odpowiedź, które wymagania spełnia wskazana wersja i co nadal wymaga pracy.
Przed próbą upewnij się, że osoba ją wykonująca ma właściwy egzemplarz i aktualne wymagania. Przy kilku sztukach odróżniaj numer egzemplarza od wersji konstrukcji. Dwie sztuki wykonane według tego samego projektu mogą mieć inną historię prób. Zapis „v2, egzemplarz 3” pozwoli później zrozumieć, którego przedmiotu dotyczy wynik.
Przy każdym sprawdzeniu zestaw oczekiwany wynik z uzyskanym. Dopisz warunki, które mogły na niego wpłynąć. Jeśli test dotyczył czasu pracy urządzenia, podaj także sposób, w jaki było używane. Materiał dowodowy dobierz do pytania: zdjęcie może pokazać pęknięcie, ale pomiar czasu wymaga zapisu uzyskanego wyniku. Zachowaj dane od razu przy wykonywaniu próby.
W zespole uzgodnij korzystanie ze wspólnego egzemplarza. Osoba przekazująca go dalej powinna powiedzieć, jakie próby przeszedł i czy zauważyła uszkodzenia. Kolejność oraz użycie osobnych próbek dopasujcie do przyjętej metody badania. Badania wymagające odpowiedniego sprzętu lub kwalifikacji powierz osobie albo placówce, która je posiada.
Jeśli ktoś inny może przejrzeć wyniki, poproś go o sprawdzenie ich zgodności z wymaganiami. Przy pracy samodzielnej wróć do zapisanych kryteriów, zanim uznasz próbę za udaną. Ukończony Goal typu „Wynik testu” potwierdza wykonanie badania i zapisanie odpowiedzi. Niespełnione wymaganie nadal wymaga decyzji i odpowiedniego działania przed potwierdzeniem gotowości produktu.
4.2. Usuń problem i sprawdź poprawkę
Zacznij od ustalenia, co dokładnie się wydarzyło. Wykorzystaj zapis próby i sprawdź, w którym momencie pojawił się problem. Pęknięcie części jest obserwacją. Stwierdzenie, że przyczyną był niewłaściwy materiał, wymaga sprawdzenia, bo znaczenie mógł mieć również sposób wykonania albo montażu. Jeśli przyczyna pozostaje nieznana, najbliższym zadaniem będzie jej wyjaśnienie.
Rozmowę z zespołem oprzyj na tym, co można sprawdzić. Zapytaj, z jakiego rysunku korzystano i jakie informacje były dostępne podczas pracy. Podziękuj za szybkie zgłoszenie błędu. Osoba, która obawia się reakcji zespołu, może zwlekać z przekazaniem problemu, a pozostali będą w tym czasie pracować na błędnym założeniu. Po znalezieniu przyczyny uzgodnij konkretną zmianę. Jeśli pomyłkę spowodował stary rysunek, popraw także sposób przekazywania aktualnych plików.
Opisz w powiązanym Goalu, co zmieniacie i jaki wynik ma potwierdzić skuteczność poprawki. Zadanie polegające na zmianie rysunku może zostać wykonane wcześniej, ale Goal dotyczący usunięcia usterki potrzebuje jeszcze sprawdzenia nowej konstrukcji. Przydziel te czynności zgodnie z umiejętnościami wykonawców. Osoba koordynująca poprawkę pilnuje, żeby praca dotarła do tego końcowego sprawdzenia.
Gdy to możliwe, sprawdzaj wpływ jednej zmiany naraz. Jeśli zmieniacie kilka rzeczy jednocześnie, zachowaj informację o wszystkich zmianach, żeby dało się później wyjaśnić uzyskany wynik. Oznacz nową wersję i pozostaw dostęp do wcześniejszych wyników.
Oceń również, na co jeszcze wpłynęła poprawka. Grubsza część może lepiej przenosić obciążenie, ale przestać mieścić się w miejscu montażu. Powtórz sprawdzenia dotyczące zmienionego elementu i tych części produktu, na które zmiana oddziałuje. Zakres ponownych badań uzgodnij z osobą, która potrafi ocenić te zależności. Dołącz wynik poprawki do istniejącej pracy w Vairo.',
          '["NASA, Product Verification opisuje sprawdzanie wymagań i przygotowanie badań. NASA, Configuration Management wyjaśnia identyfikację badanej wersji. Sposób zapisania wyniku w Goalu wynika z zasad Vairo.","John Lunney i Sue Lueder, Postmortem Culture: Learning from Failure opisuje analizowanie przyczyn i tworzenie warunków do zgłaszania problemów; te zasady pracy zespołu zastosowano tutaj do budowy sprzętu. NASA, Configuration Management opisuje ocenę wpływu zmian i ich sprawdzanie."]'::jsonb, null,
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
  values (v_point, 'trial', 'Sprawdź pierwszą wersję według ustalonych wymagań',
          null, false,
          null, null, array['hw-build.unit']::text[], 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'open', 'action',
          'Dowód zawiera wyniki sprawdzeń wymaganych dla pierwszego użycia.', null, null,
          false, 'execution.hw-test.trial.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'fix', 'Usuń problem i sprawdź poprawkę',
          null, true,
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
  values (v_subpoint, 'open', 'action',
          'Jeśli próba wykryła problem, popraw go i zapisz nowe sprawdzenie.', null, null,
          false, 'execution.hw-test.fix.open',
          '{"href":"/app/goals","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['trial', 'fix']);

  -- ── punkt 5: Przygotuj produkt do pierwszego użycia
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hw-ready', 'Przygotuj produkt do pierwszego użycia', null,
          null, '5.1. Przygotuj potrzebny egzemplarz i materiały do użycia
Przygotuj liczbę egzemplarzy wynikającą z pierwszego planowanego użycia. Może to być jedna instalacja albo kilka sztuk przekazywanych odbiorcom. Wykorzystaj dokumentację sprawdzonej wersji. Przy kolejnych egzemplarzach zwróć uwagę na to, czy wykonawca zachował uzgodniony materiał i sposób wykonania. Zamiennik proponowany podczas montażu może wymagać ponownego sprawdzenia konstrukcji.
Oddziel wyniki dotyczące projektu od kontroli przygotowanej sztuki. Sprawdzenie konstrukcji pomaga ustalić, czy projekt spełnia wymagania. Odbiór konkretnego egzemplarza pozwala wychwycić błąd jego wykonania, np. brak elementu lub niewłaściwy montaż. Zakres takiej kontroli powinien odpowiadać twojemu produktowi i wymaganiom z punktu 1. Zachowaj wynik przy egzemplarzu, którego dotyczy.
Do pierwszego użycia wybierz sztukę w odpowiednim stanie. Sprawdź jej historię prób, szczególnie gdy testy mogły ją osłabić lub uszkodzić. Jeśli różne osoby wykonują montaż i kontrolę, przekaż im te same aktualne materiały. Przy pracy samodzielnej możesz wykonać obie czynności, korzystając z zapisanych wymagań i potrzebnej pomocy specjalisty.
Przygotuj instrukcję na podstawie tego, co użytkownik będzie robić. Wyjaśnij, jak przygotować produkt i jak poprawnie z niego korzystać. Opisz ograniczenia oraz ostrzeżenia, które wynikają z jego konstrukcji. Jeśli sposób obsługi trudno pokazać słowami, dodaj zdjęcie lub rysunek. Jeżeli produkt wymaga instalacji, przekaż odpowiednie informacje także osobie, która ją wykona.
Dołącz dokumenty i oznaczenia potrzebne dla tego produktu i planowanego użycia, zgodnie z ustaleniami z podpunktu 1.2. Materiały powinny odpowiadać przygotowanej wersji. Wykorzystaj istniejące wyniki i pliki. Jeśli produkt będzie transportowany, zadbaj również o zabezpieczenie go na tę drogę, tak aby dotarł w stanie umożliwiającym przewidziane użycie.
5.2. Potwierdź gotowość wskazanej wersji
Wskaż dokładnie, która wersja jest gotowa do ustalonego użycia. Podepnij jej wyniki sprawdzeń oraz materiały przygotowane w podpunkcie 5.1. Osoba przeglądająca ten zapis powinna móc powiązać gotowy egzemplarz z dokumentacją i zrozumieć, na jakiej podstawie uznaliście go za gotowy.
Wróć do wymagań z punktu 1. Sprawdź, czy macie odpowiedź dla każdego z nich i czy pozostał problem, który uniemożliwia przewidziane użycie. Przy pracy zespołowej osoba zbierająca wyniki korzysta z ocen osób odpowiedzialnych za poszczególne obszary. W kwestiach wymagających specjalistycznej wiedzy oprzyj decyzję na właściwej ocenie lub badaniu.
Jeżeli ktoś zgłasza wątpliwość, wyjaśnij, jakiego wymagania dotyczy i czego brakuje do jej rozstrzygnięcia. Na przykład informacja „brakuje wyniku badania po zmianie materiału” wskazuje konkretną dalszą pracę. Dopóki wymagania dla planowanego użycia pozostają niespełnione, pozostaw potwierdzenie puste i zapisz przeszkodę przy odpowiedniej pracy.
Pomysły na dodatkowe funkcje mogą zostać w notatkach na później. Gotowość oceniasz względem ustalonego zastosowania i jego wymagań. Jeśli chcesz zmienić samo zastosowanie, najpierw sprawdź, jakie wymagania i badania wynikają z tej zmiany. Samo przepisanie opisu nie rozwiązuje problemu konstrukcji.
Gdy macie potrzebne potwierdzenia i nie ma przeszkód blokujących wskazane użycie, zaznacz gotowość wersji. Vairo zbiera zapis tej decyzji i powiązane dowody. Ocena techniczna oraz odpowiedzialność za dopuszczenie produktu do użycia pozostają po stronie właściwych osób. Zachowaj powiązanie z tą wersją, żeby później wiedzieć, jaki produkt trafił do pierwszego użycia i do czego odnoszą się otrzymane uwagi.',
          '["NASA, Product Transition opisuje przekazywanie sprawdzonego produktu wraz z dokumentacją i przygotowanie do jego użycia. Your Europe, CE marking wyjaśnia obowiązki dotyczące właściwej dokumentacji i oznakowania produktów objętych CE.","NASA, Product Transition opisuje przekazanie produktu na podstawie jego stanu i dokumentacji. NASA, Product Verification wyjaśnia sprawdzanie spełnienia wymagań. Sposób potwierdzania gotowości i podpinania dowodów wynika z ustalonego działania Vairo."]'::jsonb, null,
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
  values (v_point, 'pack', 'Przygotuj potrzebny egzemplarz i materiały do użycia',
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
  values (v_subpoint, 'control', 'long_text',
          'Które egzemplarze idą do użycia i jakie instrukcje oraz dokumenty im towarzyszą?', 'Możesz wskazać materiały już użyte przy budowie i próbie, jeśli dotyczą tej wersji.', null,
          true, 'execution.hw-ready.pack.control',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['control']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, skip_when, depends_on, position)
  values (v_point, 'confirm', 'Potwierdź gotowość wskazanej wersji',
          null, false,
          null, null, array['hw-spec.checks', 'hw-spec.safety', 'hw-build.unit', 'hw-build.repeat', 'hw-test.trial', 'hw-ready.pack']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'version', 'short_text',
          'Którą wersję potwierdzasz?', null, null,
          true, 'execution.hw-ready.confirm.version',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ready', 'select',
          'Czy ta wersja jest gotowa do ustalonego użycia?', 'Pole jest puste, dopóki go nie potwierdzisz.', null,
          true, 'execution.hw-ready.confirm.ready',
          '{"options":[{"value":"ready","label":"Wersja gotowa do ustalonego użycia"}]}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['version', 'ready']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['pack', 'confirm']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['hw-spec', 'hw-try', 'hw-build', 'hw-test', 'hw-ready']);

  -- ═══ kategoria: B2B ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2b', 'B2B', 'Przygotuj przekazanie firmie i przećwicz drogę od startu do odebranego wyniku.',
          false, 4)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przygotuj rozwiązanie do użycia w firmie
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-hand', 'Przygotuj rozwiązanie do użycia w firmie', null,
          null, '1.1. Przygotuj pierwsze przekazanie firmie
Otwórz ustalenia z Preparation i wybierz pierwszy sposób użycia, do którego przygotowujesz produkt. Sięgnij po zapisane role oraz wymagania rozpoczęcia pracy. Na ich podstawie przygotuj to, co faktycznie przekażesz firmie. Może wystarczyć krótka wiadomość z adresem programu i sposobem przekazania danych. Przy urządzeniu może być potrzebna instrukcja dla osoby montującej je w miejscu pracy.
Oddziel w tej wiadomości czynności twojego zespołu od czynności klienta. Jeśli firma ma dostarczyć plik, pokaż, jak go przygotować i gdzie przekazać. Jeśli ktoś musi przygotować stanowisko, daj mu potrzebne informacje przed dostawą. Gotowa instrukcja powinna pomóc wykonać czynność bez zgadywania i szukania odpowiedzi w dawnych wiadomościach.
Zwróć uwagę na przekazanie wyniku. Przykładowo pracownik może zebrać dane i przygotować zestawienie, które później otrzyma kierownik. Sprawdź, w jakiej postaci kierownik potrzebuje tego zestawienia. Przygotuj potrzebny dokument lub sposób udostępnienia, korzystając z funkcji budowanych już w SaaS albo z materiałów Hardware. W małej firmie te zadania może wykonywać jedna osoba.
Jeżeli firma wskazała wcześniej dokument lub zgodę potrzebną do rozpoczęcia, przygotuj swoją część. Wskaż, co jeszcze wymaga decyzji klienta. Własny opis nie zastępuje zgody firmy. Przy próbie wewnętrznej można odwzorować takie przekazanie, a sprawdzenie warunków konkretnego klienta pozostaje potrzebne przed rozpoczęciem współpracy.
W Goalu wskaż jeden wynik, np. „Przygotowane przekazanie zestawienia od pracownika do kierownika”. Właściciel pilnuje, żeby materiały pasowały do tej samej wersji produktu. Dodatkowe zadania przydają się, gdy instrukcję i element produktu przygotowują różne osoby. Dowodem są gotowe materiały, które można wykorzystać przy pierwszej współpracy.',
          '["GOV.UK, Solve a whole problem for users (dopasowanie całego przebiegu do pracy odbiorcy); Paul Graham, Do Things that Don’t Scale (osobista pomoc pierwszym firmom i prosty sposób rozpoczęcia)."]'::jsonb, null,
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
  values (v_point, 'pack', 'Przygotuj pierwsze przekazanie firmie',
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
  values (v_subpoint, 'open', 'action',
          'Cel z gotowymi materiałami rozpoczęcia i przekazania wyniku.', null, null,
          false, 'execution.b2b-hand.pack.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['pack']);

  -- ── punkt 2: Sprawdź użycie rozwiązania w pracy firmy
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2b-try', 'Sprawdź użycie rozwiązania w pracy firmy', null,
          null, '2.1. Przećwicz przebieg od rozpoczęcia do odebrania wyniku
Użyj jednego konkretnego przykładu z wcześniejszych rozmów. Przy narzędziu do raportów może to być przygotowanie tygodniowego zestawienia przez pracownika i odebranie go przez kierownika. Przy usłudze wykonaj próbny zakres pracy i przygotuj rezultat, który firma miałaby odebrać. Wymagana jest działająca wersja; sam opis przyszłego przebiegu nie pokazuje, czy da się przez niego przejść.
Podziel próbę według tego, kto robi kolejną rzecz. Jedna osoba może odgrywać kilka ról, jeśli pracujesz sam. Zatrzymaj się przy każdym przekazaniu i sprawdź, czy następny odbiorca ma potrzebny materiał oraz rozumie, co ma z nim zrobić. Częsty problem to wynik, który powstał, ale trafił do niewłaściwej osoby albo nie nadaje się do dalszego użycia.
Możesz zaprosić przedstawiciela firmy. Daj mu zadanie odpowiadające jego pracy i obserwuj, w którym miejscu potrzebuje wyjaśnienia. Gdy udział klienta nie jest teraz możliwy, wykonaj próbę wewnętrzną i tak ją opisz. Taki zapis pokazuje sprawdzenie przygotowanego przebiegu. Dopasowanie do warunków konkretnej firmy potwierdzisz podczas współpracy.
Uwzględnij pomoc, którą zamierzasz zapewniać na początku. Jeśli każdej firmie osobiście ustawiasz rozwiązanie, wykonaj również ten fragment próby. Zachowaj przydatne ustawienia lub instrukcję. Jeżeli praca przechodzi między twoimi współpracownikami, uzgodnij, kto odbiera dany fragment i gdzie znajdzie wynik. Jedna osoba odpowiada za doprowadzenie całego Goala do końca.
W proof zapisz przykład, wersję i wynik. Zdanie „Pracownik przygotował zestawienie, ale kierownik nie mógł otworzyć pliku” wskazuje konkretną poprawkę. Po zmianie ponów potrzebny fragment. Negatywny wynik pozwala ukończyć Goal dotyczący wykonania próby; gotowość w 2.2 wymaga usunięcia przeszkód w ustalonym przebiegu.
2.2. Potwierdź gotowość do pierwszego użycia w firmie
Przejrzyj gotowe materiały i wynik próby dla wskazanej wersji. Sprawdź, czy firma może wykonać potrzebne przygotowania, czy pracownik otrzyma wynik i czy trafi on dalej tam, gdzie jest potrzebny. Korzystaj z istniejących plików. To potwierdzenie nie wymaga pisania kolejnego podsumowania całego projektu.
Uzgodnij z osobą prowadzącą próbę, czy pozostały przeszkody uniemożliwiające takie użycie. Brak materiałów startowych lub niewykonane przekazanie wyniku wymagają dokończenia. Pomysł na obsługę kolejnego działu może poczekać, jeśli obecna wersja ma służyć jednemu zespołowi. Zakres oceniaj zgodnie z wcześniejszymi ustaleniami.
Jeżeli po próbie zmieniła się wersja produktu albo sposób przekazania, ustal, co trzeba ponownie sprawdzić. Podepnij nowy wynik do tej samej pracy i zachowaj wcześniejszy zapis. Przy sprawach wymagających oceny technicznej skorzystaj z odpowiedniego wykonawcy. Wymagania właściwe dla produktu nadal obowiązują w pozostałych wybranych kategoriach.
Potwierdzenie dotyczy gotowości do pierwszego ustalonego użycia. Nie wymaga podpisanej umowy, płacącego klienta ani dowodu wzrostu sprzedaży. Próba wewnętrzna pozostaje oznaczona jako wewnętrzna. W MVP Stage będzie można sprawdzić, jak rozwiązanie działa w kolejnych warunkach u odbiorców i co trzeba poprawić.',
          '["GOV.UK, Using moderated usability testing (próba na konkretnym zadaniu i obserwowanie trudności uczestnika); GOV.UK, Provide a joined up experience across all channels (sprawdzanie przekazania pracy między osobami i sposobami kontaktu).","GOV.UK, How the beta phase works (stopniowe udostępnianie przygotowanej usługi i dalsze poprawki)."]'::jsonb, null,
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
  values (v_point, 'trial', 'Przećwicz przebieg od rozpoczęcia do odebrania wyniku',
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
  values (v_subpoint, 'open', 'action',
          'Dowód próby: od startu pracy firmy do odebranego wyniku.', null, null,
          false, 'execution.b2b-try.trial.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'ready', 'Potwierdź gotowość do pierwszego użycia w firmie',
          null, false,
          null, null, array['b2b-hand.pack', 'b2b-try.trial']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'version', 'short_text',
          'Którą wersję potwierdzasz?', null, null,
          true, 'execution.b2b-try.ready.version',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ready', 'select',
          'Czy ta wersja jest gotowa do pierwszego użycia w firmie?', 'Pole jest puste, dopóki go nie potwierdzisz.', null,
          true, 'execution.b2b-try.ready.ready',
          '{"options":[{"value":"ready","label":"Gotowe do pierwszego użycia w firmie"}]}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['version', 'ready']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['trial', 'ready']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['b2b-hand', 'b2b-try']);

  -- ═══ kategoria: B2C ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2c', 'B2C', 'Przygotuj ofertę dla konsumenta i przećwicz drogę od otrzymania produktu do zgłoszenia problemu.',
          false, 5)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Przygotuj ofertę dla konsumenta
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-offer', 'Przygotuj ofertę dla konsumenta', null,
          null, '1.1. Umieść potrzebne informacje w miejscu wyboru
Przygotuj materiał, który wykorzystasz przy pierwszym zamówieniu lub zapisie. Zacznij od tego, co klient dostanie i kiedy będzie mógł z tego skorzystać. Opisz obecną wersję zgodnie z jej możliwościami. Jeśli produkt będzie gotowy później, podaj to jasno. Wystarczy miejsce, które już wybrałeś do kontaktu lub sprzedaży, np. oferta na istniejącej platformie albo wiadomość do klienta.
Wykorzystaj wcześniejszą cenę i dopisz potrzebne warunki. Dla konkretnego zamówienia klient powinien wiedzieć, ile zapłaci łącznie, w tym jakie poniesie obowiązkowe koszty dostawy. Jeżeli ceny nie da się rozsądnie obliczyć z góry, sprawdź właściwe obowiązki informacyjne i podaj sposób jej obliczenia. Przy odnawianej opłacie pokaż okres rozliczenia, warunki zakończenia i ewentualny minimalny czas zobowiązania.
Dopasuj informacje do sposobu zawarcia umowy. Sprzedaż przez internet może wymagać przekazania innych informacji niż sprzedaż na miejscu. Dla Polski skorzystaj ze stron UOKiK wskazanych niżej. Uzupełnij właściwe dane sprzedawcy, kontakt i zasady dotyczące reklamacji. Sprawdź również prawo odstąpienia, czyli możliwość wycofania się z umowy w określonych sytuacjach. Zakres tego prawa i wyjątki zależą od oferty. Unikaj kopiowania regulaminu sklepu sprzedającego zupełnie inny produkt.
Przy zamówieniu elektronicznym wymagającym zapłaty sprawdź także, czy klient jednoznacznie widzi, że zamawia z obowiązkiem zapłaty. Potrzebne informacje muszą pojawić się we właściwym momencie. Sam dokument przechowywany u ciebie nie oznacza, że klient go otrzymał. Gotowa platforma sprzedażowa może zapewniać część potrzebnych funkcji; sprawdź swoją konfigurację i wpisaną treść.
Przydziel Goal osobie, która zbierze gotową ofertę. Tekst może przygotować jedna osoba, a umieszczenie go przy zamówieniu druga. Sprawy prawne wymagające wyjaśnienia przekaż właściwemu specjaliście. Jako proof zachowaj używaną treść i jej umiejscowienie. Dzięki temu późniejsza zmiana strony nie usunie informacji o tym, co sprawdzono.',
          '["UOKiK, Prawo do informacji (jasne informacje dopasowane do sposobu zawarcia umowy); UOKiK, Sprzedaż poza lokalem i na odległość (cena, warunki oferty i informacje przy sprzedaży na odległość); UOKiK, Odstąpienie od umowy (odstąpienie od umowy oraz sytuacje wymagające sprawdzenia właściwych zasad)."]'::jsonb, null,
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
  values (v_point, 'place', 'Umieść potrzebne informacje w miejscu wyboru',
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
  values (v_subpoint, 'open', 'action',
          'Cel z gotową ofertą w miejscu wyboru.', null, null,
          false, 'execution.b2c-offer.place.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  where point_id = v_point and key <> all(array['place']);

  -- ── punkt 2: Sprawdź całą drogę klienta
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'b2c-path', 'Sprawdź całą drogę klienta', null,
          null, '2.1. Przećwicz otrzymanie produktu i zgłoszenie problemu
Wybierz jedną ofertę, którą chcesz udostępnić na początku. Przejdź ją tak, jak zrobi to nowy klient: od przeczytania opisu do otrzymania obiecanego wyniku. Przy pliku cyfrowym sprawdź jego otrzymanie i otwarcie. Przy produkcie fizycznym przygotuj próbne zamówienie i sprawdź przekazanie właściwego egzemplarza. Przy usłudze wykonaj próbę w obiecanym zakresie.
Obserwuj też pracę po swojej stronie. Jeśli zamówienie przychodzi do jednej osoby, a produkt przekazuje druga, sprawdź, czy ta druga otrzymuje potrzebne informacje. Przy małej liczbie klientów część obsługi możesz wykonywać ręcznie. Przećwicz wybrany sposób, uwzględniając pracę, której klient nie widzi.
Przy bramce płatniczej korzystaj z trybu testowego opisanego przez dostawcę. Dla Stripe służą do tego środowisko testowe i testowe dane płatnicze. Jeżeli odpowiednie sprawdzenie wykonano w SaaS, podepnij ten wynik, a tutaj uzupełnij wyłącznie brakujące elementy drogi konsumenta. Zwróć uwagę, czy klient otrzymuje właściwe potwierdzenie i czy zamówienie trafia do obsługi.
Następnie wyślij przykładowe zgłoszenie przez podany kontakt. Sprawdź, kto je odbiera i jak doprowadza do odpowiedzi lub potrzebnej czynności. Reklamacja dotyczy problemu z zakupionym świadczeniem; odstąpienie od umowy może mieć inną podstawę i przebieg. Wybierz do próby sytuację dotyczącą twojego produktu i zastosuj właściwe zasady. Zwykła skrzynka kontaktowa może wystarczyć do pierwszej obsługi, jeśli ktoś ją sprawdza i potrafi zająć się sprawą.
Możesz poprosić osobę spoza zespołu o przejście przygotowanej drogi. Obserwuj, gdzie potrzebuje dodatkowego wyjaśnienia. Przy próbie samodzielnej zapisz, kto ją wykonał; nie wyciągaj z niej wniosku, że każda osoba zrozumie ofertę. W jednym Goalu zachowaj wynik otrzymania produktu, próbę zgłoszenia i wykryte problemy. Negatywny wynik jest ukończonym sprawdzeniem, ale wymaga odpowiedniej poprawki przed 2.2.
2.2. Potwierdź gotowość do obsługi pierwszego klienta
Porównaj ofertę z wynikiem próby. Obietnica dostarczenia pliku od razu po zamówieniu powinna odpowiadać temu, co klient otrzyma. Jeśli potrzebujesz pomocy człowieka i więcej czasu, oferta powinna to uwzględniać. Tak samo sprawdź cenę, zakres pierwszej wersji i sposób rozpoczęcia korzystania.
Przejrzyj znalezione problemy. Błędna kwota przy zamówieniu, brak obiecanego materiału lub niedziałający kontakt wymagają poprawienia przed potwierdzeniem. Dodatkowy wariant produktu albo program poleceń mogą pozostać na później. Oceniasz gotowość wybranego początku, więc korzystaj z ustalonego zakresu.
Po poprawce powtórz fragment, którego dotyczyła zmiana, i dołącz wynik do tej samej pracy. Jeśli ofertę zmieniono po próbie, sprawdź, czy wynik nadal odpowiada jej treści. Przydzielenie jednej osoby do zebrania materiałów pozwala wyłapać rozbieżność między tym, co obiecuje opis, a tym, co przygotował wykonawca.
Potwierdź gotowość, gdy masz potrzebne dowody i rozwiązane przeszkody. Ten zapis nie potwierdza popytu ani skuteczności reklamy. W MVP Stage udostępnisz pierwszą wersję odbiorcom i sprawdzisz ich korzystanie. Materiały oraz Goals pozostaną w tym samym miejscu, więc uwagi po starcie można będzie powiązać z konkretną wersją.',
          '["GOV.UK, Make the service simple to use (sprawdzenie, czy odbiorca potrafi wykonać potrzebne zadanie); Stripe, Testing (testowanie płatności w przeznaczonym do tego środowisku); UOKiK, Reklamacja (rozpoznanie zgłoszenia dotyczącego problemu z zakupem).","UOKiK, Prawo do informacji (zgodność i zrozumiałość informacji przekazanych konsumentowi); GOV.UK, How the beta phase works (ograniczony początek udostępnienia usługi i dalsze poprawki)."]'::jsonb, null,
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
  values (v_point, 'trial', 'Przećwicz otrzymanie produktu i zgłoszenie problemu',
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
  values (v_subpoint, 'open', 'action',
          'Dowód próby otrzymania i obsługi zgłoszenia.', null, null,
          false, 'execution.b2c-path.trial.open',
          '{"href":"/app/goals?new=1","label":"Otwórz cele"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['open']);

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
  values (v_point, 'ready', 'Potwierdź gotowość do obsługi pierwszego klienta',
          null, false,
          null, null, array['b2c-offer.place', 'b2c-path.trial']::text[], 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    skip_when = excluded.skip_when, depends_on = excluded.depends_on,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'version', 'short_text',
          'Którą wersję potwierdzasz?', null, null,
          true, 'execution.b2c-path.ready.version',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ready', 'select',
          'Czy ta wersja jest gotowa do obsługi pierwszego klienta?', 'Pole jest puste, dopóki go nie potwierdzisz.', null,
          true, 'execution.b2c-path.ready.ready',
          '{"options":[{"value":"ready","label":"Gotowe do obsługi pierwszego klienta"}]}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['version', 'ready']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['trial', 'ready']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['b2c-offer', 'b2c-path']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general', 'saas', 'hardware', 'b2b', 'b2c']);

end;
$$;

-- Weryfikacja: policz, co wjechało
select
  (select count(*) from public.stage_points p
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'execution') as punktow,
  (select count(*) from public.stage_subpoints s
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'execution') as podpunktow,
  (select count(*) from public.stage_fields f
     join public.stage_subpoints s on s.id = f.subpoint_id
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'execution') as pol;
