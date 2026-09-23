-- ============================================================================
-- 007 · Treść etapu: Idea Stage (v1)
-- ----------------------------------------------------------------------------
-- PLIK GENEROWANY — nie edytuj ręcznie.
-- Źródło: supabase/content/idea-v1.json
-- Regeneracja: npm run content:build -- idea-v1
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
  values ('idea', 1, 'Idea Stage', 'Sprawdź, czy pomysł ma sens',
          'Na tym etapie sprawdzisz, komu twój pomysł może pomóc, jaki problem dla tych osób rozwiązuje i czy da się na nim zarabiać. Twoim celem jest zmniejszenie najważniejszych niepewności i wykrycie luk we własnym pomyśle.', 2, 'Kończę walidację pomysłu', now())
  on conflict (key, version) do update set
    title = excluded.title, subtitle = excluded.subtitle, intro = excluded.intro,
    position = excluded.position, finish_label = excluded.finish_label,
    published_at = now()
  returning id into v_template;

  -- ═══ kategoria: Ogólna walidacja ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'general', 'Ogólna walidacja', 'Wspólna podstawa dla każdego pomysłu — niezależnie od tego, co budujesz i komu sprzedajesz.',
          true, 1)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Zdefiniuj problem
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zdefiniuj-problem', 'Zdefiniuj problem', null,
          null, 'Opisz konkretną sytuację
Zacznij od tego, co sprawia komuś trudność. „Ludzie tracą czas” jest zbyt szerokie. „Właściciel sklepu co piątek porównuje kilka plików, żeby ustalić, co zamówić” pozwala już wyobrazić sobie sytuację i znaleźć osobę do rozmowy.
W polu dotyczącym problemu opisz, co ta osoba chce zrobić, kiedy próbuje to zrobić i co jej przeszkadza. Jeśli w formularzu widzisz słowo „case”, chodzi właśnie o taki konkretny przypadek. Unikaj wpisywania „brak aplikacji”, bo z góry narzuca to rozwiązanie. Przeszkodą mogą być na przykład rozproszone informacje, trudność w znalezieniu pomocy lub skomplikowana czynność.
Jeśli opierasz się na własnym doświadczeniu, podaj przykład. Jeśli czegoś jeszcze nie wiesz, zaznacz „przypuszczenie” albo „do sprawdzenia”. Nie wymyślaj danych, żeby uzupełnić pole.
Wskaż osobę i jej obecny sposób działania
Wybierz grupę, której członków da się rozpoznać po cechach związanych z problemem. Zamiast „przedsiębiorcy” możesz zapisać „właściciele małych sklepów internetowych, którzy samodzielnie zamawiają towar”. Wiek, płeć lub miasto dopisuj tylko wtedy, gdy mają znaczenie dla opisywanej trudności.
Następnie opisz, jak taka osoba radzi sobie dzisiaj. Może korzystać z programu, prowadzić notatki, zatrudniać pomoc albo akceptować niedogodność. Jeśli nie robi nic, warto później zapytać dlaczego. Brak działania może oznaczać małą potrzebę, ale też brak czasu, pieniędzy lub dostępnego sposobu pomocy.
Oddziel przeszkodę od jej skutków
Przeszkoda to np. konieczność porównywania trzech osobnych plików. Skutek to czas poświęcony na tę czynność lub pomyłka w zamówieniu. Zapisz oba elementy, żeby wiedzieć, co chcesz poprawić i dlaczego komuś miałoby na tym zależeć.
Podawaj liczby, kiedy masz podstawę do ich użycia: „według rozmówcy około godziny tygodniowo”. Jeśli jedynie podejrzewasz, że błędy powodują straty, zapisz to jako pytanie do sprawdzenia. Nie przedstawiaj możliwych konsekwencji jako czegoś, co już zaobserwowałeś.
Oceń ważność i pilność
Suwak 1–5 pomaga uporządkować twoją obecną ocenę. Możesz przyjąć, że 1 oznacza drobną niedogodność, 3 wyraźne utrudnienie, a 5 poważne konsekwencje lub zablokowanie ważnego zadania. Oceny 2 i 4 są pośrednie. To robocze znaczenie skali w tym ćwiczeniu, bez progu zaliczającego pomysł.
Pilność odpowiada na inne pytanie: jak szybko trzeba coś z tym zrobić? Kłopot może być dotkliwy, ale pojawiać się dopiero za kilka miesięcy. Przy suwaku potrzeby rozwiązania zastanów się, czy człowiek może spokojnie poczekać, czy musi działać teraz. Później porównaj własną ocenę z przykładami z rozmów. Wysoka ocena sama nie dowodzi gotowości do zakupu.
Złóż opis problemu z pięciu pól
Uzupełnij kolejno: kto, co próbuje zrobić, w jakiej sytuacji, co przeszkadza oraz jaki jest skutek. Otrzymasz zdanie według wzoru: „[Kto] próbuje [co zrobić] [w jakiej sytuacji], ale [przeszkoda], przez co [skutek]”. Popraw końcówki wyrazów, jeśli automatycznie złożony tekst brzmi niezgrabnie.
Przykład: „Właściciele małych sklepów internetowych próbują ustalić, co zamówić podczas cotygodniowego uzupełniania zapasów, ale dane są rozrzucone po kilku plikach, przez co dużo czasu zajmuje im ręczne porównywanie informacji”.
Po tym punkcie masz opis problemu, konkretnego odbiorcę i wstępną ocenę znaczenia trudności. „Ostateczna definicja” w formularzu jest podsumowaniem na teraz. Możesz ją poprawić po rozmowach.',
          '["Paul Graham, How to Get Startup Ideas. Podstawa: szukanie problemów konkretnych odbiorców i rozpoznawanie silnej potrzeby.","Paul Graham, Before the Startup. Podstawa: poznawanie użytkowników i ich problemów na początku pracy."]'::jsonb, null,
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
  values (v_point, 'opisz-problem', 'Opisz problem i gdzie występuje',
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
  values (v_subpoint, 'co-nie-dziala', 'long_text',
          'Co aktualnie nie działa, kogo ten problem dotyczy i dlaczego?', 'Im konkretniej, tym lepiej. „Ludzie tracą czas” jest za szerokie — opisz konkretną osobę i konkretną sytuację.', null,
          true, 'idea.zdefiniuj-problem.opisz-problem.co-nie-dziala',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'sytuacja', 'long_text',
          'Opisz konkretną sytuację, moment i kontekst, w którym problem występuje.', 'Kiedy dokładnie to się dzieje? Raz w tygodniu, przy każdym zamówieniu, na koniec miesiąca?', null,
          true, 'idea.zdefiniuj-problem.opisz-problem.sytuacja',
          '{"min":40}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-nie-dziala', 'sytuacja']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'przykladowy-uzytkownik', 'Przykładowy użytkownik',
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
  values (v_subpoint, 'kto', 'long_text',
          'Opisz osobę lub organizację, której problem dotyczy.', 'Weź pod uwagę rolę, sytuację, branżę i inne cechy, które są kluczowe dla twojego pomysłu. Zamiast „przedsiębiorcy” napisz „właściciele małych sklepów internetowych”.', null,
          true, 'idea.profil-uzytkownika',
          '{"min":30}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'jak-radzi-sobie-dzis', 'long_text',
          'Jak ta osoba radzi sobie z problemem dzisiaj?', 'Jakie produkty, usługi, procesy, obejścia lub rozwiązania ręczne wykorzystuje? Jeśli nie robi nic — to też jest odpowiedź.', null,
          true, 'idea.zdefiniuj-problem.przykladowy-uzytkownik.jak-radzi-sobie-dzis',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['kto', 'jak-radzi-sobie-dzis']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'gdzie-nie-dziala', 'Gdzie obecne rozwiązanie nie działa',
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
  values (v_subpoint, 'problemy', 'long_text',
          'Wskaż konkretne problemy z obecnym sposobem działania.', 'Strata czasu, koszty, błędy, frustracja, brak wygody. Podawaj liczby, kiedy masz podstawę: „według rozmówcy około godziny tygodniowo”.', null,
          true, 'idea.zdefiniuj-problem.gdzie-nie-dziala.problemy',
          '{"min":30}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'konsekwencje', 'long_text',
          'Jakie konsekwencje się za tym ciągną?', 'Utracone przychody, ryzyko, zmarnowane zasoby, przepuszczone możliwości. Oddziel samą przeszkodę od jej skutków.', null,
          true, 'idea.zdefiniuj-problem.gdzie-nie-dziala.konsekwencje',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['problemy', 'konsekwencje']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'waznosc-problemu', 'Jak ważny jest ten problem',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'waznosc', 'scale',
          'Jak poważny jest ten problem dla osoby, której dotyczy?', '1 to drobna niedogodność, 3 wyraźne utrudnienie, 5 poważne konsekwencje.', null,
          true, 'idea.zdefiniuj-problem.waznosc-problemu.waznosc',
          '{"min":1,"max":5,"min_label":"Drobna niedogodność","max_label":"Poważne konsekwencje"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'pilnosc', 'scale',
          'Jak pilnie trzeba to rozwiązać?', 'To inne pytanie niż powaga. Kłopot może być dotkliwy, ale pojawiać się dopiero za kilka miesięcy.', null,
          true, 'idea.zdefiniuj-problem.waznosc-problemu.pilnosc',
          '{"min":1,"max":5,"min_label":"Można poczekać","max_label":"Trzeba rozwiązać natychmiast"}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['waznosc', 'pilnosc']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'ostateczna-definicja', 'Ostateczna definicja problemu',
          'Uzupełnij pola, żeby opisać problem jednym zdaniem. Skorzystaj z wcześniejszych odpowiedzi. Skup się na trudności, nie na swoim produkcie.', false,
          null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'zdanie', 'sentence_template',
          'Złóż opis problemu z pięciu pól.', 'Przeczytaj gotowe zdanie na głos. Jeśli brzmi sztucznie albo zbyt ogólnie — popraw pola, z których powstało.', 'Właściciele małych sklepów internetowych próbują ustalić, co zamówić podczas cotygodniowego uzupełniania zapasów, ale dane są rozrzucone po kilku plikach, przez co tracą godzinę tygodniowo i zamawiają za mało towaru.',
          true, 'idea.zdefiniuj-problem.ostateczna-definicja.zdanie',
          '{"template":"{kto} próbują {co} {kiedy}, ale {przeszkoda}, przez co {skutek}.","slots":[{"key":"kto","label":"Kogo dotyczy problem?","size":"md"},{"key":"co","label":"Co próbują zrobić?","size":"md"},{"key":"kiedy","label":"W jakiej sytuacji?","size":"md"},{"key":"przeszkoda","label":"Co im utrudnia?","size":"lg"},{"key":"skutek","label":"Jakie są tego konsekwencje?","size":"lg"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['zdanie']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['opisz-problem', 'przykladowy-uzytkownik', 'gdzie-nie-dziala', 'waznosc-problemu', 'ostateczna-definicja']);

  -- ── punkt 2: Zdefiniuj hipotezę rozwiązania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'hipoteza-rozwiazania', 'Zdefiniuj hipotezę rozwiązania', null,
          null, '„Hipoteza” to przypuszczenie, które zamierzasz sprawdzić. Tutaj opiszesz, jak chcesz pomóc wybranej osobie i co musi się sprawdzić, żeby ten pomysł miał sens. Na tym etapie wystarczy krótki opis oraz zakres najprostszego testu.
Wyjaśnij, co oferujesz i komu
Odpowiedz zwykłymi słowami na cztery pytania z formularza: co rozwiązanie robi, dla kogo jest, jaki problem rozwiązuje i jaki daje rezultat. Dobrze, jeśli ktoś spoza twojego zespołu potrafi po przeczytaniu wyobrazić sobie jego zastosowanie.
Przykład: „Narzędzie dla właścicieli małych sklepów internetowych, które łączy dane o sprzedaży i zapasach w jedną listę proponowanych zamówień. Ma skrócić czas cotygodniowego sprawdzania towaru”. Skrócenie czasu jest na razie obietnicą do sprawdzenia.
Pokaż, jak użytkownik uzyska korzyść
Opisz krótki ciąg wydarzeń: co użytkownik dostarcza lub robi, co dzieje się z tym dalej i co otrzymuje. W przykładzie właściciel przekazuje pliki, narzędzie porównuje dane, a on dostaje listę produktów do sprawdzenia przed zamówieniem.
Funkcja to możliwość wykonania czegoś, np. wczytania pliku. Korzyść to to, co człowiek dzięki temu zyskuje, np. mniej ręcznego przepisywania. Przy pytaniu o najważniejszą czynność wskaż działanie potrzebne do tej korzyści. Samo założenie konta zwykle jeszcze jej nie daje.
Ogranicz pierwszą wersję
Wypisz funkcje lub czynności potrzebne do sprawdzenia głównej obietnicy. Przy każdej zapytaj: „Czy bez tego nadal mogę sprawdzić, czy pomagam użytkownikowi?”. Jeśli tak, odłóż ją na później.
W przykładzie wystarczą: przyjęcie plików, porównanie informacji i przygotowanie listy. Personalizowane kolory, program poleceń czy rozbudowane statystyki mogą poczekać. Część pracy możesz na początku wykonać ręcznie, o ile jasno przedstawisz uczestnikowi, jak działa test.
MVP to skrót oznaczający pierwszą prostą wersję, z której ktoś może skorzystać i uzyskać podstawową korzyść. W tym punkcie ustalasz jej zakres. Obrazek lub prezentacja mogą pomóc wyjaśnić pomysł, ale nie pokazują jeszcze, czy działający produkt rozwiązuje problem. Przy urządzeniu sam szkic nie sprawdzi jego sprawności technicznej.
Zapisz, dlaczego pomysł może zadziałać
Uzupełnij zdanie: „Zakładam, że [kto] skorzysta z [czego], żeby [co osiągnąć]”. Na przykład: „Zakładam, że właściciele małych sklepów skorzystają z listy proponowanych zamówień, żeby szybciej uzupełniać zapasy”.
Potem wypisz najważniejsze założenia. Szukaj rzeczy, które mogą okazać się błędne i zmusić cię do dużej zmiany. W naszym przykładzie są to: właściciele mogą udostępnić potrzebne dane; przygotowana lista pomaga im w zamówieniu; oszczędność czasu jest dla nich warta proponowanej ceny.
Wybierz, co sprawdzisz najpierw
Przy każdym założeniu zastanów się, jak mało o nim wiesz i co się stanie, jeśli jest błędne. Wybierz to, które jest jednocześnie istotne i słabo poznane. Zapisz je jako konkretne stwierdzenie, np. „Właściciele sklepów zgodzą się przekazać pliki potrzebne do testu”. „Ludzie polubią pomysł” jest za mało precyzyjne.
Pozostałe założenia zachowaj na liście. Jeśli najważniejsza niewiadoma dotyczy np. działania urządzenia, rozmowy z klientami jej nie rozstrzygną. Zaznacz, że potrzebujesz osobnego sprawdzenia technicznego.
Po tym punkcie masz zrozumiały opis rozwiązania, jego niezbędny zakres i jedno założenie do sprawdzenia w pierwszej kolejności.',
          '["Michael Seibel, How to Plan an MVP. Podstawa: ograniczanie pierwszej wersji do podstawowej korzyści i uczenie się na jej użyciu. Link prowadzi do omówienia i zapisu wykładu.","Kevin Hale, How to Evaluate Startup Ideas. Podstawa: pomysł jako zbiór przypuszczeń o problemie, rozwiązaniu i powodach jego powodzenia. Link prowadzi do omówienia i zapisu wykładu.","Paul Graham, Do Things that Don''t Scale. Podstawa: możliwość wykonywania części pracy ręcznie na początku."]'::jsonb, null,
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
  values (v_point, 'opisz-rozwiazanie', 'Opisz rozwiązanie i jego główną wartość',
          'Skup się na głównej wartości, bez rozwijania pełnej listy funkcji.', false,
          null, 1)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-robi', 'short_text',
          'Co twoje rozwiązanie robi?', 'Jedno zdanie, zwykłymi słowami. Tak, żeby zrozumiała to osoba spoza branży.', null,
          true, 'idea.hipoteza-rozwiazania.opisz-rozwiazanie.co-robi',
          '{"min":10,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'dla-kogo', 'short_text',
          'Dla kogo jest przeznaczone?', null, null,
          true, 'idea.hipoteza-rozwiazania.opisz-rozwiazanie.dla-kogo',
          '{"min":5,"max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'jaki-problem', 'short_text',
          'Jaki problem rozwiązuje?', null, null,
          true, 'idea.hipoteza-rozwiazania.opisz-rozwiazanie.jaki-problem',
          '{"min":10,"max":300}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'rezultat', 'short_text',
          'Jaki daje rezultat?', 'Co się zmienia po stronie użytkownika — co widzi, czuje albo oszczędza.', null,
          true, 'idea.hipoteza-rozwiazania.opisz-rozwiazanie.rezultat',
          '{"min":10,"max":300}'::jsonb, 4)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-robi', 'dla-kogo', 'jaki-problem', 'rezultat']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'dostarczenie-wartosci', 'Dostarczenie wartości',
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
  values (v_subpoint, 'jak-rozwiazuje', 'long_text',
          'Jak twój pomysł rozwiązuje problem opisany w punkcie 1?', 'Opisz krótki ciąg wydarzeń: co użytkownik dostarcza lub robi, co dzieje się dalej i co dostaje na końcu.', null,
          true, 'idea.hipoteza-rozwiazania.dostarczenie-wartosci.jak-rozwiazuje',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-zyska', 'long_text',
          'Co użytkownik zyska dzięki twojemu rozwiązaniu?', 'Funkcja to możliwość zrobienia czegoś. Korzyść to to, co człowiek dzięki temu zyskuje. Opisz korzyść.', null,
          true, 'idea.hipoteza-rozwiazania.dostarczenie-wartosci.co-zyska',
          '{"min":20}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-musi-zrobic', 'short_text',
          'Co najważniejszego musi zrobić użytkownik, żeby uzyskać tę korzyść?', 'Jeśli wymaga to dużego wysiłku na starcie, to jest ryzyko, które trzeba sprawdzić.', null,
          true, 'idea.hipoteza-rozwiazania.dostarczenie-wartosci.co-musi-zrobic',
          '{"min":10,"max":300}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['jak-rozwiazuje', 'co-zyska', 'co-musi-zrobic']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'wersja-minimalna', 'Wersja minimalna',
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
  values (v_subpoint, 'funkcje', 'list_short',
          'Wypisz absolutnie niezbędne funkcje, żeby przetestować produkt, usługę lub proces.', 'Przy każdej zapytaj: „czy bez tego nadal mogę sprawdzić, czy pomagam użytkownikowi?”. Jeśli tak — wyrzuć.', 'Przyjęcie plików · Porównanie informacji · Przygotowanie listy zamówień',
          true, 'idea.hipoteza-rozwiazania.wersja-minimalna.funkcje',
          '{"min_items":1,"max_items":10,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['funkcje']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'dlaczego-skorzysta', 'Dlaczego ktoś miałby skorzystać',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'zalozenie', 'sentence_template',
          'Zapisz swoje główne założenie.', 'To zdanie będziesz sprawdzać w rozmowach z ludźmi. Im konkretniejsze, tym łatwiej je obalić albo potwierdzić.', null,
          true, 'idea.hipoteza-rozwiazania.dlaczego-skorzysta.zalozenie',
          '{"template":"Zakładam, że {kto} skorzysta z {czego}, żeby {po-co}.","slots":[{"key":"kto","label":"Kto?","size":"md"},{"key":"czego","label":"Z czego?","size":"md"},{"key":"po-co","label":"Co osiągnąć?","size":"lg"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'warunki', 'list_short',
          'Co musi się sprawdzić, żeby twój pomysł miał szansę zadziałać?', 'Wybierz takie założenia, których niespełnienie zmusi cię do zmiany pomysłu. Reszta nie jest krytyczna.', null,
          true, 'idea.hipoteza-rozwiazania.dlaczego-skorzysta.warunki',
          '{"min_items":1,"max_items":8,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['zalozenie', 'warunki']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'zalozenie-do-testow', 'Sprawdzane założenie do testów',
          null, false,
          null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'najwazniejsze', 'short_text',
          'Które założenie jest najbardziej ryzykowne i najważniejsze?', 'To jest rzecz, od której zależy wszystko inne. Nią zajmiesz się najpierw.', null,
          true, 'idea.hipoteza-rozwiazania.zalozenie-do-testow.najwazniejsze',
          '{"min":10,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'pozostale', 'list_short',
          'Jakie są pozostałe założenia?', null, null,
          false, 'idea.hipoteza-rozwiazania.zalozenie-do-testow.pozostale',
          '{"max_items":10,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['najwazniejsze', 'pozostale']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['opisz-rozwiazanie', 'dostarczenie-wartosci', 'wersja-minimalna', 'dlaczego-skorzysta', 'zalozenie-do-testow']);

  -- ── punkt 3: Sprawdź, jak inni rozwiązują ten problem
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'konkurencja', 'Sprawdź, jak inni rozwiązują ten problem', null,
          null, 'Sprawdzisz tutaj, jakie możliwości ma dziś twój przyszły klient. Przydadzą ci się wyszukiwarka, strony istniejących produktów oraz opinie użytkowników. Nie potrzebujesz obszernego raportu. Zbieraj informacje, które pomogą ci porównać konkretne sposoby poradzenia sobie z problemem.
Znajdź produkty i inne sposoby działania
Szukaj po czynności lub trudności, np. „jak planować zamówienia towaru”, „program do uzupełniania zapasów” albo „za dużo czasu na kontrolę magazynu”. Sprawdź też nazwy narzędzi, które znasz z wcześniejszej pracy. Jeśli to pomocne, powtórz wyszukiwanie po angielsku.
Wypisz trzy podobne produkty lub usługi i dodaj linki. Osobno zanotuj inne sposoby działania: własny arkusz, kartkę, pracę dodatkowej osoby lub zamawianie na wyczucie. Jeśli znalazłeś mniej niż trzy produkty, zapisz wyniki i miejsca poszukiwań. Nie dopisuj niepodobnych firm tylko po to, żeby dopełnić liczbę.
Zbierz porównywalne informacje
Przy każdym rozwiązaniu odpowiedz na pytania z formularza. Najpierw sprawdź stronę produktu, opis działania i cennik. Zanotuj odbiorców, rozwiązywany problem, obiecywany rezultat oraz kilka najważniejszych funkcji.
Zapisuj cenę wraz z warunkami: za miesiąc czy rok, za osobę czy całą firmę, za jakie możliwości. „Cena od 30 zł” bez tych informacji niewiele mówi. Jeśli kwota jest dostępna dopiero po rozmowie ze sprzedawcą, wpisz „wycena indywidualna”. Przy sposobach ręcznych uwzględnij czas lub wysiłek, nawet gdy nie ma opłaty za program. Zachowaj link i datę sprawdzenia.
Przeczytaj pochwały i skargi
Zajrzyj do recenzji, grup związanych z tematem i dyskusji o produkcie. Zapisz, co ludzie cenią i z czym mają trudność. Szukaj konkretnych sytuacji: „co tydzień przepisuję dane”, „nie potrafię ustawić tego samodzielnie”, „ta funkcja oszczędza mi godzinę”.
Jedna opinia jest tropem. Powtarzająca się uwaga zasługuje na dalsze sprawdzenie, ale nadal nie mówi, jak częsty jest problem wśród wszystkich użytkowników. Zwracaj uwagę na datę i wersję produktu. Nie wybieraj wyłącznie komentarzy pasujących do twojego pomysłu.
Jeśli zauważysz pomijaną grupę, opisz ją konkretnie: „właściciele jednoosobowych sklepów bez pomocy informatyka”. Brak funkcji w produkcie nie oznacza automatycznie, że komuś zależy na jej dodaniu. Możesz o to zapytać w późniejszych rozmowach.
Porównaj pomysł i koszt zmiany
Wskaż, co planujesz robić inaczej, komu ma to pomóc i jak wypada proponowana cena. Rozdziel to, co konkurent już oferuje, od tego, co dopiero obiecujesz zbudować. Unikaj ogólników typu „lepsza jakość”. Doprecyzuj np. „użytkownik otrzyma listę bez ręcznego przepisywania danych”.
Zapisz również zalety obecnego rozwiązania: znajomość obsługi, niezawodność, istniejące dane lub pomoc techniczną. Człowiek może pozostać przy mniej wygodnym sposobie, jeśli przejście na nowy wymaga dużo pracy. Zapytaj, co musiałoby mu to wynagrodzić. W przykładzie oszczędność kilkunastu minut może nie wystarczyć, jeśli przygotowanie plików do nowego narzędzia zajmuje godzinę.
Jeśli nie znajdujesz konkurencji
Sprawdź inne nazwy problemu i zapytaj osoby z wybranej grupy, jak sobie radzą. Zapisz możliwe wyjaśnienia braku produktów: potrzeba jest mała, ludzie korzystają z obejścia, rozwiązanie jest trudne do stworzenia albo nikt jeszcze nie rozwinął tego pomysłu. Przy wybranym wyjaśnieniu dopisz sposób sprawdzenia, np. rozmowę z odbiorcą lub osobą znającą daną technologię.
Po tym punkcie masz krótkie porównanie, linki do informacji i pomysł na to, co mogłoby skłonić klienta do zmiany. Sama obecność lub nieobecność konkurentów nie rozstrzyga, czy warto kontynuować.',
          '["Paul Graham, How to Get Startup Ideas, część Competition. Podstawa: szukanie potrzeb pomijanych przez istniejące rozwiązania.","Eric Migicovsky, How to Talk to Users. Podstawa: poznawanie używanych sposobów działania i ich ograniczeń. Link prowadzi do omówienia i zapisu wykładu."]'::jsonb, null,
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
  values (v_point, 'znajdz-rozwiazania', 'Znajdź podobne rozwiązania',
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
  values (v_subpoint, 'produkty', 'list_short',
          'Wypisz trzy produkty lub usługi, które rozwiązują podobny problem.', 'Nie muszą być identyczne. Chodzi o to, po co dziś sięga twój odbiorca.', null,
          true, 'idea.konkurencja.znajdz-rozwiazania.produkty',
          '{"min_items":1,"max_items":10,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'obejscia', 'list_short',
          'Jakimi jeszcze sposobami ludzie radzą sobie z tym problemem?', 'Robią coś ręcznie, proszą kogoś o pomoc, używają Excela albo po prostu godzą się z niedogodnością. To też jest konkurencja.', null,
          true, 'idea.konkurencja.znajdz-rozwiazania.obejscia',
          '{"min_items":1,"max_items":10,"item_max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['produkty', 'obejscia']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'opisz-rozwiazania', 'Opisz znalezione rozwiązania',
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
  values (v_subpoint, 'dla-kogo', 'short_text',
          'Dla kogo są przeznaczone?', null, null,
          true, 'idea.konkurencja.opisz-rozwiazania.dla-kogo',
          '{"min":5,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'jak-rozwiazuja', 'long_text',
          'Jak rozwiązują problem i co dzięki temu zyskuje użytkownik?', null, null,
          true, 'idea.konkurencja.opisz-rozwiazania.jak-rozwiazuja',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cena', 'short_text',
          'Ile kosztują i za co się płaci?', 'Jeśli nie znasz ceny, napisz „nie podają ceny publicznie” — to też jest informacja.', null,
          true, 'idea.konkurencja.opisz-rozwiazania.cena',
          '{"min":3,"max":300}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'funkcje', 'list_short',
          'Jakie mają najważniejsze funkcje lub cechy?', null, null,
          true, 'idea.konkurencja.opisz-rozwiazania.funkcje',
          '{"min_items":1,"max_items":15,"item_max":200}'::jsonb, 4)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['dla-kogo', 'jak-rozwiazuja', 'cena', 'funkcje']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'opinie-uzytkownikow', 'Sprawdź, co mówią użytkownicy',
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
  values (v_subpoint, 'przeczytane', 'checkmark',
          'Przeczytałem opinie, komentarze albo dyskusje o tych rozwiązaniach.', 'Recenzje w sklepach, wątki na forach, komentarze na Reddicie i grupach — tam ludzie mówią prawdę.', null,
          true, 'idea.konkurencja.opinie-uzytkownikow.przeczytane',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'chwala', 'list_short',
          'Co użytkownicy chwalą?', null, null,
          true, 'idea.konkurencja.opinie-uzytkownikow.chwala',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'narzekaja', 'list_short',
          'Na co narzekają i czego im brakuje?', 'To najcenniejsza część. Luka w cudzym produkcie to twoja szansa.', null,
          true, 'idea.konkurencja.opinie-uzytkownikow.narzekaja',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'niezaspokojone', 'short_text',
          'Czy jakaś grupa osób ma potrzeby, których te rozwiązania nie zaspokajają? Jakie?', null, null,
          false, 'idea.konkurencja.opinie-uzytkownikow.niezaspokojone',
          '{"max":400}'::jsonb, 4)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'zrodla', 'links',
          'Linki do znalezionych opinii', 'Przydadzą się później, gdy będziesz wracać do tych wniosków.', null,
          false, 'idea.konkurencja.opinie-uzytkownikow.zrodla',
          '{"max_items":10}'::jsonb, 5)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['przeczytane', 'chwala', 'narzekaja', 'niezaspokojone', 'zrodla']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'porownaj', 'Porównaj swój pomysł',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'inaczej', 'short_text',
          'Co chcesz robić inaczej niż istniejące rozwiązania?', null, null,
          true, 'idea.konkurencja.porownaj.inaczej',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ci-sami-ludzie', 'short_text',
          'Czy chcesz pomagać tym samym osobom? Jeśli nie — komu?', null, null,
          true, 'idea.konkurencja.porownaj.ci-sami-ludzie',
          '{"min":5,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cena', 'short_text',
          'Jak twoja planowana cena wypada na ich tle?', 'Jeśli jeszcze jej nie znasz, napisz „do ustalenia” — wrócisz do tego w punkcie 5.', null,
          true, 'idea.konkurencja.porownaj.cena',
          '{"min":3,"max":300}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'przewagi', 'long_text',
          'W czym twój pomysł może być lepszy, a w czym istniejące rozwiązania mają przewagę?', 'Uczciwa odpowiedź na drugą część jest ważniejsza niż na pierwszą.', null,
          true, 'idea.konkurencja.porownaj.przewagi',
          '{"min":40}'::jsonb, 4)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['inaczej', 'ci-sami-ludzie', 'cena', 'przewagi']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'dlaczego-zmiana', 'Sprawdź, dlaczego ktoś miałby się przestawić',
          null, false,
          null, 5)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-przekona', 'short_text',
          'Co skłoniłoby kogoś do wybrania twojego rozwiązania zamiast obecnego sposobu działania?', null, null,
          true, 'idea.konkurencja.dlaczego-zmiana.co-przekona',
          '{"min":15,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-utrudnia', 'list_short',
          'Co utrudniałoby tę zmianę?', 'Koszt, przeniesienie danych, nauka obsługi, przyzwyczajenie, zgoda przełożonego.', null,
          true, 'idea.konkurencja.dlaczego-zmiana.co-utrudnia',
          '{"min_items":1,"max_items":8,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-przekona', 'co-utrudnia']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'brak-konkurencji', 'Jeśli nie znajdujesz podobnych rozwiązań',
          'Wypełnij tylko wtedy, gdy naprawdę nic nie znalazłeś. Brak konkurencji częściej oznacza brak rynku niż wolne pole.', true,
          null, 6)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'gdzie-szukales', 'list_short',
          'Gdzie szukałeś?', null, null,
          false, 'idea.konkurencja.brak-konkurencji.gdzie-szukales',
          '{"max_items":10,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'dlaczego-nie-ma', 'long_text',
          'Dlaczego takie rozwiązania mogą nie istnieć?', 'Rozważ, czy problem jest mało ważny, rozwiązanie trudne do zbudowania albo trudno na nim zarobić. Możliwe też, że nikt jeszcze nie wykorzystał tej szansy.', null,
          false, 'idea.konkurencja.brak-konkurencji.dlaczego-nie-ma',
          '{}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'jak-sprawdzisz', 'short_text',
          'Jak sprawdzisz swoje wyjaśnienie?', null, null,
          false, 'idea.konkurencja.brak-konkurencji.jak-sprawdzisz',
          '{"max":400}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['gdzie-szukales', 'dlaczego-nie-ma', 'jak-sprawdzisz']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['znajdz-rozwiazania', 'opisz-rozwiazania', 'opinie-uzytkownikow', 'porownaj', 'dlaczego-zmiana', 'brak-konkurencji']);

  -- ── punkt 4: Porozmawiaj z osobami, którym chcesz pomóc
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'rozmowy', 'Porozmawiaj z osobami, którym chcesz pomóc', null,
          null, 'Teraz sprawdzisz wcześniejsze przypuszczenia w rozmowach. Poszukasz konkretnych zdarzeń pokazujących, czy problem występuje, jak przeszkadza i co ludzie z nim robią. Przygotuj miejsce na notatki oraz kilka pytań pomocniczych.
Znajdź przynajmniej pięciu rozmówców
Wróć do opisu odbiorcy z punktu 1. Szukaj osób, które wykonują wskazaną czynność. Do przykładu sklepowego zaproś kogoś odpowiedzialnego za zamawianie towaru. Sam fakt pracy w sklepie może nie wystarczyć.
Zacznij od znajomych, poleceń, grup tematycznych, lokalnych firm lub wydarzeń. Możesz napisać: „Próbuję zrozumieć, jak właściciele małych sklepów planują zamówienia towaru. Czy znajdziesz 15 minut, żeby opowiedzieć mi, jak wygląda to u ciebie?”. Podany czas to przykładowa propozycja krótkiego spotkania.
Znajomy jest odpowiednim rozmówcą, jeśli pasuje do grupy. Warto dotrzeć również poza własne otoczenie. Pięć rozmów to początek przewidziany w tym ćwiczeniu. Nie traktuj tej liczby jako gwarancji, że poznałeś potrzeby całej grupy.
Pytaj o wydarzenia i słuchaj odpowiedzi
Na początku wyjaśnij, jaki temat chcesz zrozumieć. Opis rozwiązania zostaw na później, żeby nie podpowiadać rozmówcy, co chcesz usłyszeć. Pomocne pytania to:
Jak wyglądało ostatnie uzupełnianie zapasów w twoim sklepie?
W którym momencie pojawiła się trudność? Co wtedy się wydarzyło?
Jak często zdarza się podobna sytuacja?
Co zrobiłeś, żeby sobie poradzić, i jaki był rezultat?
Ile zajęło ci to czasu lub ile kosztowało? Skąd ta ocena?
Nie musisz odczytywać pytań po kolei. Dopytuj o niejasne odpowiedzi: „Co masz na myśli?” lub „Możesz podać przykład?”. Jeśli ktoś mówi, że obecny sposób jest wystarczający, pozwól mu to wyjaśnić. Unikaj pytania „Czy też marnujesz czas na te okropne pliki?”, które sugeruje ocenę.
Gdy pada pomysł nowej funkcji, zapytaj, w jakiej sytuacji byłaby potrzebna. Dzięki temu poznasz powód prośby. Jeśli rozmówca chce obejrzeć twój pomysł, najpierw dokończ część o doświadczeniach i wyraźnie oddziel późniejszą prezentację.
Zapisz każdą rozmowę osobno
W notatce umieść datę, krótki opis roli rozmówcy, konkretny przypadek, częstotliwość, obecny sposób działania oraz skutki. Zapisz także sytuacje, w których problem nie wystąpił albo nie miał dużego znaczenia. Cytat oznacz jako cytat tylko wtedy, gdy pamiętasz dokładne słowa. Nagrywaj wyłącznie za zgodą rozmówcy.
Oddziel odpowiedź od własnego wniosku. „Powiedział, że porównywał pliki przez godzinę” to informacja z rozmowy. „Będzie chciał zapłacić za oszczędność czasu” to twoje przypuszczenie. Jeśli nie uzyskałeś odpowiedzi, wpisz „brak informacji”.
Porównaj rozmowy i popraw założenia
Zestaw odpowiedzi pod kątem tych samych pytań: kto ma trudność, jak często, co z nią robi i jak bardzo mu przeszkadza. Przy małej grupie zapis „3 z 5 osób opisały taki przypadek” jest bardziej przejrzysty niż samotne „60%”. Nie przenoś tego wyniku na wszystkich potencjalnych klientów.
Wypisz powtarzające się obserwacje i osobno to, co przeczy pomysłowi. Jeśli tylko część rozmówców doświadcza problemu, sprawdź, co ich łączy. Może warto zawęzić grupę. Jeśli relacje są niejasne lub sprzeczne, zapisz konkretną niewiadomą i dobierz kolejne rozmowy pod jej wyjaśnienie.
Po tym punkcie masz notatki z rozmów, wspólne obserwacje i poprawiony opis problemu. Wróć też do punktu 2, jeśli proponowane rozwiązanie przestało pasować do tego, czego się dowiedziałeś.',
          '["Eric Migicovsky, How to Talk to Users. Podstawa: rozmowy o konkretnych doświadczeniach, obecnych sposobach działania i trudnościach. Link prowadzi do omówienia i zapisu wykładu.","Paul Graham, Do Things that Don''t Scale. Podstawa: osobiste docieranie do pierwszych odbiorców.","Paul Graham, Before the Startup. Podstawa: budowanie wiedzy o użytkownikach."]'::jsonb, null,
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
  values (v_point, 'znajdz-rozmowcow', 'Znajdź rozmówców',
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
  values (v_subpoint, 'osoby', 'list_short',
          'Znajdź przynajmniej 5 osób, których może dotyczyć wybrany problem.', 'Wpisz imię albo opis, żeby wiedzieć, z kim rozmawiałeś. Nie muszą to być obcy ludzie — zacznij od znajomych z branży.', null,
          true, 'idea.rozmowy.znajdz-rozmowcow.osoby',
          '{"min_items":5,"max_items":20,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['osoby']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'zapytaj-o-doswiadczenia', 'Zapytaj o ich doświadczenia',
          'Na początku nie przedstawiaj swojego pomysłu. Pytaj o to, co robili, nie o to, co zrobiliby.', false,
          null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'zapisy', 'list_long',
          'Po każdej rozmowie zapisz, czego się dowiedziałeś.', 'Kiedy ostatnio pojawił się ten problem i jak często się zdarza? Jak ta osoba sobie z nim radzi? Co jest w tym najbardziej uciążliwe i ile kosztuje ją czasu, pieniędzy lub wysiłku?', null,
          true, 'idea.rozmowy.zapytaj-o-doswiadczenia.zapisy',
          '{"min_items":5,"max_items":20}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'materialy', 'files',
          'Nagrania albo notatki z rozmów', null, null,
          false, 'idea.rozmowy.zapytaj-o-doswiadczenia.materialy',
          '{"max_files":20,"max_mb":20}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['zapisy', 'materialy']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'podsumuj-rozmowy', 'Podsumuj rozmowy',
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
  values (v_subpoint, 'powtarzalo', 'list_short',
          'Co powtarzało się w odpowiedziach?', 'Rzecz, którą powiedziały trzy osoby z pięciu, jest ważniejsza niż najciekawsza uwaga jednej.', null,
          true, 'idea.rozmowy.podsumuj-rozmowy.powtarzalo',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'za-i-przeciw', 'long_text',
          'Co wskazuje, że warto rozwiązać ten problem, a co podważa twoje założenia?', 'Zapisz też to, co ci się nie spodobało. Sprzeczny dowód jest wart więcej niż dziesięć potwierdzeń.', null,
          true, 'idea.rozmowy.podsumuj-rozmowy.za-i-przeciw',
          '{"min":60}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['powtarzalo', 'za-i-przeciw']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['znajdz-rozmowcow', 'zapytaj-o-doswiadczenia', 'podsumuj-rozmowy']);

  -- ── punkt 5: Sprawdź zainteresowanie pomysłem i ceną
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zainteresowanie-i-cena', 'Sprawdź zainteresowanie pomysłem i ceną', null,
          null, 'W tym punkcie pokażesz konkretną propozycję i poprosisz o mały następny krok. Dowiesz się, co ludzie rozumieją, jakie mają zastrzeżenia i czy chcą poświęcić uwagę lub czas na dalszy kontakt. Cena będzie wstępną propozycją do rozmowy.
Przygotuj propozycję i ustal, kto płaci
Skorzystaj z opisu rozwiązania z punktu 2, poprawionego po rozmowach. Wystarczy kilka zdań, prosty rysunek lub pokaz przykładowego wyniku. Powiedz, co już działa, a co dopiero planujesz. Na tym etapie nie potrzebujesz prezentacji z pełną listą przyszłych funkcji.
Przykład: „Przygotowujemy narzędzie, które z plików sklepu tworzy listę produktów do ponownego zamówienia. Chcemy sprawdzić, czy pomoże ci to szybciej zaplanować dostawę. Na razie pokazujemy przykładową listę”.
Ustal, kto używa rozwiązania, a kto podejmuje decyzję o wydaniu pieniędzy. Pracownik może korzystać z narzędzia, a właściciel sklepu opłacać je. Zapisz te role i postaraj się porozmawiać także z osobą decydującą o zakupie.
Podaj konkretną cenę
Wybierz pierwszą kwotę na podstawie porównania z punktu 3 i tego, czego dowiedziałeś się o obecnym sposobie działania. Powiedz, za co i jak często klient miałby płacić. Przykład: „Rozważamy 49 zł miesięcznie za obsługę jednego sklepu i cotygodniową listę zamówień”. To wymyślona cena do pokazania sposobu formułowania oferty.
Nie musisz teraz wyliczać idealnej ceny ani tworzyć rozbudowanej prognozy. Wybrana kwota służy rozmowie. Jeśli później ją zmienisz, zanotuj, komu przedstawiono którą wersję. Koszt przygotowania produktu i koszt obsługi klienta nadal będą wymagały osobnego sprawdzenia.
Ustal działanie i wynik przed testem
Poproś o krok, który możesz zaobserwować: zapis do testów albo umówienie krótkiego spotkania z konkretnym terminem. Wybierz taki krok, który jesteś gotowy obsłużyć. Sama odpowiedź „brzmi ciekawie” nie zalicza się do wykonania tego działania.
Zapisz, komu pokażesz ofertę, ilu osobom, w jakim terminie i jaki wynik skłoni cię do dalszego sprawdzania. Przykładowa robocza reguła: „W ciągu tygodnia przedstawię tę samą propozycję pięciu właścicielom sklepów. Jeśli dwie osoby umówią termin testu, przygotuję go dla nich”. Ten próg służy podjęciu małej decyzji w przykładzie. Nie jest normą dla innych pomysłów ani dowodem zapotrzebowania na produkt.
Jeśli test jest darmowy, zapisz to. Zgłoszenie do niego pokazuje zainteresowanie darmowym testem. Reakcję na przyszłą cenę zanotuj oddzielnie.
Przedstaw pomysł i zapisz, co się wydarzyło
Możesz wrócić do osób z punktu 4. Pokaż każdej z nich porównywalny opis i jasno podaną cenę. Zapytaj, jak rozumie propozycję, co byłoby dla niej przydatne i co powstrzymałoby ją przed skorzystaniem. Gdy słyszysz „za drogo”, dopytaj: „Z czym porównujesz tę kwotę?” oraz „Co budzi największą wątpliwość?”. Nie zakładaj od razu, że wystarczy obniżka.
Zanotuj przy każdej osobie: wersję oferty i cenę, reakcję, powód zainteresowania lub odmowy, proponowany krok i wykonane działanie. Oddziel „zgodziła się umówić” od „wybrała termin”, a później od „przyszła na spotkanie”.
Podsumuj liczbę działań względem liczby osób, które zobaczyły ofertę, np. „2 z 5 umówiły test”. Brak odpowiedzi również zapisz, ale nie przypisuj mu wymyślonej przyczyny. Jeśli zaprosiłeś pięć osób i odpowiedziały tylko dwie, zachowaj obie liczby. Bezpłatnego zapisu nie przedstawiaj jako zakupu.
Zdecyduj, co zostawisz i co sprawdzisz dalej
Wróć do założenia wybranego w punkcie 2 i oceń, czy przeprowadzony test w ogóle go dotyczył. Jeśli chciałeś sprawdzić gotowość do udostępnienia plików, sam zapis na rozmowę jeszcze tego nie wyjaśnia.
Oprzyj decyzję na powodach i działaniach. Jeśli odbiorcy opisują potrzebę i wykonują umówiony krok, możesz przygotować następny test. Jeśli mają problem, ale nie rozumieją propozycji, popraw opis i sprawdź go ponownie. Jeśli nie widzą istotnej korzyści albo obecny sposób im wystarcza, rozważ zmianę rozwiązania lub grupy. Gdy informacje są zbyt skąpe, wskaż dokładnie, czego brakuje.
Końcowa notatka powinna mówić: czego się dowiedziałeś, co zmieniasz, co pozostaje niepewne i jaki będzie następny krok. Przykład: „Dwie osoby umówiły test, ale żadna jeszcze nie korzystała z rozwiązania i żadna za nie nie zapłaciła. Przygotuję dla nich przykładowe listy i sprawdzę, czy pomagają w zamówieniu”.
Po tym punkcie masz pierwsze reakcje na ofertę i cenę oraz decyzję opartą na zebranych informacjach. To nadal nie dowodzi, że produkt działa, klienci będą wracać ani że przychody pokryją koszty. Te pytania sprawdzisz w kolejnych krokach pracy.',
          '["Michael Seibel, The Real Product Market Fit. Podstawa: ostrożność w ogłaszaniu sukcesu i dalsze uczenie się na użyciu produktu.","Michael Seibel, How to Plan an MVP. Podstawa: przejście do prostego rozwiązania używanego przez pierwszych odbiorców. Link prowadzi do omówienia i zapisu wykładu.","Paul Graham, Do Things that Don''t Scale. Podstawa: bezpośrednia praca z pierwszymi użytkownikami.","Źrodła:","\"How to Get Startup Ideas\" – Paul Graham / Jared Friedman","\"Before the Startup\" – Paul Graham","\"Do Things that Don''t Scale\" – Paul Graham (słynny esej o robieniu rzeczy ręcznie na początku)","\"How to Plan an MVP\" – Michael Seibel (o bezlitosnym cięciu funkcji i upraszczaniu produktu)","\"How to Talk to Users\" – Eric Migicovsky","\"The Real Product-Market Fit\" – Michael Seibel","\"How to Get and Test Ideas\" – Kevin Hale"]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'propozycja', 'Przygotuj krótką propozycję',
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
  values (v_subpoint, 'oferta', 'short_text',
          'Co oferujesz i jak to pomoże rozmówcy?', 'Skorzystaj z opisu pomysłu z punktu 2. Maksymalnie dwa zdania.', null,
          true, 'idea.zainteresowanie-i-cena.propozycja.oferta',
          '{"min":20,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cena', 'short_text',
          'Kto miałby płacić, ile i za co?', null, '30 zł miesięcznie za korzystanie z aplikacji, płaci właściciel sklepu.',
          true, 'idea.zainteresowanie-i-cena.propozycja.cena',
          '{"min":10,"max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['oferta', 'cena']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'miara-zainteresowania', 'Ustal, po czym poznasz zainteresowanie',
          'Ustal to zanim zaczniesz rozmawiać — inaczej zawsze znajdziesz powód, żeby uznać wynik za dobry.', false,
          null, 2)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'dzialanie', 'short_text',
          'O jakie działanie poprosisz?', 'Coś, co wymaga wysiłku: zapisanie się do testów, umówienie kolejnej rozmowy, podanie maila, wpłata zaliczki.', null,
          true, 'idea.zainteresowanie-i-cena.miara-zainteresowania.dzialanie',
          '{"min":10,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'prog', 'short_text',
          'Ilu osobom przedstawisz propozycję i ile z nich musi wykonać to działanie, żebyś kontynuował?', null, 'Przedstawię 15 osobom, kontynuuję jeśli co najmniej 4 zapiszą się do testów.',
          true, 'idea.zainteresowanie-i-cena.miara-zainteresowania.prog',
          '{"min":10,"max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['dzialanie', 'prog']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'przedstaw-pomysl', 'Przedstaw pomysł i cenę',
          'Możesz wrócić do wcześniejszych rozmówców. Jeśli płacić ma ktoś inny niż użytkownik, porozmawiaj również z taką osobą.', false,
          null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'reakcje', 'long_text',
          'Jak rozmówcy ocenili pomysł i cenę? Co ich przekonało, a co zniechęciło?', null, null,
          true, 'idea.zainteresowanie-i-cena.przedstaw-pomysl.reakcje',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wynik', 'short_text',
          'Ile osób wykonało proponowane działanie spośród wszystkich, którym przedstawiłeś pomysł?', 'Pochwała pomysłu, zapis do darmowych testów i deklaracja „zapłaciłbym” znaczą co innego. Żadne z nich samo w sobie nie dowodzi, że ktoś kupi.', null,
          true, 'idea.zainteresowanie-i-cena.przedstaw-pomysl.wynik',
          '{"min":1,"max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['reakcje', 'wynik']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'decyzja', 'Zdecyduj, co dalej',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wnioski', 'long_text',
          'Co zostawisz, co zmienisz i co jeszcze musisz sprawdzić?', 'To podsumowanie całego etapu. Za miesiąc wrócisz do niego i sprawdzisz, czy trzymałeś się planu.', null,
          true, 'idea.zainteresowanie-i-cena.decyzja.wnioski',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['wnioski']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['propozycja', 'miara-zainteresowania', 'przedstaw-pomysl', 'decyzja']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['zdefiniuj-problem', 'hipoteza-rozwiazania', 'konkurencja', 'rozmowy', 'zainteresowanie-i-cena']);

  -- ═══ kategoria: SaaS ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'saas', 'SaaS', 'Oprogramowanie w abonamencie musi odpowiadać na potrzebę na tyle regularną, żeby klient odnawiał subskrypcję co miesiąc albo co rok. Sprawdzisz, jak często wraca problem, ile zajmie start, co zatrzyma klienta, a co go zniechęci.',
          false, 2)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Za co klient będzie płacić podczas korzystania
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'za-co-placi', 'Za co klient będzie płacić podczas korzystania', 'Skorzystaj z opisu problemu i propozycji ceny z Ogólnej walidacji. Tutaj sprawdzisz, czy sposób naliczania opłat pasuje do tego, jak z programu się korzysta.',
          null, 'Określ, co program zapewnia z czasem
W części ogólnej opisałeś główną korzyść. Teraz zastanów się, co klient będzie otrzymywać po pierwszym użyciu i dlaczego nadal będzie potrzebować programu.
Program może obsługiwać kolejne zadania, przechowywać informacje, umożliwiać współpracę lub stale wykonywać pracę w tle. Na przykład narzędzie do rezerwacji przyjmuje następne zapisy, a program do kopii zapasowych chroni kolejne wersje plików.
Częstotliwość otwierania programu nie zawsze pokazuje jego przydatność. Użytkownik może rzadko zaglądać do narzędzia, które cały czas pilnuje czegoś za niego. Opisz więc, co robi człowiek i co program zapewnia między jego wizytami.
Następnie ustal, przez jaki czas klient potrzebuje tej pomocy. Osoba prowadząca regularne zajęcia może korzystać z programu do rezerwacji przez cały rok. Organizator jednego wydarzenia może potrzebować go przez kilka miesięcy. Ktoś przekształcający pliki może wracać tylko przy konkretnych zadaniach.
Wróć do przykładów z wcześniejszych rozmów. Sprawdź, kiedy ostatnio pojawiła się potrzeba, jak często wracała i kiedy się kończyła. Jeśli nie masz jeszcze tych informacji, zapisz przypuszczenie do sprawdzenia.
Unikaj odpowiedzi „klient będzie wracać dzięki powiadomieniom”. Powiadomienie może przypomnieć o zadaniu, ale trzeba jeszcze wyjaśnić, dlaczego wykonanie tego zadania jest potrzebne.
Dopasuj sposób naliczania opłat
Wybierz, za co klient będzie płacić. Może to być miesiąc dostępu, liczba korzystających osób albo liczba wykonanych zadań. Dopasuj sposób rozliczenia do korzystania z programu.
Przy opłacie za użytkownika wyjaśnij, kogo liczysz: każdą osobę z kontem, członka zespołu czy osobę aktywnie korzystającą. Przy opłacie za użycie określ, czym jest jedno użycie, np. przetworzeniem jednego dokumentu.
Następnie wypisz, co zawiera cena podana w części ogólnej. Zamiast „49 zł za program” możesz zapisać: „49 zł miesięcznie za kalendarz rezerwacji dla jednej osoby, do 100 rezerwacji miesięcznie”. To przykład sposobu opisania oferty, a nie sugerowana cena.
Na liście uwzględnij główne możliwości programu i istotne limity. Jeśli przewidujesz limit, wyjaśnij, co stanie się po jego przekroczeniu. Klient powinien rozumieć, jak powstanie jego rachunek.
Nie musisz teraz tworzyć kilku pakietów. Jedna jasna propozycja wystarczy do pierwszego sprawdzenia.
Sprawdź reakcję na sposób rozliczenia
Przedstaw rozmówcy cenę razem z zasadą naliczania opłat. Zapytaj, co mu odpowiada, co przeszkadza i jak takie rozliczenie pasowałoby do jego sposobu korzystania.
Możesz zapytać:
„Jak płacisz obecnie za podobne narzędzia?”
„Czy liczba wykonywanych zadań mocno zmienia się między miesiącami?”
„Co byłoby dla ciebie niejasne w takim naliczaniu opłat?”
„Czy ostatnio zrezygnowałeś z jakiegoś płatnego programu? Dlaczego?”
Jeśli ktoś odrzuca abonament, sprawdź powód. Może chodzić o cenę, sporadyczne korzystanie, długość zobowiązania albo niewystarczającą korzyść. Nie zakładaj od razu, że wystarczy obniżyć kwotę.
Zapytaj również, kiedy rozmówca przestałby potrzebować twojego rozwiązania. Potrzeba może kończyć się wraz z projektem, zmianą pracy lub przejściem na inne narzędzie. Zapisz te sytuacje jako możliwe powody rezygnacji.
Oddziel doświadczenia od przewidywań. „Zrezygnowałem z programu, bo potrzebowałem go tylko na jedno wydarzenie” opisuje zdarzenie. „Z twojego programu korzystałbym przez cały rok” pozostaje deklaracją.
Po tym punkcie masz wstępny sposób naliczania opłat, opis tego, co obejmuje cena, oraz uwagi rozmówców. Odnawianie płatności sprawdzisz dopiero podczas korzystania z produktu.',
          '["Kevin Hale, How to Evaluate Startup Ideas. Rozpoznawanie potrzeby i założeń, od których zależy powodzenie pomysłu. Omówienie i zapis wykładu w YC.","Eric Migicovsky, How to Talk to Users. Pytanie o konkretne doświadczenia i obecny sposób działania. Omówienie i zapis wykładu w YC."]'::jsonb, null,
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
  values (v_point, 'co-zapewnia-z-czasem', 'Określ, co program zapewnia z czasem',
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
  values (v_subpoint, 'po-pierwszym-uzyciu', 'short_text',
          'Co klient dostanie już po pierwszym użyciu?', 'Np. obsługę kolejnych zamówień, przechowywanie danych, pracę zespołową albo stałe monitorowanie.', null,
          true, 'idea.za-co-placi.co-zapewnia-z-czasem.po-pierwszym-uzyciu',
          '{"min":15,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'rodzaj-dostepu', 'short_text',
          'Czy klient potrzebuje stałego dostępu, korzystania przez określony czas, czy tylko wykonania pojedynczych zadań?', 'Możesz oprzeć odpowiedź na przykładach z rozmów w Ogólnej walidacji. To decyduje, czy abonament w ogóle ma sens.', null,
          true, 'idea.za-co-placi.co-zapewnia-z-czasem.rodzaj-dostepu',
          '{"min":15,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['po-pierwszym-uzyciu', 'rodzaj-dostepu']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'sposob-naliczania', 'Dopasuj sposób naliczania opłat',
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
  values (v_subpoint, 'za-co', 'short_text',
          'Za co chcesz naliczać opłatę?', 'Np. miesiąc dostępu, liczbę użytkowników albo liczbę wykonanych zadań.', null,
          true, 'idea.za-co-placi.sposob-naliczania.za-co',
          '{"min":5,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'w-cenie', 'list_short',
          'Co klient otrzyma w cenie, którą podałeś w Ogólnej walidacji?', null, null,
          true, 'idea.za-co-placi.sposob-naliczania.w-cenie',
          '{"min_items":1,"max_items":12,"item_max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['za-co', 'w-cenie']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'reakcja-na-rozliczenie', 'Sprawdź reakcję na sposób rozliczenia',
          'Jeśli rozmawiałeś już z ludźmi w Ogólnej walidacji, wróć do tych samych osób — nie musisz szukać nowych.', false,
          null, 3)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'pasuje-przeszkadza', 'list_short',
          'Co zapytanym osobom pasuje, a co przeszkadza w takim naliczaniu opłat?', null, null,
          true, 'idea.za-co-placi.reakcja-na-rozliczenie.pasuje-przeszkadza',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'kiedy-zrezygnuja', 'list_short',
          'W jakim przypadku mogliby przestać potrzebować płatnego dostępu albo ograniczyć korzystanie?', 'To są przyszłe powody rezygnacji. Lepiej poznać je teraz niż po roku.', null,
          true, 'idea.za-co-placi.reakcja-na-rozliczenie.kiedy-zrezygnuja',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['pasuje-przeszkadza', 'kiedy-zrezygnuja']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['co-zapewnia-z-czasem', 'sposob-naliczania', 'reakcja-na-rozliczenie']);

  -- ── punkt 2: Sprawdź, czy klient będzie mógł zacząć korzystać
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'start-korzystania', 'Sprawdź, czy klient będzie mógł zacząć korzystać', 'Ustal, co musi być dostępne, żeby program komukolwiek pomógł. Na tym etapie wystarczy rozpoznać przeszkody i niewiadome.',
          null, 'Czego program potrzebuje na początek
Wyobraź sobie osobę, która chce po raz pierwszy uzyskać obiecaną korzyść. Zastanów się, co musi wcześniej przygotować: pliki, dane, dostępy do innych narzędzi lub ustawienia.
Wypisz tylko rzeczy potrzebne do głównego działania. Program do planowania zamówień może potrzebować listy produktów, informacji o sprzedaży i aktualnych zapasach. Program do rezerwacji może wymagać podania godzin dostępności i rodzaju oferowanych usług.
Przy każdej pozycji ustal, skąd użytkownik ją weźmie. Czy ma ją już w innym programie? Czy musi przygotować ją ręcznie? Czy potrzebuje pomocy lub pozwolenia innej osoby?
Nie zakładaj, że możliwość przeglądania informacji oznacza możliwość ich pobrania i przekazania. Zapytaj, jak użytkownik zrobiłby to przy obecnym sposobie pracy.
Pytanie o legalność udostępnienia danych potraktuj jako miejsce na ustalenia i sprawy wymagające wyjaśnienia. Zapisz:
Jakiego rodzaju informacje mają trafić do programu.
Od kogo pochodzą i czy dotyczą innych osób.
W jakich krajach planujesz oferować usługę.
Jakie ograniczenia zgłosił klient lub dostawca używanego narzędzia.
Jeśli nie potrafisz ocenić sytuacji, wpisz konkretną niewiadomą i osobę, która pomoże ją wyjaśnić. Przykład: „Do sprawdzenia z osobą odpowiedzialną za ochronę danych: czy sklep może przekazać plik zawierający informacje o swoich klientach”.
Materiały YC nie rozstrzygają kwestii prawnych. Wątpliwości dotyczące legalności wykorzystania danych wyjaśnij z odpowiednim specjalistą przed użyciem tych danych w teście. Do omówienia pomysłu możesz przygotować wymyślony plik przykładowy.
Sprawdź potrzebne połączenia z innymi programami
„Integracja” to połączenie umożliwiające współdziałanie programów. Przykładowo nowa rezerwacja może automatycznie pojawić się w kalendarzu użytkownika.
Wypisz potrzebne połączenia i przy każdym wyjaśnij, jakie informacje mają być przekazywane oraz po co. Zamiast samego „połączenie z kalendarzem” zapisz: „pobieranie zajętych terminów, żeby nie proponować wizyty w niedostępnej godzinie”.
Skup się na połączeniach potrzebnych do spełnienia głównej obietnicy. Nie dopisuj wszystkich popularnych programów, z których ktoś mógłby korzystać.
Następnie sprawdź, czy na początku wystarczy prostszy sposób przekazania informacji. Automatyczne połączenie czasem można zastąpić przesłaniem pliku. CSV to prosty format danych tabelarycznych. Ważne jest, czy obecny program pozwala pobrać potrzebne informacje w takim lub innym użytecznym formacie.
Zajrzyj do instrukcji programu lub zapytaj jego obsługę. Jeśli potrzebujesz pomocy programisty, pokaż mu konkretnie: jakie dane, skąd, dokąd i jak często mają trafiać.
Zapytaj użytkownika, jak ręczne przesyłanie pliku wyglądałoby w jego pracy. Jednorazowe przygotowanie danych może być do zaakceptowania. Powtarzanie tej czynności kilkanaście razy dziennie może odebrać rozwiązaniu sens.
Jeśli główna obietnica wymaga natychmiastowej aktualizacji informacji, ręczne przesyłanie plików może nie wystarczyć. Zapisz takie ograniczenie jako sprawę do rozwiązania.
Zapisz warunki rozpoczęcia korzystania
Zbierz przeszkody, które mogłyby zatrzymać użytkownika przed pierwszym użyciem. Mogą dotyczyć przygotowania danych, trudnych ustawień, braku dostępu do potrzebnego programu albo obaw przed przechowywaniem informacji w nowym miejscu.
Formułuj je konkretnie. „Brak zaufania” niewiele wyjaśnia. „Rozmówca nie chce przesłać dokumentów, dopóki nie wie, kto będzie miał do nich dostęp” wskazuje pytanie, na które trzeba odpowiedzieć.
Przy każdej przeszkodzie zaznacz, czy wskazał ją rozmówca, czy jest twoim przypuszczeniem. Dopisz sposób sprawdzenia: kolejną rozmowę, zajrzenie do instrukcji, pytanie do dostawcy programu lub konsultację techniczną.
Nie musisz od razu usuwać każdej przeszkody. Na tym etapie ustal przede wszystkim, które z nich mogą uniemożliwić spełnienie głównej obietnicy i wymagają wyjaśnienia przed dalszą pracą.
Po tym punkcie masz listę rzeczy potrzebnych do rozpoczęcia korzystania, niezbędnych połączeń i przeszkód. Wiesz, co zostało sprawdzone, a co pozostaje niewiadomą.',
          '["Paul Graham, Do Things that Don’t Scale. Osobista pomoc pierwszym użytkownikom i wykonywanie części pracy ręcznie na początku. Tekst źródłowy.","Geoff Ralston, YC’s Essential Startup Advice. Szukanie prostego sposobu dostarczenia podstawowej korzyści bez przedwczesnej rozbudowy produktu. Tekst źródłowy.","Instrukcje dotyczące danych i połączeń między programami są rozwinięciem ćwiczenia Vairo. Ocena konkretnego połączenia wymaga dokumentacji danego narzędzia, a ocena prawna danych wymaga osobnego sprawdzenia."]'::jsonb, null,
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
  values (v_point, 'czego-potrzebuje', 'Czego program potrzebuje na początek',
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
  values (v_subpoint, 'dane', 'list_short',
          'Jakie dane, pliki, dostępy lub ustawienia są potrzebne przed pierwszym użyciem?', 'Jeśli żadne — wpisz „nic nie jest potrzebne”. To bardzo dobra wiadomość dla twojego produktu.', null,
          true, 'idea.start-korzystania.czego-potrzebuje.dane',
          '{"min_items":1,"max_items":12,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'skad-je-wezmie', 'short_text',
          'Skąd użytkownik je weźmie i czy może je udostępnić?', null, null,
          true, 'idea.start-korzystania.czego-potrzebuje.skad-je-wezmie',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'legalnosc', 'short_text',
          'Czy udostępnienie tych danych jest legalne? Jeśli tak, na jakiej podstawie?', 'Dane osobowe, dane klientów, dane finansowe — tu zaczynają się realne przeszkody, o których łatwo zapomnieć.', null,
          true, 'idea.start-korzystania.czego-potrzebuje.legalnosc',
          '{"min":5,"max":400}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['dane', 'skad-je-wezmie', 'legalnosc']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'integracje', 'Sprawdź potrzebne połączenia z innymi programami',
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
  values (v_subpoint, 'z-czym', 'list_short',
          'Z jakimi programami twoje rozwiązanie musi wymieniać dane, żeby spełnić główną obietnicę?', 'Jeśli z żadnymi — wpisz „z żadnymi”. Każda integracja to tygodnie pracy, więc warto wiedzieć na pewno.', null,
          true, 'idea.start-korzystania.integracje.z-czym',
          '{"min_items":1,"max_items":12,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'prostszy-sposob', 'short_text',
          'Czy na początku wystarczy prostszy sposób, np. przesłanie pliku? Czy tamte programy w ogóle na to pozwalają?', null, null,
          true, 'idea.start-korzystania.integracje.prostszy-sposob',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['z-czym', 'prostszy-sposob']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'warunki-startu', 'Zapisz warunki rozpoczęcia korzystania',
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
  values (v_subpoint, 'co-powstrzyma', 'list_short',
          'Co mogłoby powstrzymać klienta przed użyciem programu online albo przechowywaniem w nim danych?', null, null,
          true, 'idea.start-korzystania.warunki-startu.co-powstrzyma',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'potwierdzone-vs-domysly', 'list_short',
          'Które z tych przeszkód wskazali rozmówcy, a które dopiero trzeba sprawdzić?', 'Dopisz przy każdej: „powiedział rozmówca” albo „mój domysł”. Domysły są do sprawdzenia, nie do planowania.', null,
          true, 'idea.start-korzystania.warunki-startu.potwierdzone-vs-domysly',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-powstrzyma', 'potwierdzone-vs-domysly']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['czego-potrzebuje', 'integracje', 'warunki-startu']);

  -- ── punkt 3: Sprawdź, czy jeden program może służyć różnym klientom
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'jeden-program-rozni-klienci', 'Sprawdź, czy jeden program może służyć różnym klientom', 'Porównaj potrzeby rozmówców. Sprawdź, czy możesz zaoferować im wspólny produkt i jakiej pomocy będą potrzebować.',
          null, 'Oddziel wspólne potrzeby od indywidualnych życzeń
Wróć do notatek z rozmów. Porównaj, co poszczególne osoby próbują osiągnąć i jakie działania są do tego potrzebne. Szukaj wspólnego zadania, które twój program może obsługiwać w podobny sposób.
Korepetytor, trener i nauczyciel muzyki mogą potrzebować ustalania wolnych terminów, przyjmowania rezerwacji i przypominania o zajęciach. Jednocześnie każdy może mieć dodatkowe oczekiwania związane ze swoją pracą.
Przy wspólnych potrzebach dopisz, którzy rozmówcy je zgłosili. Osobno wypisz życzenia pojedynczych osób. Dzięki temu łatwiej zauważysz, czy rozbudowujesz główny pomysł, czy zaczynasz tworzyć osobny produkt dla jednego klienta.
Różne oczekiwania nie zawsze wymagają osobnych wersji programu. Czas trwania wizyty, nazwa usługi i godziny dostępności mogą być ustawieniami. Większa różnica pojawia się wtedy, gdy klient potrzebuje innego sposobu działania, np. układania grafiku kilkudziesięciu pracowników zamiast rezerwowania pojedynczych zajęć.
Przy nietypowym życzeniu zapytaj, jaki problem ma ono rozwiązać. Sprawdź, czy podobna potrzeba pojawiła się u innych osób i czy mieści się w głównej obietnicy programu.
Nie musisz obsługiwać wszystkich grup od początku. Jeśli potrzeby wyraźnie się rozchodzą, możesz zawęzić grupę pierwszych klientów.
Określ potrzebną pomoc
Zapisz, co trzeba przygotować osobno dla każdego klienta. Może to być przeniesienie danych, ustawienie konta, połączenie kalendarza lub wyjaśnienie sposobu obsługi.
Następnie opisz pomoc potrzebną później. Oddziel czynności wykonywane raz od tych, które będą wracać.
Przykład:
Na początku pomagasz użytkownikowi wpisać usługi i ustawić dostępność.
Później użytkownik sam obsługuje rezerwacje.
Przy zmianie sposobu pracy może potrzebować wyjaśnienia ustawień.
Taki opis pokazuje, kto wykonuje pracę i kiedy. Ogólne „klient będzie potrzebował wsparcia” nie daje jeszcze wystarczającej informacji.
Na początku możesz pomagać osobiście. Dzięki temu poznasz trudności użytkowników i zobaczysz, które czynności warto uprościć. Zaznacz jednak, czy pomoc ma być tymczasowa, czy pozostanie stałą częścią usługi.
Nie musisz teraz dokładnie wyceniać każdej czynności. Wskaż przede wszystkim te obowiązki, które mogą regularnie zajmować dużo czasu albo wymagać osobnego podejścia do każdego klienta.
Wskaż największą niewiadomą
Przejrzyj oczekiwania i potrzebną pomoc. Zastanów się, czy któreś z nich oznacza tworzenie osobnej wersji programu albo stałe wykonywanie pracy za klienta.
Samo występowanie takiej potrzeby nie przekreśla pomysłu. Trzeba jednak wiedzieć, czy dotyczy jednej osoby, czy większości wybranych odbiorców, oraz jak wpływa na zakres oferowanej usługi.
Wybierz sprawę, która najbardziej wymaga wyjaśnienia przed budową. Może to być:
Niepewność, czy klienci dostarczają dane w podobnym formacie.
Oczekiwanie innych funkcji przez każdego rozmówcę.
Konieczność regularnego poprawiania danych za użytkownika.
Duża różnica między potrzebami grup, które chcesz obsługiwać.
Dopisz, co sprawdzisz i z kim. Na przykład: „Porównam przykładowe pliki rozmówców i zapytam programistę, czy da się je obsłużyć jednym sposobem wczytywania”.
Unikaj ogólnego „muszę sprawdzić, czy da się to zrobić”. Sformułuj pytanie, na które konkretna osoba może odpowiedzieć. Jeśli nie wiesz, czy oczekiwanie jest w ogóle ważne dla klienta, wróć do rozmówcy. Jeśli nie wiesz, jak wpłynie na budowę programu, porozmawiaj z osobą techniczną.
Po tym punkcie masz opis wspólnej części produktu, listę indywidualnych oczekiwań i obraz potrzebnej pomocy. Wiesz też, którą niewiadomą trzeba wyjaśnić w pierwszej kolejności.',
          '["Paul Graham, Do Things that Don’t Scale. Uczenie się przez bezpośrednią pracę z pierwszymi klientami, zanim wszystkie czynności zostaną zautomatyzowane. Tekst źródłowy.","Geoff Ralston, YC’s Essential Startup Advice. Ograniczanie zakresu, świadomy wybór klientów i unikanie rozbudowy produktu pod każdą pojawiającą się prośbę. Tekst źródłowy.","Eric Migicovsky, How to Talk to Users. Poznawanie problemu stojącego za prośbą o funkcję. Omówienie i zapis wykładu w YC."]'::jsonb, null,
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
  values (v_point, 'wspolne-vs-indywidualne', 'Oddziel wspólne potrzeby od indywidualnych życzeń',
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
  values (v_subpoint, 'wspolne', 'list_short',
          'Co program ma robić tak samo dla większości pierwszych klientów?', 'To jest twój właściwy produkt. Reszta to opcje.', null,
          true, 'idea.jeden-program-rozni-klienci.wspolne-vs-indywidualne.wspolne',
          '{"min_items":1,"max_items":12,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'indywidualne', 'list_short',
          'Jakich zmian albo dodatków oczekują tylko pojedynczy rozmówcy?', null, null,
          true, 'idea.jeden-program-rozni-klienci.wspolne-vs-indywidualne.indywidualne',
          '{"min_items":1,"max_items":12,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['wspolne', 'indywidualne']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'potrzebna-pomoc', 'Określ potrzebną pomoc',
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
  values (v_subpoint, 'przygotowanie', 'list_short',
          'Co trzeba będzie przygotować albo ustawić osobno dla każdego klienta?', 'Im dłuższa ta lista, tym trudniej obsłużyć dziesiątego klienta tak samo dobrze jak pierwszego.', null,
          true, 'idea.jeden-program-rozni-klienci.potrzebna-pomoc.przygotowanie',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'pozniejsza-pomoc', 'list_short',
          'Jakiej pomocy klient może potrzebować później?', 'Np. przy zmianie ustawień, danych albo sposobu pracy.', null,
          true, 'idea.jeden-program-rozni-klienci.potrzebna-pomoc.pozniejsza-pomoc',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['przygotowanie', 'pozniejsza-pomoc']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'najwieksza-niewiadoma', 'Wskaż największą niewiadomą',
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
  values (v_subpoint, 'osobna-wersja', 'short_text',
          'Czy któreś oczekiwanie wymaga osobnej wersji programu albo regularnego wykonywania pracy za klienta?', 'Jeśli tak, to nie jest już SaaS, tylko usługa. To nie musi być zła wiadomość — ale warto wiedzieć.', null,
          true, 'idea.jeden-program-rozni-klienci.najwieksza-niewiadoma.osobna-wersja',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'do-wyjasnienia', 'short_text',
          'Co musisz wyjaśnić przed rozpoczęciem budowy i z kim to sprawdzisz?', null, null,
          true, 'idea.jeden-program-rozni-klienci.najwieksza-niewiadoma.do-wyjasnienia',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['osobna-wersja', 'do-wyjasnienia']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['wspolne-vs-indywidualne', 'potrzebna-pomoc', 'najwieksza-niewiadoma']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['za-co-placi', 'start-korzystania', 'jeden-program-rozni-klienci']);

  -- ═══ kategoria: B2B ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2b', 'B2B', 'Sprzedajesz firmom. Pamiętaj, że osoba korzystająca z twojego rozwiązania rzadko decyduje o jego zakupie — pracownik potrzebuje lepszego narzędzia, ale zgodę wydaje szef. Sprawdzisz, komu w firmie pomagasz, kto zatwierdza zakup i co musi się wydarzyć, żeby firma zaczęła korzystać.',
          false, 3)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Sprawdź, jak klient podejmuje decyzję o zakupie
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'decyzja-o-zakupie', 'Sprawdź, jak klient podejmuje decyzję o zakupie', null,
          null, 'Opisz docelową firmę i użytkownika w firmie
Zacznij od profilu przygotowanego wcześniej. Uzupełnij go o cechy, które mają znaczenie dla zakupu: czym firma się zajmuje, jak jest duża i w jakiej sytuacji potrzebuje twojej pomocy.
Przykładowy opis może brzmieć: "Firma cateringowa zatrudniająca od 10 do 30 osób, która codziennie przygotowuje posiłki dla kilku biur i ma trudności z kontrolowaniem zwrotów pojemników". Taki opis pomaga wybrać firmy, do których warto się odezwać.
Następnie wskaż osobę, która będzie korzystać z rozwiązania. Opisz jej obowiązki i sposób pracy związany z problemem. W przykładzie z cateringiem może to być osoba wydająca posiłki kierowcom i przyjmująca zwroty pojemników.
Nie musisz znać nazwiska konkretnego pracownika. Na początek wystarczy jego rola. W małej firmie użytkownikiem i osobą kupującą może być sam właściciel.
Kto decyduje o zakupie
Przypisz role osobom uczestniczącym w zakupie: kto odczuwa problem, kto może przeznaczyć pieniądze na rozwiązanie, kto zatwierdza zakup i kto podpisuje umowę. Zaznacz także, kto może zgłosić zastrzeżenia.
Jedna osoba może pełnić kilka tych ról. Nie dopisuj kolejnych stanowisk tylko po to, żeby zapełnić listę.
Rozróżnienie użytkownika i osoby decydującej o wydatku jest ważne: pracownik może potrzebować pomocy, ale nie mieć możliwości zamówienia rozwiązania. Zwracają na to uwagę zarówno Eric Migicovsky, jak i autorzy badania dotyczącego startupów B2B.
Podczas rozmowy możesz zapytać: "Kiedy ostatnio kupowaliście coś podobnego, kto uczestniczył w podjęciu decyzji?".
Sprawdź wymagane zgody
Najpierw wskaż dział lub osobę, której chcesz pomóc. Potem ustal, czy zakup wymaga sprawdzenia przez kogoś jeszcze.
Przykładowo: wyposażenie kupuje kierownik magazynu, ale większy wydatek zatwierdza właściciel. Usługę zamawia marketing, a treść umowy sprawdza prawnik. Dział korzystający z rozwiązania i dział sprawdzający zakup mogą być różne.
Wymienione w zadaniu IT, finanse czy dział prawny to przykłady. Nie zakładaj, że każda firma ma takie działy ani że każdy zakup wymaga ich zgody.
Przy każdej potrzebnej zgodzie dopisz krótko, czego dotyczy. "Zgoda właściciela na wydatek" mówi więcej niż samo "właściciel".
Ścieżka zakupowa
Ułóż poznane działania w kolejności. Wystarczy krótka lista opisująca, jak firma przechodzi od zauważenia potrzeby do korzystania z zakupu.
Przykład dla wyposażenia magazynu:
Kierownik zauważa, że obecne wyposażenie spowalnia pakowanie.
Szuka odpowiedniego rozwiązania i porównuje oferty.
Właściciel zatwierdza wydatek.
Firma składa zamówienie i ustala dostawę.
Pracownicy zaczynają korzystać z wyposażenia.
Jeśli twoja oferta obejmuje dalszą współpracę, dopisz moment decyzji o jej kontynuowaniu. Przy jednorazowym zakupie odnowienie umowy może nie występować.
Tutaj wystarczą nazwy kroków. Czas oczekiwania opiszesz w punkcie 2, a przygotowania po zakupie w punkcie 4.',
          '["Brecht i współautorzy, Discovery and Validation of Business Models: How B2B Startups can use Business Experiments, szczególnie rozróżnienie użytkownika i osoby podejmującej decyzję.","Eric Migicovsky, How to Talk to Users, szczególnie pytania o wcześniejsze doświadczenia i możliwość zatwierdzenia wydatku."]'::jsonb, null,
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
  values (v_point, 'docelowa-firma', 'Opisz docelową firmę i użytkownika',
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
  values (v_subpoint, 'profil-firmy', 'long_text',
          'Opisz profil idealnego klienta — firmy.', 'Branża, wielkość, liczba pracowników, sposób pracy, dojrzałość technologiczna. Im węziej, tym łatwiej ją znaleźć.', null,
          true, 'idea.decyzja-o-zakupie.docelowa-firma.profil-firmy',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'profil-uzytkownika', 'long_text',
          'Opisz osobę, która będzie korzystać z twojego rozwiązania.', 'Rola, sytuacja, branża i inne cechy kluczowe dla twojego pomysłu. Jeśli odpowiadałeś już na to w Ogólnej walidacji, zobaczysz tu swoją odpowiedź.', null,
          true, 'idea.profil-uzytkownika',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['profil-firmy', 'profil-uzytkownika']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'kto-decyduje', 'Kto decyduje o zakupie',
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
  values (v_subpoint, 'role', 'list_short',
          'Kto ma problem, kto dysponuje budżetem, kto podpisuje umowę, a kto może zablokować zakup?', 'Wypisz jedną rolę na pozycję. Często to cztery różne osoby — i każda potrzebuje innego argumentu.', null,
          true, 'idea.decyzja-o-zakupie.kto-decyduje.role',
          '{"min_items":1,"max_items":8,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['role']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'wymagane-zgody', 'Sprawdź wymagane zgody',
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
  values (v_subpoint, 'dzialy', 'list_short',
          'Do jakich działów musisz dotrzeć?', 'Np. IT, prawny, bezpieczeństwo, finanse. Każdy z nich potrafi zatrzymać zakup na tygodnie.', null,
          true, 'idea.decyzja-o-zakupie.wymagane-zgody.dzialy',
          '{"min_items":1,"max_items":8,"item_max":150}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'dodatkowe-zgody', 'short_text',
          'Czy potrzebna jest zgoda jeszcze od kogoś?', null, null,
          true, 'idea.decyzja-o-zakupie.wymagane-zgody.dodatkowe-zgody',
          '{"min":3,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['dzialy', 'dodatkowe-zgody']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'sciezka-zakupowa', 'Ścieżka zakupowa',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'kroki', 'list_short',
          'Rozpisz proces od pojawienia się problemu aż do decyzji, a potem do użytkowania i odnowienia umowy.', 'Jedna pozycja to jeden krok. Zobaczysz, ile rzeczy musi się wydarzyć, zanim ktoś zapłaci.', null,
          true, 'idea.decyzja-o-zakupie.sciezka-zakupowa.kroki',
          '{"min_items":3,"max_items":15,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['kroki']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['docelowa-firma', 'kto-decyduje', 'wymagane-zgody', 'sciezka-zakupowa']);

  -- ── punkt 2: Zbadaj czas i warunki procesu sprzedaży
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'czas-sprzedazy', 'Zbadaj czas i warunki procesu sprzedaży', null,
          null, 'Sprawdź, jak firma podejmuje decyzję o zakupie
Wróć do listy osób i zgód z punktu 1. Teraz ustal, kiedy firma może podjąć decyzję i przeznaczyć pieniądze na zakup.
Budżet to pieniądze zaplanowane na określone wydatki. Firma może mieć już środki na podobny zakup albo potrzebować uwzględnić go w kolejnych planach. Nie zakładaj z góry, że musi czekać do następnego roku.
Pomocne pytanie brzmi: "Jak wyglądał ostatni podobny zakup i ile czasu minęło od zgłoszenia potrzeby do zamówienia?". Pytanie o konkretną sytuację jest zgodne z podejściem Migicovsky’ego do rozmów z użytkownikami.
Jeśli szukasz samodzielnie, sprawdź informacje dla dostawców, zapytania ofertowe i ogłoszenia zakupowe wybranej firmy. Mogą zawierać terminy lub wymagania. Brak takich informacji oznacza, że trzeba je ustalić inną drogą.
Zapisz przybliżony czas, jeśli masz na czym go oprzeć. Możesz też wskazać, od czego zależy, np. "właściciel zatwierdza drobne zakupy od razu; większe wydatki omawia raz w miesiącu".
Zidentyfikuj największe opóźnienia
Przejrzyj ścieżkę zakupu i zaznacz miejsca, w których firma może czekać na dalszy krok. Przykładem jest sprawdzenie umowy, zebranie kilku ofert, zakończenie obecnej współpracy lub znalezienie czasu na test.
Opisuj konkretnie: "Zakup czeka na porównanie trzech ofert". Samo "procedury" nie wyjaśnia, co trzeba zrobić ani gdzie powstaje opóźnienie.
Podczas rozmowy dopytaj, co zatrzymało poprzedni podobny zakup. Oddziel przeszkodę, która tylko wydłuża oczekiwanie, od warunku, bez którego firma w ogóle nie kupi.
Na koniec zapisz, co to oznacza dla twojego pomysłu. Jeśli wybrane firmy potrzebują kilku miesięcy na decyzję, uwzględnij to w planie zdobywania pierwszych klientów.',
          '["Eric Migicovsky, How to Talk to Users, zasady zbierania informacji o wcześniejszych zdarzeniach.","Gustaf Alströmer, How to Get Your First Customers, materiał dotyczący początków sprzedaży i zdobywania klientów. Szczegółowe pytania o terminy i zgody są dopasowaniem do zadań Vairo."]'::jsonb, null,
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
  values (v_point, 'jak-decyduje', 'Sprawdź, jak firma podejmuje decyzję',
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
  values (v_subpoint, 'ile-osob', 'short_text',
          'Czy wystarczy decyzja jednej osoby, czy potrzebna jest zgoda kilku?', null, null,
          true, 'idea.czas-sprzedazy.jak-decyduje.ile-osob',
          '{"min":5,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'budzet', 'short_text',
          'Czy firma może kupić takie rozwiązanie w dowolnym momencie, czy musi wcześniej zaplanować na nie pieniądze?', 'Zaplanowany budżet oznacza, że sprzedaż może czekać do przyszłego roku.', null,
          true, 'idea.czas-sprzedazy.jak-decyduje.budzet',
          '{"min":5,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ile-osob', 'budzet']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'opoznienia', 'Zidentyfikuj największe opóźnienia',
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
  values (v_subpoint, 'co-opozni', 'list_short',
          'Co może opóźnić proces?', 'Urlopy, audyt bezpieczeństwa, dział prawny, koniec roku obrotowego, zmiana osoby na stanowisku.', null,
          true, 'idea.czas-sprzedazy.opoznienia.co-opozni',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-opozni']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['jak-decyduje', 'opoznienia']);

  -- ── punkt 3: Sprawdź, czy klient zarobi więcej, niż zapłaci
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'roi', 'Sprawdź, czy klient zarobi więcej, niż zapłaci', 'ROI (Return On Investment) to prosta odpowiedź na pytanie: czy to się firmie opłaci. Nie potrzebujesz arkusza — wystarczy uczciwy szacunek.',
          null, 'Ile kosztuje klienta problem
Wykorzystaj informacje z części ogólnej. Uzupełnij je tak, żeby dało się porównać obecną sytuację z przewidywaną poprawą.
Wybierz jeden okres, np. miesiąc. Zapisz, ile czasu firma poświęca na dany problem, jakie ponosi wydatki i ile pojawia się błędów. Przy błędach wyjaśnij także ich skutki: dodatkowa dostawa, poprawianie zamówienia, zmarnowane materiały.
Przykład: "W ciągu miesiąca firma wysyła około 20 paczek z pomyłką. Ponowna wysyłka kosztuje średnio 25 zł za paczkę, czyli łącznie około 500 zł".
Jeśli masz tylko szacunki rozmówcy, zaznacz to. Gdy brakuje kwot, pozostaw liczbę godzin lub błędów i dopisz, czego jeszcze potrzebujesz do obliczenia kosztu.
Migicovsky proponuje pytać o obecny koszt problemu i dostępny budżet. Hale wskazuje kosztowny lub pilny problem jako jeden z powodów, dla których rozwiązanie może być potrzebne.
Przelicz korzyści na pieniądze i porównaj z ceną
Weź cenę z części ogólnej. Następnie oszacuj, jaką część obecnego kosztu twoje rozwiązanie może ograniczyć. Nie zakładaj automatycznie, że usunie wszystkie straty.
W przykładzie z paczkami możesz przyjąć do sprawdzenia, że liczba pomyłek spadnie o połowę. Oznaczałoby to oszczędność około 250 zł miesięcznie na ponownych wysyłkach. Jeśli rozwiązanie kosztuje 150 zł miesięcznie, różnica wynosi 100 zł przed uwzględnieniem pozostałych kosztów.
Porównuj ten sam okres. Przy zakupie jednorazowym możesz sprawdzić, po ilu miesiącach przewidywane oszczędności pokryją wydatek. Uwzględnij znane koszty rozpoczęcia korzystania, np. przygotowanie stanowiska lub szkolenie.
Uważaj na dwa częste błędy:
Zaoszczędzony czas nie zawsze oznacza mniejszy wydatek. Pracownik może wykorzystać go na inne zadania, otrzymując tę samą pensję.
Nie licz tej samej korzyści dwukrotnie. Jeśli koszt poprawiania błędów zawiera już pracę pracownika, nie dodawaj jej ponownie jako osobnej oszczędności.
Zapytaj osobę decydującą o zakupie, jaki wynik uzasadniałby wydatek i jak długo firma może na niego czekać. Zapisz to jako oczekiwanie do sprawdzenia w późniejszym teście.
Uwzględnij korzyści miękkie
"Korzyści miękkie" to zalety, którym trudno przypisać konkretną kwotę. Opisz, jak zmienią codzienną pracę.
Zamiast "większa wygoda" możesz zapisać: "Pracownicy sprawdzają status zamówienia w jednym miejscu i nie muszą dzwonić do magazynu". Zamiast "mniejszy stres": "Osoba odpowiedzialna za dostawy wcześniej widzi brakujące produkty".
Nie wymyślaj wartości pieniężnej tylko po to, żeby wynik obliczeń wyglądał lepiej. Zaznacz, kto wskazał daną korzyść i czy ma ona znaczenie dla osoby zatwierdzającej zakup.',
          '["Eric Migicovsky, How to Talk to Users, oraz Kevin Hale, How to Evaluate Startup Ideas, materiały i transkrypcja Y Combinator.","Brecht i współautorzy, Discovery and Validation of Business Models: How B2B Startups can use Business Experiments, badanie zadań klientów, poświęcanego czasu i kosztów. Przykład obliczeń jest ilustracją przygotowaną dla tego przewodnika."]'::jsonb, null,
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
  values (v_point, 'koszt-problemu', 'Ile kosztuje klienta problem',
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
  values (v_subpoint, 'czas', 'short_text',
          'Ile czasu kosztuje go problem dzisiaj?', null, 'Około 6 godzin tygodniowo, dwie osoby.',
          true, 'idea.roi.koszt-problemu.czas',
          '{"min":3,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'pieniadze', 'short_text',
          'Ile pieniędzy kosztuje go problem dzisiaj?', null, null,
          true, 'idea.roi.koszt-problemu.pieniadze',
          '{"min":3,"max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'bledy', 'short_text',
          'Ile błędów albo strat powoduje ten problem?', null, null,
          true, 'idea.roi.koszt-problemu.bledy',
          '{"min":3,"max":300}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['czas', 'pieniadze', 'bledy']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'przelicz-na-pieniadze', 'Przelicz korzyści na pieniądze i porównaj z ceną',
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
  values (v_subpoint, 'cena', 'short_text',
          'Jaką cenę zapłaci klient za twoje rozwiązanie?', null, null,
          true, 'idea.roi.przelicz-na-pieniadze.cena',
          '{"min":3,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'minimalny-wynik', 'short_text',
          'Jaki minimalny wynik i w jakim czasie przekona go do zakupu?', '„Musi zwrócić się w pół roku” to typowa odpowiedź. Warto ją znać przed rozmową o cenie.', null,
          true, 'idea.roi.przelicz-na-pieniadze.minimalny-wynik',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['cena', 'minimalny-wynik']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'korzysci-miekkie', 'Uwzględnij korzyści miękkie',
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
  values (v_subpoint, 'lista', 'list_short',
          'Zapisz zalety trudniejsze do przeliczenia.', 'Wygoda pracy, mniejszy stres zespołu, niższe ryzyko, lepszy wizerunek. Same nie zamkną sprzedaży, ale często przechylają szalę.', null,
          true, 'idea.roi.korzysci-miekkie.lista',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['lista']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['koszt-problemu', 'przelicz-na-pieniadze', 'korzysci-miekkie']);

  -- ── punkt 4: Sprawdź, czego firma potrzebuje po zakupie
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'po-zakupie', 'Sprawdź, czego firma potrzebuje po zakupie', 'Sprzedaż to nie koniec. Jeśli po podpisaniu umowy nikt nie zacznie korzystać, umowa się nie odnowi.',
          null, 'Ustal, co firma musi przygotować
W tej rozmowie przejdź do sytuacji po zakupie. Ustal, co trzeba przygotować, zanim pracownicy zaczną korzystać z produktu lub usługi.
Przy urządzeniu może to być miejsce i odpowiednie zasilanie. Przy usłudze przygotowania katalogu: zdjęcia, opisy produktów i osoba zatwierdzająca treść. Przy szkoleniu: termin oraz dostępność pracowników.
Do każdego przygotowania przypisz osobę po stronie firmy. Zaznacz również, co firma chce zrobić sama, a czego oczekuje od ciebie.
Na etapie pomysłu wystarczy rozpoznać najważniejsze warunki rozpoczęcia pracy. Jeżeli opisałeś już dane lub połączenia między programami w części SaaS, odwołaj się do tamtej odpowiedzi i uzupełnij ją o obowiązki po stronie klienta.
Sprawdź, jakiej pomocy potrzebują pracownicy
Ustal, co zmieni się w pracy osób korzystających z rozwiązania. Czy wystarczy krótka instrukcja, czy trzeba będzie pokazać nowy sposób wykonywania zadania?
Pomoc na początku może obejmować demonstrację, ustawienie wyposażenia lub wspólne wykonanie pierwszego zadania. Późniejsza pomoc może dotyczyć awarii, nowych pracowników lub zmian w sposobie korzystania.
Dopytuj o znaczenie ogólnych oczekiwań. Jeśli rozmówca mówi "potrzebujemy wsparcia", poproś o przykład sytuacji, w której będzie go potrzebować.
Zapisz, kto potrzebuje pomocy, w czym i czy będzie to jednorazowe, czy powtarzające się zadanie. To pozwoli później ustalić zakres obsługi klienta.
Ustal, co może utrudnić korzystanie
Porozmawiaj o tym, co mogłoby przeszkodzić pracownikom w przyjęciu nowego sposobu pracy. Pomocne będzie pytanie o wcześniejszy zakup, z którego firma korzystała rzadko albo całkiem zrezygnowała.
Poproś o opis przyczyny. Czy zabrakło czasu na naukę? Czy rozwiązanie dokładało obowiązków? Czy osoba odpowiedzialna za rozpoczęcie korzystania odeszła z firmy?
W badaniu Brechta i współautorów rozmowy ujawniły między innymi problem wpisywania informacji do kilku systemów. To przykład przeszkody, którą można przeoczyć, skupiając się wyłącznie na funkcjach produktu.
Przy każdym wskazanym utrudnieniu zapisz, czy wynika z wcześniejszego doświadczenia firmy, czy jest obawą dotyczącą twojego pomysłu. Wybierz najważniejszą przeszkodę do wyjaśnienia przed budową lub pierwszym testem.
Jeśli nie masz jeszcze rozmówcy, zapisz pytania i osobę, do której warto z nimi dotrzeć. Możesz wykorzystać rozmowy prowadzone w części ogólnej i uzupełnić je o te zagadnienia.',
          '["Brecht i współautorzy, Discovery and Validation of Business Models: How B2B Startups can use Business Experiments, szczególnie wnioski dotyczące dopasowania rozwiązania do dotychczasowej pracy klienta.","Eric Migicovsky, How to Talk to Users, pytania o wcześniejsze doświadczenia i trudności z dotychczasowymi rozwiązaniami."]'::jsonb, null,
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
  values (v_point, 'przygotowanie', 'Ustal, co firma musi przygotować',
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
  values (v_subpoint, 'co-musi-sie-wydarzyc', 'list_short',
          'Co musi się wydarzyć między zakupem a rozpoczęciem korzystania?', 'Np. przygotowanie miejsca, przekazanie materiałów albo zmiana sposobu pracy.', null,
          true, 'idea.po-zakupie.przygotowanie.co-musi-sie-wydarzyc',
          '{"min_items":1,"max_items":12,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'kto-sie-zajmie', 'short_text',
          'Kto w firmie zajmie się tym przygotowaniem?', null, null,
          true, 'idea.po-zakupie.przygotowanie.kto-sie-zajmie',
          '{"min":5,"max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-musi-sie-wydarzyc', 'kto-sie-zajmie']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'pomoc-pracownikow', 'Sprawdź, jakiej pomocy potrzebują pracownicy',
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
  values (v_subpoint, 'czego-sie-naucza', 'list_short',
          'Czego będą musieli się nauczyć, żeby korzystać z rozwiązania?', null, null,
          true, 'idea.po-zakupie.pomoc-pracownikow.czego-sie-naucza',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'jaka-pomoc', 'list_short',
          'Jakiej pomocy oczekują od ciebie na początku, a jakiej później?', null, null,
          true, 'idea.po-zakupie.pomoc-pracownikow.jaka-pomoc',
          '{"min_items":1,"max_items":10,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['czego-sie-naucza', 'jaka-pomoc']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'co-utrudni', 'Ustal, co może utrudnić korzystanie',
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
  values (v_subpoint, 'powroty-do-starego', 'list_short',
          'Co może sprawić, że pracownicy zostaną przy starym sposobie pracy mimo zakupu?', 'Brak czasu na naukę, konieczność robienia tej samej rzeczy dwa razy, przyzwyczajenie, brak wsparcia szefa.', null,
          true, 'idea.po-zakupie.co-utrudni.powroty-do-starego',
          '{"min_items":1,"max_items":10,"item_max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'poprzednie-zakupy', 'short_text',
          'Czy firma kupiła wcześniej coś podobnego, z czego potem nie korzystano? Jeśli tak, dlaczego?', 'To najcenniejsze pytanie w całym punkcie. Odpowiedź mówi, czego uniknąć.', null,
          true, 'idea.po-zakupie.co-utrudni.poprzednie-zakupy',
          '{"min":5,"max":500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['powroty-do-starego', 'poprzednie-zakupy']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['przygotowanie', 'pomoc-pracownikow', 'co-utrudni']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['decyzja-o-zakupie', 'czas-sprzedazy', 'roi', 'po-zakupie']);

  -- ═══ kategoria: B2C ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'b2c', 'B2C', 'Sprzedajesz osobom prywatnym. Sprawdzisz cztery rzeczy: ile kosztuje zdobycie klienta, czy ludzie naprawdę chcą korzystać, czy są gotowi zapłacić i czy będą polecać dalej. Celem nie jest jeszcze skala, tylko wczesne wykrycie ryzyk.',
          false, 4)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Jak znaleźć klientów i ile to kosztuje
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'pozyskanie-klientow', 'Jak znaleźć klientów i ile to kosztuje', null,
          null, 'Określ dla kogo jest produkt
Najpierw, określ dokładnie do kogo kierujesz swój produkt. Spróbuj bardzo szczegółowo określić charakterystykę twojego klienta. Przykładowo, jeśli twoim pomysłem byłby innowacyjny kurs maturalny, nie pisz "moim klientem jest uczeń szkoły średniej". Napisz "Moim klientem jest uczeń szkoły średniej przygotowujący się do zdawania matury z języka angielskiego na poziomie rozszerzonym. Kieruję produkt do uczniów, którzy zmienili ścieżkę nauki, mają zaległości/trudności w nauce i potrzebują nadrobić naukę w rekordowym czasie". Ważne jest, aby dokładnie wiedzieć, kto będzie korzystał z twojego rozwiązania. Dzięki temu łatwiej będzie ci znaleźć klientów oraz bezpośrednią konkurencje.
Znajdź, gdzie przebywają twoi klienci
Zastanów się jak najłatwiej dotrzeć do klienta i gdzie go pozyskać. Dzisiaj są to najczęściej grupy na portalach społecznościowych, targi, wydarzenia tematyczne, czy reklamy. Pomyśl, gdzie twoja grupa docelowa uzyskuje informację, dzieli się przemyśleniami, szuka rozwiązania. Dokładne określenie tego miejsca jest kluczowe w pozyskaniu klienta i kontakcie z nim.
Przetestuj proste ogłoszenie:
Stwórz ogłoszenie dotyczące twojego produktu. Udostępnij je w wybranym kanale społecznościowym, z którego korzystają potencjalni klienci. Zobacz kogo zainteresuje Twój pomysł i ile użytkowników możesz zdobyć. Nie musi to być ogłoszenie finalnego produktu. Klienci sami podpowiedzą ci czego potrzebują i co sprawi, że twój produkt się wyróżni. Skorzystaj z ich wiedzy oraz feedbacku.
Policz koszt zdobycia jednego klienta:
Podziel ilość pieniędzy wydanych na reklamy lub promocję ogłoszenia przez ilość klientów, którzy zadeklarowali chęć korzystania z produktu. W tym podpunkcie uwzględniasz również wynagrodzenie zespołu marketingowego, koszty narzędzi mailingowych itd.  Dzięki temu dowiesz się ile kosztuje cię zdobycie jednego klienta. Jeśli twój sposób promocji nie wymagał dodatkowych źródeł finansowania, napisz to w luce. Im taniej zdobędziesz klientów, tym lepiej. Pamiętaj jednak, że czasem warto skorzystać z opcji płatnych ogłoszeń i reklam, dzięki temu dotrzesz do szerszej liczby odbiorów.
Wybierz sposób reklamowania:
Na początku nie warto zamykać się na jeden sposób reklamowania. Przetestuj różne źródła. Dzięki temu zobaczysz, gdzie najkorzystniej jest zdobyć klientów. Po zakończonej fazie testów, wybierz źródło, które dało najlepsze efekty. Pamiętaj, aby zachować jedno lub dwa dodatkowe na przyszłość.',
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
  values (v_point, 'gdzie-sa-klienci', 'Znajdź miejsca, gdzie są twoi klienci',
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
  values (v_subpoint, 'do-kogo', 'short_text',
          'Do kogo dokładnie kierujesz produkt?', 'Im węziej, tym taniej ich znajdziesz. „Wszyscy” to najdroższa grupa docelowa świata.', null,
          true, 'idea.pozyskanie-klientow.gdzie-sa-klienci.do-kogo',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'miejsca', 'list_short',
          'Wybierz 3–5 miejsc, gdzie najłatwiej do nich dotrzeć.', 'Np. grupy na Facebooku, reklamy, targi, fora tematyczne, newslettery branżowe.', null,
          true, 'idea.pozyskanie-klientow.gdzie-sa-klienci.miejsca',
          '{"min_items":3,"max_items":5,"item_max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['do-kogo', 'miejsca']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'test-ogloszenia', 'Przetestuj proste ogłoszenie',
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
  values (v_subpoint, 'wypuszczone', 'checkmark',
          'Wypuściłem krótką informację o produkcie w wybranych miejscach.', 'Nie potrzebujesz produktu — wystarczy opis tego, co zamierzasz zrobić.', null,
          true, 'idea.pozyskanie-klientow.test-ogloszenia.wypuszczone',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'kogo-zainteresowalo', 'long_text',
          'Kogo zainteresował twój pomysł?', 'Kto zareagował, o co pytał, czy to byli ci ludzie, których się spodziewałeś?', null,
          true, 'idea.pozyskanie-klientow.test-ogloszenia.kogo-zainteresowalo',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ile-osob', 'number',
          'Ile osób zadeklarowało chęć skorzystania?', null, null,
          true, 'idea.pozyskanie-klientow.test-ogloszenia.ile-osob',
          '{"min":0,"unit":"osób"}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['wypuszczone', 'kogo-zainteresowalo', 'ile-osob']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'koszt-klienta', 'Policz koszt zdobycia jednego klienta',
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
  values (v_subpoint, 'wydane', 'number',
          'Ile pieniędzy wydałeś na dotarcie do tych osób?', 'Reklamy, materiały, wejściówki na targi. Jeśli nic nie wydałeś, wpisz 0.', null,
          true, 'idea.pozyskanie-klientow.koszt-klienta.wydane',
          '{"min":0,"unit":"zł"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cac', 'number',
          'Ile kosztowało zdobycie jednej zainteresowanej osoby?', 'Podziel wydane pieniądze przez liczbę osób. To jest CAC — koszt pozyskania klienta.', null,
          true, 'idea.pozyskanie-klientow.koszt-klienta.cac',
          '{"min":0,"unit":"zł"}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'czy-oplaca', 'short_text',
          'Czy przy takim koszcie to się w ogóle opłaca?', 'Porównaj z ceną, jaką planujesz. Jeśli zdobycie klienta kosztuje więcej, niż on zapłaci — masz problem do rozwiązania teraz, nie później.', null,
          true, 'idea.pozyskanie-klientow.koszt-klienta.czy-oplaca',
          '{"min":10,"max":500}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['wydane', 'cac', 'czy-oplaca']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'glowny-kanal', 'Wybierz jeden główny sposób docierania',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'glowny', 'short_text',
          'Które miejsce dało najlepsze i najtańsze efekty?', null, null,
          true, 'idea.pozyskanie-klientow.glowny-kanal.glowny',
          '{"min":5,"max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'zapasowy', 'short_text',
          'Które zostawiasz jako zapasowe?', 'Jeden kanał to ryzyko. Drugi w odwodzie kosztuje niewiele, a ratuje, gdy pierwszy przestanie działać.', null,
          true, 'idea.pozyskanie-klientow.glowny-kanal.zapasowy',
          '{"min":5,"max":300}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['glowny', 'zapasowy']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['gdzie-sa-klienci', 'test-ogloszenia', 'koszt-klienta', 'glowny-kanal']);

  -- ── punkt 2: Sprawdź, czy ludzie naprawdę chcą z tego korzystać
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'czy-chca-korzystac', 'Sprawdź, czy ludzie naprawdę chcą z tego korzystać', 'Deklaracja to nie to samo co zachowanie. W tym punkcie patrzysz na to, co ludzie robią, a nie co mówią.',
          null, 'Pokaż produkt pierwszym testerom:
Zaproś do testów 5 osób. Nie musisz przedstawiać im gotowego produktu, wystarczy prototyp.  Korzystając z przykładu innowacyjnego kursu maturalnego,  twoim produktem na tym etapie może być: plan kilku zajęć, opracowana metoda przyswajania wiedzy, czy platforma. Pokaż testerom twój pomysł i przedstaw jak z niego korzystać. Otwórz się na feedback klientów. Lepiej jest przedstawić odbiorcom idee, którą będziesz mógł ulepszać w trakcie testów, niż gotowy produkt, który może okazać się nietrafny. Pierwsze testy są świetną okazją, aby idealnie dostosować finalny produkt do potrzeb rynkowych.
Patrz, jak klienci radzą sobie bez twojej pomocy:
Sprawdź, czy testerzy sami potrafią korzystać z twojego rozwiązania bez podpowiedzi. Pozwól im korzystać z produktu, bez ciągłego kontaktu z tobą. Dowiesz się czy produkt jest wystarczająco intuicyjny, łatwy w obsłudze i dopasowany do klienta. Przekonasz się, czy tester będzie sam z siebie używał produktu. Na tym etapie zdobędziesz cenny feedback, który warto wykorzystać.
Zobacz, czy sami z siebie wrócą:
Na etapie testowania, najważniejszym klientem jest ten, który sam do ciebie wraca. Takie osoby są kluczowe w dopracowywaniu produktu. Oznacza to, że produkt jest dla nich niezbędny. Pomoże ci to określić profil klienta idealnego oraz umożliwia budowanie długotrwałych relacji i poszerzanie bazy klientów. Jeśli, klienci nie wracają, warto skorzystać z ich wiedzy i dowiedzieć się co nie zadziałało. Może potrzebują zmiany w produkcie, bądź szukają czegoś innego. Zanotuj ile, klientów do ciebie wróciło, a ile się wycofało. Spytaj obie strony o feedback. Dowiesz się dzięki czemu klienci zostali, a co warto jeszcze poprawić.
Nie wierz w puste obietnice:
Podczas rozmów z klientami na temat twojego pomysłu liczą się konkrety. Nie wierz w pusty feedback typu "To super pomysł". Liczą się specyficzne pytania: "Czy ktoś kupi pomysł?", "Czy ktoś skorzysta z pomysłu?" Na etapie rozmów z klientem szukasz faktycznej informacji zwrotnej. Kogoś kogo zainteresuje twój pomysł, kogoś kto go kupi.',
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
  values (v_point, 'pierwsi-testerzy', 'Pokaż pomysł pierwszym testerom',
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
  values (v_subpoint, 'co-pokazales', 'short_text',
          'Co im pokazałeś?', 'Zamiast budować gotowy produkt, zrób prosty szkic albo pomóż ludziom „ręcznie”. Na tym etapie to wystarczy.', null,
          true, 'idea.czy-chca-korzystac.pierwsi-testerzy.co-pokazales',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'testerzy', 'list_short',
          'Zaproś do testów 5 osób z grupy docelowej i wypisz je tutaj.', null, null,
          true, 'idea.czy-chca-korzystac.pierwsi-testerzy.testerzy',
          '{"min_items":5,"max_items":15,"item_max":200}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-pokazales', 'testerzy']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'bez-pomocy', 'Patrz, jak radzą sobie bez twojej pomocy',
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
  values (v_subpoint, 'obserwacje', 'long_text',
          'Daj im proste zadanie i obserwuj z boku. Co zobaczyłeś?', 'Nie podpowiadaj. Miejsce, w którym się zacinają, jest ważniejsze niż wszystko, co powiedzą potem.', null,
          true, 'idea.czy-chca-korzystac.bez-pomocy.obserwacje',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['obserwacje']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'czy-wroca', 'Zobacz, czy sami z siebie wrócą',
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
  values (v_subpoint, 'ilu-wrocilo', 'number',
          'Ilu z nich korzystało dalej po kilku dniach, bez twojego przypominania?', null, null,
          true, 'idea.czy-chca-korzystac.czy-wroca.ilu-wrocilo',
          '{"min":0,"unit":"osób"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-powiedzieli', 'long_text',
          'Co powiedzieli ci, którzy przestali?', 'To najcenniejsza informacja w całym punkcie. Powód rezygnacji mówi więcej niż pochwała.', null,
          true, 'idea.czy-chca-korzystac.czy-wroca.co-powiedzieli',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ilu-wrocilo', 'co-powiedzieli']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'puste-obietnice', 'Oddziel realne sygnały od grzeczności',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'sygnaly', 'long_text',
          'Co było realnym sygnałem zainteresowania, a co zwykłą uprzejmością?', '„To fajny pomysł” nic nie znaczy. Liczy się to, że ktoś wrócił, zapytał kiedy będzie gotowe albo zaproponował zapłatę.', null,
          true, 'idea.czy-chca-korzystac.puste-obietnice.sygnaly',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['sygnaly']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['pierwsi-testerzy', 'bez-pomocy', 'czy-wroca', 'puste-obietnice']);

  -- ── punkt 3: Oceń gotowość do zapłaty
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'gotowosc-do-zaplaty', 'Oceń gotowość do zapłaty', null,
          null, 'Rozdziel płatnika od użytkownika, porównaj alternatywy:
Dowiedz się kto płaci za produkt, a kto z niego korzysta. Korzystając z naszego przykładu innowacyjnego kursu maturalnego: płatnikiem może być rodzic, a użytkownikiem uczeń klasy maturalnej. Jest to jeden z ważniejszym elementów prowadzenia skutecznego biznesu. Wiedza kto jest kim decyduje o przetrwaniu produktu. Płatnik szuka wartości biznesowej, stąd w tym punkcie porównujemy również koszt alternatyw, z których obecnie korzystają płatnicy. Użytkownik szuka wygody, intuicyjności i rozwiązania problemu. Te informacje pozwolą ci dostosować m.in. marketing produktu oraz realną wartość produktu.
Zbierz i skategoryzuj obiekcje typowe dla zakupów indywidualnych:
Oszacuj LTV i zestaw z CAC:
LTV (Lifetime value) to całkowity przychód lub zysk, jaki klient generuje dla firmy przez cały cykl współpracy. To miara tego, jak opłacalny jest klient. Pomaga określić, ile kosztuje pozyskanie jednego użytkownika.
Wzór na LTV:
LTV = Średnia wartość zamówienia * Średnia liczba zamówień w roku * Średni czas współpracy
Przykład:
Średnia wartość jednego zamówienia ( jednej transakcji) = 100 zł
Średnia liczba zamówień w roku = 2 razy
Średni czas współpracy z klientem = 4 lata
LTV = 100 zł * 2 * 4 = 800 zł  (Tyle warty jest klient przez czas współpracy.)
CAC to średni koszt pozyskania jednego klienta liczony w punkcie pierwszym. Dla przypomnienia: CAC=całkowite koszty marketingu/liczba pozyskanych klientów.
Na sam koniec dzielisz LTV przez CAC i wpisujesz w lukę otrzymany wynik.',
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
  values (v_point, 'platnik-vs-uzytkownik', 'Rozdziel płatnika od użytkownika',
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
  values (v_subpoint, 'kto-placi', 'short_text',
          'Czy płaci ta sama osoba, która korzysta?', 'Prezent, zakup dla dziecka, zakup dla rodzica — wtedy przekonujesz kogoś innego niż użytkownika.', null,
          true, 'idea.gotowosc-do-zaplaty.platnik-vs-uzytkownik.kto-placi',
          '{"min":5,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wydatki-na-alternatywy', 'short_text',
          'Ile klient wydaje dziś na podobne rozwiązania?', 'To twój punkt odniesienia dla ceny. Jeśli dziś nie wydaje nic, przekonanie go będzie znacznie trudniejsze.', null,
          true, 'idea.gotowosc-do-zaplaty.platnik-vs-uzytkownik.wydatki-na-alternatywy',
          '{"min":3,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['kto-placi', 'wydatki-na-alternatywy']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'obiekcje', 'Zbierz obiekcje i pogrupuj je',
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
  values (v_subpoint, 'lista', 'list_short',
          'Co powstrzymuje ludzi przed zakupem?', 'Przy każdej dopisz, z czego wynika: brak zaufania do marki, brak pilnej potrzeby, czy porównanie z łatwo dostępną alternatywą.', null,
          true, 'idea.gotowosc-do-zaplaty.obiekcje.lista',
          '{"min_items":1,"max_items":12,"item_max":300}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['lista']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'ltv-vs-cac', 'Oszacuj wartość klienta i zestaw ją z kosztem',
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
  values (v_subpoint, 'ltv', 'number',
          'Ile klient zapłaci ci łącznie przez cały czas korzystania?', 'To LTV. Policz prosto: średnia wartość zamówienia × liczba zamówień w roku × liczba lat.', null,
          true, 'idea.gotowosc-do-zaplaty.ltv-vs-cac.ltv',
          '{"min":0,"unit":"zł"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wniosek', 'short_text',
          'Jak LTV wypada przy koszcie pozyskania z punktu 1?', 'Przyjęta reguła mówi, że LTV powinno być kilkukrotnie wyższe od CAC. Jeśli jest odwrotnie, biznes traci na każdym kliencie.', null,
          true, 'idea.gotowosc-do-zaplaty.ltv-vs-cac.wniosek',
          '{"min":10,"max":500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ltv', 'wniosek']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['platnik-vs-uzytkownik', 'obiekcje', 'ltv-vs-cac']);

  -- ── punkt 4: Zweryfikuj potencjał poleceń
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'potencjal-polecen', 'Zweryfikuj potencjał poleceń', 'Polecenia to najtańszy sposób wzrostu w B2C. Sprawdzasz, czy w ogóle się zdarzają — nie czy ludzie deklarują, że poleciliby.',
          null, 'Zdefiniuj moment i powód polecenia:
Zdefiniuj co sprawia, że klient poleca twój produkt i kiedy się to dzieje. Są to kluczowe fundamenty utrzymywania relacji z klientem. Czasem sam produkt wystarczy, aby użytkownik  zachwycił się i polecił twój produkt innym. Innym razem klient potrzebuje przypomnienia w postaci mailingu, reklamy na mediach społecznościowych, czy wiadomości. Może użytkownik poleca twój produkt, bo nikt nie spełnia jego oczekiwań tak jak ty? Może jest to zaufanie do marki? Zbadaj tę tendencję i skorzystaj z niej w pozyskiwaniu kolejnych klientów.
Przetestuj rzeczywiste polecenia:
Sprawdź, czy osoby, którym został polecony twój produkt faktycznie z niego korzystają. Polecenie komuś produktu jest dopiero pierwszym etapem. Zobacz, czy z twojego rozwiązania faktycznie korzystają kolejni użytkownicy. Możesz skontaktować się z dotychczasowymi klientami, aby zobaczyć realną liczbę dalszych poleceń. Dzięki temu zdobędziesz informację ile następnych użytkowników przyniesie ci jeden klient.
Zbadaj komunikacje i porównaj warianty:
Zidentyfikuj mechanizm napędzający polecenia:
Oblicz wskaźnik poleceń i oceń potencjał wzrostu:',
          '["Y Combinator. (n.d.). How to get startup ideas. YC Startup Library. https://www.ycombinator.com/library/8z-how-to-get-startup-ideas","Pennington, I. (2025, September 25). Startup idea validation basics: How I test my next big idea before I build. Medium. https://medium.com/@isabellapennington/startup-idea-validation-basics-how-i-test-my-next-big-idea-before-i-build-d706d3f3397b","Y Combinator. (n.d.). Where do great startup ideas come from? Startup School. https://www.startupschool.org/curriculum/where-do-great-startup-ideas-come-from"]'::jsonb, null,
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
  values (v_point, 'powod-i-moment', 'Zdefiniuj powód i moment polecenia',
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
  values (v_subpoint, 'powod', 'short_text',
          'Co skłania użytkownika do polecenia?', null, null,
          true, 'idea.potencjal-polecen.powod-i-moment.powod',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'moment', 'short_text',
          'W którym momencie najchętniej się tym dzielą?', 'Zwykle tuż po pierwszym sukcesie z produktem, nie po miesiącu korzystania.', null,
          true, 'idea.potencjal-polecen.powod-i-moment.moment',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['powod', 'moment']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'rzeczywiste-polecenia', 'Przetestuj rzeczywiste polecenia',
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
  values (v_subpoint, 'ile-poproszonych', 'number',
          'Ilu testerów poprosiłeś o polecenie konkretnej osobie?', 'Poproś o realne polecenie, nie o deklarację „tak, polecę”.', null,
          true, 'idea.potencjal-polecen.rzeczywiste-polecenia.ile-poproszonych',
          '{"min":0,"unit":"osób"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ile-polecilo', 'number',
          'Ilu z nich faktycznie kogoś poleciło?', null, null,
          true, 'idea.potencjal-polecen.rzeczywiste-polecenia.ile-polecilo',
          '{"min":0,"unit":"osób"}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ile-podjelo-dzialanie', 'number',
          'Ile poleconych osób podjęło kolejne działanie?', null, null,
          true, 'idea.potencjal-polecen.rzeczywiste-polecenia.ile-podjelo-dzialanie',
          '{"min":0,"unit":"osób"}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ile-poproszonych', 'ile-polecilo', 'ile-podjelo-dzialanie']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'komunikacja', 'Zbadaj, jak o tym mówią',
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
  values (v_subpoint, 'jak-opisuja', 'long_text',
          'Jak użytkownicy opisują produkt, polecając go?', 'Ich słowa są lepsze od twoich. To gotowy materiał na stronę i reklamy.', null,
          true, 'idea.potencjal-polecen.komunikacja.jak-opisuja',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'organiczne-vs-motywowane', 'short_text',
          'Czy polecenia z nagrodą działały lepiej niż te bez?', 'Jeśli działają tylko z nagrodą, to nie jest jeszcze prawdziwe polecenie — to kupowanie ruchu.', null,
          true, 'idea.potencjal-polecen.komunikacja.organiczne-vs-motywowane',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['jak-opisuja', 'organiczne-vs-motywowane']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'mechanizm', 'Zidentyfikuj, co napędza polecenia',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'co-decyduje', 'select',
          'Co najsilniej wpływa na decyzję o poleceniu?', null, null,
          true, 'idea.potencjal-polecen.mechanizm.co-decyduje',
          '{"options":[{"value":"usefulness","label":"Użyteczność — produkt po prostu działa"},{"value":"altruism","label":"Korzyść dla drugiej osoby"},{"value":"social","label":"Relacja społeczna i dobre wrażenie"},{"value":"reward","label":"Nagroda albo rabat"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wskaznik', 'short_text',
          'Jaki wyszedł stosunek udanych poleceń do proszonych i czy to istotne źródło wzrostu?', null, null,
          true, 'idea.potencjal-polecen.mechanizm.wskaznik',
          '{"min":10,"max":500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['co-decyduje', 'wskaznik']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['powod-i-moment', 'rzeczywiste-polecenia', 'komunikacja', 'mechanizm']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['pozyskanie-klientow', 'czy-chca-korzystac', 'gotowosc-do-zaplaty', 'potencjal-polecen']);

  -- ═══ kategoria: Hardware ═══
  insert into public.stage_categories
    (template_id, key, title, intro, always_active, position)
  values (v_template, 'hardware', 'Hardware', 'Sprawdzasz, czy fizyczny produkt da się zbudować, wyprodukować i wprowadzić na rynek w sposób technicznie i ekonomicznie uzasadniony. Celem nie jest gotowe urządzenie, tylko wczesne wykrycie ryzyk: wykonalności, kosztów, czasu wejścia na rynek, popytu i wymogów zgodności.',
          false, 5)
  on conflict (template_id, key) do update set
    title = excluded.title, intro = excluded.intro,
    always_active = excluded.always_active, position = excluded.position
  returning id into v_category;

  -- ── punkt 1: Potwierdź problem i potrzebę fizycznego urządzenia
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'problem-i-potrzeba-fizyczna', 'Potwierdź problem i potrzebę fizycznego urządzenia', null,
          null, 'Budowa produktu fizycznego wymaga walidacji wykonalności technicznej, kosztów produkcji, popytu oraz wymogów zgodności jeszcze przed przystąpieniem do budowania działających prototypów. Proces na etapie Idea Stage rozpoczyna się od wywiadu z potencjalnymi użytkownikami i upewnienia się, że problem jest realny oraz że do jego rozwiązania konieczne jest fizyczne urządzenie, a nie prostsze rozwiązanie cyfrowe czy usługa. Następnie tworzy się koncepcję formy (form-factor) w postaci szkiców, wizualizacji 3D lub prostych makiet z kartonu bądź druku 3D (looks-like model), aby ustalić planowany rozmiar, ergonomię i sposób interakcji, a następnie przedstawia się ją klientom w celu zebrania opinii i sprawdzenia, czy rozumieją działanie konceptu.',
          '["Y Combinator Hardware Guide","The Hardware Startup\" — Renee DiResta, Brady Forrest, and Ryan Vian","Lean Hardware\" — Ben Einstein","Dragon Innovation Blog","Bolt Blog — Hardware Startups","Customer Development\" — Steve Blank","Testing Business Ideas\" — Alexander Osterwalder"]'::jsonb, null,
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
  values (v_point, 'problem-i-alternatywy', 'Zbadaj problem i obecne alternatywy',
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
  values (v_subpoint, 'wnioski', 'long_text',
          'Co wynika z rozmów z potencjalnymi użytkownikami?', 'Upewnij się, że problem jest realny — nie że brzmi realnie.', null,
          true, 'idea.problem-i-potrzeba-fizyczna.problem-i-alternatywy.wnioski',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'alternatywy', 'list_short',
          'Jak klienci radzą sobie z tym dzisiaj?', 'Produkty konkurencyjne, rozwiązania zastępcze, obejścia domowej roboty.', null,
          true, 'idea.problem-i-potrzeba-fizyczna.problem-i-alternatywy.alternatywy',
          '{"min_items":1,"max_items":12,"item_max":250}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['wnioski', 'alternatywy']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'dlaczego-sprzet', 'Uzasadnij konieczność stworzenia sprzętu',
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
  values (v_subpoint, 'uzasadnienie', 'long_text',
          'Dlaczego twoje rozwiązanie wymaga fizycznego urządzenia?', 'Upewnij się, że problemu nie da się rozwiązać prościej — samą aplikacją, usługą albo oprogramowaniem. Sprzęt jest o rząd wielkości droższy i wolniejszy.', null,
          true, 'idea.problem-i-potrzeba-fizyczna.dlaczego-sprzet.uzasadnienie',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['uzasadnienie']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'koncepcja-formy', 'Stwórz koncepcję formy',
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
  values (v_subpoint, 'opis-formy', 'short_text',
          'Jaki ma być planowany rozmiar, forma i sposób interakcji z produktem?', null, null,
          true, 'idea.problem-i-potrzeba-fizyczna.koncepcja-formy.opis-formy',
          '{"min":20,"max":500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'makieta', 'files',
          'Szkice, wizualizacja 3D albo zdjęcia makiety', 'Kartonowa makieta albo wydruk 3D w zupełności wystarczą. Chodzi o to, żeby dało się to wziąć do ręki.', null,
          true, 'idea.problem-i-potrzeba-fizyczna.koncepcja-formy.makieta',
          '{"max_files":10,"max_mb":20}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['opis-formy', 'makieta']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'opinia-o-koncepcji', 'Zbierz opinię o koncepcji',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'reakcje', 'long_text',
          'Czy potencjalni klienci rozumieją działanie urządzenia i potwierdzają chęć używania?', 'Pokaż makietę bez tłumaczenia. Jeśli musisz wyjaśniać, jak to działa — forma wymaga poprawy.', null,
          true, 'idea.problem-i-potrzeba-fizyczna.opinia-o-koncepcji.reakcje',
          '{"min":60}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['reakcje']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['problem-i-alternatywy', 'dlaczego-sprzet', 'koncepcja-formy', 'opinia-o-koncepcji']);

  -- ── punkt 2: Sprawdź wstępną wykonalność techniczną
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'wykonalnosc-techniczna', 'Sprawdź wstępną wykonalność techniczną', null,
          null, 'Po wstępnym potwierdzeniu pototrzeby fizycznej należy ocenić wstępną wykonalność techniczną (High-Level Feasibility). W tym celu wypisuje się kluczowe komponenty (np. czujniki, mikrokontrolery, baterie) niezbędne do realizacji funkcji produktu i weryfikuje ich dostępność rynkową oraz gabaryty w kartach katalogowych (data sheets). Koncept konsultuje się z inżynierem (elektronikiem lub mechanikiem), aby upewnić się, że połączenie elementów w zakładanej obudowie jest możliwe, oraz wskazuje się element o największym ryzyku technologicznym, na którym należy skupić kolejne prace.',
          '["Y Combinator Hardware Guide","The Hardware Startup\" — Renee DiResta, Brady Forrest, and Ryan Vian","Lean Hardware\" — Ben Einstein","Dragon Innovation Blog","Bolt Blog — Hardware Startups","Customer Development\" — Steve Blank","Testing Business Ideas\" — Alexander Osterwalder"]'::jsonb, null,
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
  values (v_point, 'technologie', 'Zidentyfikuj kluczowe technologie i komponenty',
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
  values (v_subpoint, 'lista', 'list_short',
          'Wypisz główne elementy niezbędne do działania produktu.', 'Np. czujniki, mikrokontrolery, baterie, silniki, ekrany.', null,
          true, 'idea.wykonalnosc-techniczna.technologie.lista',
          '{"min_items":1,"max_items":20,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['lista']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'dostepnosc', 'Zweryfikuj rynkową dostępność technologii',
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
  values (v_subpoint, 'sprawdzone', 'checkmark',
          'Przejrzałem karty katalogowe i potwierdziłem, że komponenty o potrzebnych parametrach istnieją.', 'Chodzi o parametry i gabaryty, nie tylko o samą kategorię elementu.', null,
          true, 'idea.wykonalnosc-techniczna.dostepnosc.sprawdzone',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'linki', 'links',
          'Linki do kart katalogowych', null, null,
          false, 'idea.wykonalnosc-techniczna.dostepnosc.linki',
          '{"max_items":15}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'watpliwosci', 'short_text',
          'Czy któregoś komponentu nie udało się znaleźć w potrzebnej wersji?', null, null,
          true, 'idea.wykonalnosc-techniczna.dostepnosc.watpliwosci',
          '{"min":3,"max":500}'::jsonb, 3)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['sprawdzone', 'linki', 'watpliwosci']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'konsultacja', 'Skonsultuj koncept z inżynierem',
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
  values (v_subpoint, 'rozmowa', 'checkmark',
          'Rozmawiałem ze specjalistą (elektronikiem albo mechanikiem).', 'Godzina rozmowy potrafi oszczędzić pół roku pracy nad czymś, co nie zadziała.', null,
          true, 'idea.wykonalnosc-techniczna.konsultacja.rozmowa',
          '{}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'wnioski', 'long_text',
          'Co powiedział o połączeniu tych komponentów w zakładanej obudowie?', null, null,
          true, 'idea.wykonalnosc-techniczna.konsultacja.wnioski',
          '{"min":40}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['rozmowa', 'wnioski']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'ryzyko-technologiczne', 'Wskaż największe ryzyko technologiczne',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ryzyko', 'short_text',
          'Co do której funkcji jest najwięcej niepewności?', 'Np. czas pracy na baterii, precyzja czujnika, odprowadzanie ciepła. Tym zajmiesz się w pierwszej kolejności.', null,
          true, 'idea.wykonalnosc-techniczna.ryzyko-technologiczne.ryzyko',
          '{"min":10,"max":500}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['ryzyko']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['technologie', 'dostepnosc', 'konsultacja', 'ryzyko-technologiczne']);

  -- ── punkt 3: Oszacuj koszty jednostkowe
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'koszty-jednostkowe', 'Oszacuj koszty jednostkowe', 'BOM (Bill of Materials) to lista części z cenami. Na tym etapie wystarczy szacunek z hurtowni.',
          null, 'Kolejnym obszarem jest szacunkowa analiza kosztów jednostkowych (Rough BOM). Zamiast szczegółowego łańcucha dostaw, na tym etapie buduje się wstępną listę części na podstawie cen detalicznych komponentów z hurtowni elektronicznych. Aby oszacować szacowany koszt jednostkowy, wartość komponentów mnoży się przez przyjęty współczynnik (np. 2x lub 3x), uwzględniając orientacyjny koszt obudowy, montażu, opakowania i strat. Wynik zderza się z przewidywaną ceną sprzedaży, weryfikując marżę i określając komponenty generujące największe ryzyko kosztowe.',
          '["Y Combinator Hardware Guide","The Hardware Startup\" — Renee DiResta, Brady Forrest, and Ryan Vian","Lean Hardware\" — Ben Einstein","Dragon Innovation Blog","Bolt Blog — Hardware Startups","Customer Development\" — Steve Blank","Testing Business Ideas\" — Alexander Osterwalder"]'::jsonb, null,
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
  values (v_point, 'bom', 'Zbuduj wstępną listę części',
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
  values (v_subpoint, 'czesci', 'list_short',
          'Wypisz znane komponenty wraz z cenami detalicznymi.', null, null,
          true, 'idea.koszty-jednostkowe.bom.czesci',
          '{"min_items":1,"max_items":30,"item_max":200}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'arkusz', 'files',
          'Arkusz z rozpiską kosztów', null, null,
          false, 'idea.koszty-jednostkowe.bom.arkusz',
          '{"max_files":5,"max_mb":20}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['czesci', 'arkusz']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'koszt-jednostkowy', 'Oszacuj koszt jednostkowy',
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
  values (v_subpoint, 'komponenty', 'number',
          'Ile kosztują same komponenty?', null, null,
          true, 'idea.koszty-jednostkowe.koszt-jednostkowy.komponenty',
          '{"min":0,"unit":"zł"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'szacunek', 'number',
          'Ile wyjdzie koszt jednostkowy po uwzględnieniu obudowy, montażu, opakowania i strat?', 'Pomnóż wartość komponentów przez 2 albo 3. To przybliżenie, ale lepsze niż nic.', null,
          true, 'idea.koszty-jednostkowe.koszt-jednostkowy.szacunek',
          '{"min":0,"unit":"zł"}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['komponenty', 'szacunek']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'ryzyko-kosztowe', 'Zidentyfikuj największe ryzyko kosztowe',
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
  values (v_subpoint, 'element', 'short_text',
          'Wzrost ceny którego komponentu najbardziej zagrozi opłacalności?', 'Np. niestandardowy wyświetlacz, droga bateria, obudowa wymagająca formy wtryskowej.', null,
          true, 'idea.koszty-jednostkowe.ryzyko-kosztowe.element',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['element']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'koszt-vs-cena', 'Zderz koszt z potencjalną ceną',
          null, false,
          null, 4)
  on conflict (point_id, key) do update set
    title = excluded.title, description = excluded.description,
    is_optional = excluded.is_optional, shared_key = excluded.shared_key,
    position = excluded.position
  returning id into v_subpoint;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'cena', 'number',
          'Jaką cenę sprzedaży zakładasz?', null, null,
          true, 'idea.koszty-jednostkowe.koszt-vs-cena.cena',
          '{"min":0,"unit":"zł"}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'marza', 'short_text',
          'Czy zakładana marża pozwala na opłacalny rozwój projektu?', 'W sprzęcie trzeba z niej pokryć produkcję, magazyn, wysyłkę, zwroty, serwis i dystrybucję.', null,
          true, 'idea.koszty-jednostkowe.koszt-vs-cena.marza',
          '{"min":10,"max":500}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['cena', 'marza']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['bom', 'koszt-jednostkowy', 'ryzyko-kosztowe', 'koszt-vs-cena']);

  -- ── punkt 4: Zbadaj zamiar zakupu
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'zamiar-zakupu', 'Zbadaj zamiar zakupu', null,
          null, 'Równolegle waliduje się zamiar zakupu, propozycję wartości oraz wczesny segment odbiorców. Podczas wywiadów bada się akceptację cenową przedstawionej makiety lub szkicu i wyselekcjonowuje grupę wczesnych odbiorców (early adopters), dla których problem jest najostrzejszy. Popyt mierzy się nie tylko poprzez deklaracje, ale przede wszystkim przez wskaźniki zaangażowania rynkowego, takie jak zapisy na listę oczekujących, intencję zakupu na stronie typu landing page czy formularze przedsprzedażowe.',
          '["Y Combinator Hardware Guide","The Hardware Startup\" — Renee DiResta, Brady Forrest, and Ryan Vian","Lean Hardware\" — Ben Einstein","Dragon Innovation Blog","Bolt Blog — Hardware Startups","Customer Development\" — Steve Blank","Testing Business Ideas\" — Alexander Osterwalder"]'::jsonb, null,
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
  values (v_point, 'akceptacja-cenowa', 'Zweryfikuj akceptację cenową',
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
  values (v_subpoint, 'zakres', 'short_text',
          'Jaki zakres cenowy podają potencjalni użytkownicy?', 'Zapytaj przy makiecie albo szkicu, nie w oderwaniu od produktu.', null,
          true, 'idea.zamiar-zakupu.akceptacja-cenowa.zakres',
          '{"min":5,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'reakcje', 'long_text',
          'Jak reagowali na cenę, którą zakładasz?', null, null,
          true, 'idea.zamiar-zakupu.akceptacja-cenowa.reakcje',
          '{"min":40}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['zakres', 'reakcje']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'testy-zaangazowania', 'Zrób testy zaangażowania',
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
  values (v_subpoint, 'forma', 'short_text',
          'W jakiej formie sprawdziłeś gotowość rynku?', 'Zapis na listę oczekujących, deklaracja zakupu na stronie, formularz przedsprzedażowy.', null,
          true, 'idea.zamiar-zakupu.testy-zaangazowania.forma',
          '{"min":10,"max":400}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ile-osob', 'number',
          'Ile osób podjęło to działanie?', null, null,
          true, 'idea.zamiar-zakupu.testy-zaangazowania.ile-osob',
          '{"min":0,"unit":"osób"}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['forma', 'ile-osob']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'early-adopters', 'Wybierz wczesny segment odbiorców',
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
  values (v_subpoint, 'segment', 'long_text',
          'Kto odczuwa problem najmocniej i komu wystarczy pierwsza wersja urządzenia?', 'Wąska grupa, która wybaczy niedoskonałości, bo bardzo potrzebuje rozwiązania.', null,
          true, 'idea.zamiar-zakupu.early-adopters.segment',
          '{"min":40}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['segment']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['akceptacja-cenowa', 'testy-zaangazowania', 'early-adopters']);

  -- ── punkt 5: Określ zarys regulacyjny i ryzyka wdrożeniowe
  insert into public.stage_points
    (category_id, key, title, description, duration_hint,
     guide_body, guide_sources, guide_source_label, shared_key, position)
  values (v_category, 'regulacje', 'Określ zarys regulacyjny i ryzyka wdrożeniowe', null,
          null, 'Ostatnim obszarem jest określenie zarysu regulacyjnego i ryzyk wdrożeniowych. Należy ustalić kategoryzację produktu (np. elektronika użytkowa, sprzęt medyczny, kontakt z żywnością) oraz wskazać kluczowe certyfikaty i normy (np. CE, FCC, RoHS) obowiązujące na docelowych rynkach wraz z ich ograniczeniami. Na koniec zestawić należy zebrany popyt, opinię inżyniera, szacunki kosztowe oraz zarys regulacyjny, aby podjąć formalną decyzję o przejściu do etapu Preparation i rozpoczęciu prac nad szczegółową specyfikacją.',
          '["Y Combinator Hardware Guide","The Hardware Startup\" — Renee DiResta, Brady Forrest, and Ryan Vian","Lean Hardware\" — Ben Einstein","Dragon Innovation Blog","Bolt Blog — Hardware Startups","Customer Development\" — Steve Blank","Testing Business Ideas\" — Alexander Osterwalder"]'::jsonb, null,
          null, 5)
  on conflict (category_id, key) do update set
    title = excluded.title, description = excluded.description,
    duration_hint = excluded.duration_hint, guide_body = excluded.guide_body,
    guide_sources = excluded.guide_sources,
    guide_source_label = excluded.guide_source_label,
    shared_key = excluded.shared_key, position = excluded.position
  returning id into v_point;

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'kategoryzacja', 'Zidentyfikuj kategorię produktu',
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
  values (v_subpoint, 'kategoria', 'select',
          'Do jakiej grupy należy urządzenie?', 'Od tego zależy, ile certyfikacji będziesz potrzebować i ile to potrwa.', null,
          true, 'idea.regulacje.kategoryzacja.kategoria',
          '{"options":[{"value":"consumer","label":"Zwykła elektronika użytkowa"},{"value":"medical","label":"Produkt medyczny"},{"value":"food","label":"Kontakt z żywnością"},{"value":"high-voltage","label":"Praca pod wysokim napięciem"},{"value":"other","label":"Inna kategoria"}]}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'uzasadnienie', 'short_text',
          'Na jakiej podstawie tak to zakwalifikowałeś?', null, null,
          true, 'idea.regulacje.kategoryzacja.uzasadnienie',
          '{"min":10,"max":400}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['kategoria', 'uzasadnienie']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'certyfikaty', 'Wskaż kluczowe certyfikaty i normy',
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
  values (v_subpoint, 'lista', 'list_short',
          'Jakie obowiązkowe oznaczenia obowiązują na twoich rynkach docelowych?', 'Np. CE, FCC, RoHS. Wystarczy wstępny przegląd.', null,
          true, 'idea.regulacje.certyfikaty.lista',
          '{"min_items":1,"max_items":12,"item_max":150}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  insert into public.stage_fields
    (subpoint_id, key, kind, question, help, example,
     is_required, shared_key, config, position)
  values (v_subpoint, 'ograniczenia', 'long_text',
          'Jakie krytyczne ograniczenia nakładają na produkt?', null, null,
          true, 'idea.regulacje.certyfikaty.ograniczenia',
          '{"min":30}'::jsonb, 2)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['lista', 'ograniczenia']);

  insert into public.stage_subpoints
    (point_id, key, title, description, is_optional, shared_key, position)
  values (v_point, 'decyzja', 'Podejmij decyzję o przejściu dalej',
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
  values (v_subpoint, 'podsumowanie', 'long_text',
          'Zestaw zebrany popyt, opinię inżyniera i szacunki kosztowe. Czy projekt uzasadnia przejście do szczegółowej specyfikacji?', 'To jest moment na uczciwą odpowiedź. Sprzęt wybacza mniej niż oprogramowanie — błąd na tym etapie kosztuje miesiące i pieniądze.', null,
          true, 'idea.regulacje.decyzja.podsumowanie',
          '{"min":80}'::jsonb, 1)
  on conflict (subpoint_id, key) do update set
    kind = excluded.kind, question = excluded.question,
    help = excluded.help, example = excluded.example,
    is_required = excluded.is_required, shared_key = excluded.shared_key,
    config = excluded.config, position = excluded.position;

  delete from public.stage_fields
  where subpoint_id = v_subpoint and key <> all(array['podsumowanie']);

  delete from public.stage_subpoints
  where point_id = v_point and key <> all(array['kategoryzacja', 'certyfikaty', 'decyzja']);

  delete from public.stage_points
  where category_id = v_category and key <> all(array['problem-i-potrzeba-fizyczna', 'wykonalnosc-techniczna', 'koszty-jednostkowe', 'zamiar-zakupu', 'regulacje']);

  delete from public.stage_categories
  where template_id = v_template and key <> all(array['general', 'saas', 'b2b', 'b2c', 'hardware']);

end;
$$;

-- Weryfikacja: policz, co wjechało
select
  (select count(*) from public.stage_points p
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'idea') as punktow,
  (select count(*) from public.stage_subpoints s
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'idea') as podpunktow,
  (select count(*) from public.stage_fields f
     join public.stage_subpoints s on s.id = f.subpoint_id
     join public.stage_points p on p.id = s.point_id
     join public.stage_categories c on c.id = p.category_id
     join public.stage_templates t on t.id = c.template_id
     where t.key = 'idea') as pol;
