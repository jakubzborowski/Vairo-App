# Vairo — baza wiedzy projektu

Platforma prowadząca startup przez pięć etapów walidacji i budowy, plus warstwa
Social do znajdowania ludzi i zespołów.

> Szczegółowe plany, audyty i rozpiski są w `_plan/` (katalog lokalny, w `.gitignore`).
> Ten plik jest skrótem dla kogoś, kto wchodzi w kod.

---

## ⭐ Zasada nadrzędna

**Vairo jest dla ludzi, którzy mogą się na tym całkowicie nie znać.** Ktoś, kto
pierwszy raz słyszy o walidacji pomysłu, ma przejść przez aplikację bez poczucia,
że czegoś nie rozumie. To ważniejsze niż gęstość informacji i liczba kliknięć.

| Zasada | Zamiast |
|---|---|
| Jedno pytanie na ekran, dużo powietrza, jedna akcja główna | formularz z ośmioma polami naraz |
| Kreator (`StepWizard`) wszędzie, gdzie zbieramy >2–3 informacje | ekran „wypełnij wszystko" |
| Widoczny postęp — „3 z 5" | nieznana długość procesu |
| Zawsze da się cofnąć | jednokierunkowy tunel |
| Podpowiedź przy pytaniu, przykład na żądanie | samo pole i domysły |
| Zwykły język: „Komu sprzedajesz?" | „Segment klienta docelowego" |
| Walidacja **dopiero po kliknięciu Zapisz** | czerwony komunikat po pierwszej literze |
| Krok opcjonalny → „Dalej" **aktywne** | wyszarzony przycisk + osobny link „Pomiń" |

**Zero fake UI.** Przycisk, który nic nie robi, jest usuwany albo `disabled`
z konkretnym powodem w tooltipie. Liczba, która nie pochodzi z bazy, nie istnieje.
Ikona sugerująca akcję, której nie ma (np. uchwyt przeciągania), jest błędem.

---

## Model domeny

```
auth.users ──1:1── profiles ──< profile_skills >── skills
                       │
                       ├──< startup_members (role, job_title) >── startups
                       │                                             │
                       └──< startup_join_requests >───────────────────┤
                            (application | invite)                    │
                          ┌───────────────────────────────────────────┤
                          │  WORKSPACE (wszystko z startup_id)
                          │
                          ├── startup_categories   general | saas | hardware | b2b | b2c
                          ├── startup_tags >── industry_tags
                          ├── startup_open_roles >── startup_open_role_skills
                          └── startup_stages ──< stage_answers
                                             ──< stage_subpoint_progress
                                             ──< stage_closures  (snapshot + decyzja)

profiles ──< discovery_passes >── profiles | startups   (pominięci w Odkrywaj)
profiles ──< notifications                               (dzwonek, z triggerow)
profiles ──< contact_signals >── profiles                (zaczepka, match)
             └── po przyjęciu → conversations ──< messages
                                             ──< conversation_participants

WIDOKI PUBLICZNE (jedyne wyjście danych poza team)
  public_profiles   ← profiles  where is_discoverable
  public_startups   ← startups  where is_discoverable and status = 'active'
```

### Nazewnictwo — konwencja obowiązkowa

| Warstwa | Nazwa |
|---|---|
| **Baza i kod** | `startups`, `startup_members`, `startup_id`, `stage_*` |
| **Interfejs** | „Team" albo nazwa startupu |

Nazwa „Validation Milestones" **wyszła z użycia** — to, co dokument tak nazywał,
to po prostu Milestones, czyli treść etapów przygotowana przez Vairo. „Milestones"
nigdy nie oznacza celów użytkownika; te to **Goals** (w UI: „Cele").

---

## Pięć etapów

Kolejność stała: **Ambition → Idea → Preparation → Execution → MVP**.

| Etap | Dla kogo | Stan |
|---|---|---|
| **Ambition** | founder bez pomysłu | ✅ treść + UI |
| **Idea** | każdy startup | ✅ treść (5 kategorii) + UI |
| **Preparation** | każdy startup | ⏳ szkielet, brak treści |
| **Execution** | odblokowuje tracker Goals | ⏳ szkielet, brak treści |
| **MVP** | start produktu, pierwsi użytkownicy | ⏳ szkielet, brak treści |

### Hierarchia treści — jeden model dla wszystkich etapów

```
Stage → Kategoria → Punkt → Podpunkt → Pole (w modalu)
        ↑ tylko gdy >1                  ↑ 14 typów odpowiedzi
```

Ambition ma jedną kategorię → **dwie listy + modal**.
Idea ma pięć → **trzy listy + modal**.

Wypełnienie wymaganych pól domyka podpunkt → podpunkty domykają punkt → punkty
domykają etap. **Kaskada działa w obie strony** — cofnięcie odpowiedzi cofa status.
Podpunkty oznaczone `is_optional` nie liczą się do postępu.

### Kategorie vs tagi — to dwie różne rzeczy

- **Kategorie walidacyjne** (`general`, `saas`, `hardware`, `b2b`, `b2c`) decydują,
  **które punkty są wymagane**. `general` jest zawsze aktywne i nieusuwalne.
- **Tagi branżowe** (`industry_tags`) służą **wyłącznie do discovery**. Nie zmieniają
  ani jednego pytania.

---

## Treść jako dane, nie kod

Treść etapów **nigdy** nie trafia do JSX. Źródłem są pliki JSON:

```
supabase/content/ambition-v1.json        struktura pytań
supabase/content/idea-v1.json            struktura pytań
supabase/content/idea-v1.guides.json     przewodniki (proza z dokumentów)
```

Budowanie migracji SQL z treści:

```bash
npm run content:build -- idea-v1
```

Skrypt `scripts/build-content.mjs` **waliduje** (nieznane typy pól, duplikaty
kluczy, `summary` wskazujący na nieistniejące pole), a potem generuje idempotentną
migrację, która usuwa też elementy usunięte z JSON-a.

**Dlaczego tak:** zmiana pytania to jednolinijkowy diff, nie szukanie w SQL-u;
nie wymaga deployu ani migracji pisanej ręcznie; treść jest wersjonowana.

### Stabilny `answer_key`

Odpowiedzi kluczujemy po `stage_fields.answer_key`, nie po `field_id`:

```sql
answer_key text generated always as (coalesce(shared_key, id::text)) stored
```

Importer nadaje każdemu polu `shared_key` = `<stage>.<punkt>.<podpunkt>.<pole>`,
więc ponowny import **nie osierocia zapisanych odpowiedzi**. Pola współdzielone
między kategoriami (oznaczone gwiazdką w dokumentach źródłowych) dostają wspólny
`shared_key` → jedno pytanie, jedna odpowiedź, niezależnie od kategorii.

---

## Role i uprawnienia

Trzy role w `startup_members`: **founder**, **admin**, **member**.

| Akcja | founder | admin | member |
|---|---|---|---|
| Czytanie workspace | ✅ | ✅ | ✅ |
| Edycja odpowiedzi w etapach | ✅ | ✅ | ❌ tylko odczyt |
| Zamknięcie / ponowne otwarcie etapu | ✅ | ✅ | ❌ |
| Zarządzanie członkami i rolami | ✅ | ✅ | ❌ |
| Ustawienia startupu, kategorie | ✅ | ✅ | ❌ |
| Tworzenie własnych Goals i zadań | ✅ | ✅ | ✅ |
| Kończenie własnych Goals | ✅ | ✅ | ✅ |
| Przypisanie pracy innej osobie | ✅ | ✅ | ❌ |
| Zmiana cudzego Goal | ✅ | ✅ | ❌ |
| Podpięcie **własnego** Goal do warunku | ✅ | ✅ | ✅ |
| Zapraszanie i przyjmowanie zgłoszeń | ✅ | ✅ | ❌ |
| Profil publiczny teamu i otwarte role | ✅ | ✅ | ❌ |
| Własne stanowisko (`job_title`) | ✅ | ✅ | ✅ |
| Wyjście z teamu | ✅* | ✅ | ✅ |
| Usunięcie startupu / archiwum | ✅ | ❌ | ❌ |

\* Jedyny Founder musi najpierw przekazać rolę.

**Rola ≠ stanowisko.** `role` (founder/admin/member) decyduje o uprawnieniach
i sprawdza ją RLS. `job_title` („CEO", „CTO", „Head of Design") to wizytówka
w składzie teamu i **nie nadaje niczego**. Rozdzielenie jest celowe: nazwanie
kogoś CTO nie może po cichu dać mu prawa do zmiany walidacji pomysłu.

**Uprawnienia sprawdzamy po stronie serwera przy każdej zmianie i każdym pobraniu
prywatnych danych.** Ukrycie przycisku to nie zabezpieczenie — to tylko uprzejmość
wobec usera. W bazie pilnują tego polityki RLS oparte na `startup_role()`.

**„Co-founder" nie jest rolą.** Dokument wymienia dokładnie trzy: Founder,
Admin, Member. Współzałożyciel to `job_title` — wizytówka bez uprawnień. Kto
ma faktycznie współdecydować, dostaje rolę Admina.

**Przyjęcie zaproszenia tworzy członkostwo ZAWSZE jako Member** (migracja 017).
Guidelines, sekcja 4: „Użytkownik otrzymuje dostęp jako Member. Nie otrzymuje
automatycznie uprawnień administracyjnych. Role i permisje ustawia Founder albo
Admin." Wcześniej `respond_join_request()` brał rolę z `proposed_role`, więc
jedno kliknięcie „Przyjmij" nadawało prawa do zarządzania zespołem i zamykania
etapów. Nadanie uprawnień jest czynnością teamu, nie zapraszanego — i dzieje
się teraz po dołączeniu, osobnym ruchem w menu przy członku.

Reguły twarde:
- **Jedynego Foundera nie da się usunąć ani zdegradować** bez przekazania roli (trigger).
- **Limit 3 członkostw na konto** — liczony łącznie, niezależnie od tego, czy user
  startup założył, czy do niego dołączył (trigger na `startup_members`).

---

## Warstwa Social

Dwie strony tego samego rynku: joiner szuka projektu, startup szuka ludzi.

**Odkrywaj to talia, nie tabela.** Domyślny tryb (`?view=deck`) pokazuje
**jedną osobę albo jeden team na ekran**: duże zdjęcie z najważniejszym
konkretem wtopionym w dolną krawędź, pod nim dwie akcje, a pod tym resztą
informacji. Na dużym ekranie zdjęcie idzie po lewej, szczegóły po prawej.
Siatka została jako `?view=list` dla tych, którzy wolą przejrzeć wszystko naraz.

Dlaczego tak: decyzja „czy chcę z tą osobą pracować" nie jest decyzją
porównawczą. Trzydzieści miniatur naraz zamienia ją w przeglądanie katalogu.

**Pominięcie ma być trwałe i prywatne.** `discovery_passes` zapamiętuje, kogo
user odrzucił, więc przeglądanie ma koniec, a te same twarze nie wracają przy
następnym wejściu. Druga strona nigdy się o tym nie dowie — polityka RLS
wpuszcza wyłącznie właściciela wiersza. Decyzja jest odwracalna: „Cofnij"
(ostatnia) i „Przywróć pominięte" (wszystkie).

Z talii wypadają też **otwarte rozmowy** — komu już wysłano zgłoszenie albo
zaproszenie. Karta z napisem „już wysłane" zamiast akcji jest tylko przeszkodą
na drodze do następnej osoby.

**Granice prywatności** (wymuszone schematem, nie regulaminem):

| Dane | Kto widzi |
|---|---|
| `startups.idea_description` | wyłącznie team — **nigdy** nie ma go w widoku publicznym |
| `startups.public_tagline` / `public_description` | wszyscy — to founder napisał świadomie dla obcych |
| `profiles.email` | wyłącznie osoby z tego samego teamu |
| profil osoby z `is_discoverable = false` | nie pojawia się w Odkrywaj **ani** na liście członków cudzego teamu |
| pominięcia | wyłącznie ich autor |

**Pętla kontaktu: zaczepka → przyjęcie → rozmowa.** `contact_signals` to
pierwszy krok, dostępny **dla każdego** — także dla kogoś bez teamu. Wcześniej
jedyną akcją było „zgłoś się do teamu", którą widzieli tylko Founder i Admin,
więc osoba, dla której Social powstał, mogła wyłącznie oglądać karty.

Rozmowa (`conversations`) powstaje **dopiero po przyjęciu** zaczepki, razem
z przeniesieniem pierwszej wiadomości — w jednej transakcji, w funkcji
`respond_contact_signal()`. Dzięki temu skrzynka nie zapełnia się monologami,
na które nikt nie odpowiedział.

**Kontekst kontaktu** (`context_startup_id`) jest wymogiem guidelines: nadawca
wybiera, czy pisze prywatnie, czy w imieniu konkretnego teamu, a odbiorca
zawsze widzi który. Bez tego „cześć, fajny profil" od nieznajomego nic nie
znaczy. Trigger pilnuje, że w imieniu teamu pisze tylko jego członek.

**Kompletność profilu jest częścią produktu, nie ozdobą.** `scoreProfile()`
w [profile-completeness.ts](src/lib/profile-completeness.ts) liczy, na ile
karta nadaje się do pokazania obcym, i **nazywa każdy brak razem z powodem**.
Zdjęcie waży najwięcej (25), bo w tej warstwie decyduje o kliknięciu.
Nie blokujemy wejścia do Odkrywaj poniżej progu — blokada wypchnęłaby z
aplikacji tych, którzy najbardziej jej potrzebują. Zamiast tego pasek nad
talią mówi wprost, co jest puste.

Joiner po rejestracji idzie **prosto do kreatora profilu** (`/app/social/start`),
nie na pusty dashboard.

**Karta mówi, dlaczego ją widzisz.** [match.ts](src/lib/match.ts) nazywa
pokrycie, które i tak jest w danych: Twoje otwarte role kontra jej
umiejętności, jej otwarte role kontra Twoje, ta sama lokalizacja, deklarowany
czas. **To nie jest algorytm rekomendacji i nie będzie nim.** Nie liczymy
wyniku, nie sortujemy talii „od najlepszych", nikogo nie ukrywamy. Gdy nic się
nie zgadza, funkcja zwraca pustą listę i karta nie pokazuje nic — wymyślony
powód („świetnie pasujecie!") byłby fake UI. Maksymalnie trzy zdania, bo
czwarte przestaje być przesłanką, a staje się ścianą tekstu.

Powody piszemy **rzeczownikami, nie czasownikami w czasie przeszłym**.
Polszczyzna odmienia je przez rodzaj, którego nie znamy i nie zgadujemy:
„Deklaruje 12 h" działa dla każdego, „zadeklarował(a)" to formularz urzędowy.

**Umiejętności przy otwartej roli to jedyne pole, które da się porównać
maszynowo.** Tabela `startup_open_role_skills` istniała od migracji 009,
widok publiczny ją wystawiał, karta teamu była gotowa ją pokazać — i **żaden
formularz jej nie wypełniał**. Kolumna, której nic nie zapisuje, to ta sama
klasa błędu co przycisk, który nic nie robi. Bez niej Odkrywaj nie ma jak
powiedzieć „ta rola pyta o React, a Ty masz React w profilu".

**Puste zgłoszenie nie jest blokowane — pokazujemy, co się z nim stanie.**
Pierwsze kliknięcie „Wyślij" przy pustym opisie nic nie wysyła, tylko mówi
wprost, że druga strona zobaczy sam profil; drugie wysyła mimo to. Dokładnie
ten sam mechanizm co przy zbyt krótkich odpowiedziach w etapie: konsekwencja
zamiast zakazu.

**Publiczne jest to, co człowiek napisał dla obcych; prywatne jest to, co
system o nim policzył.** Widok `public_startups` wystawiał `stage_label`, czyli
najdalszy rozpoczęty etap — dane programu, których nikt świadomie nie
publikował, a które da się przeczytać jako „dopiero zaczynają, pewnie nic
z tego nie będzie". Od migracji 016 etap wychodzi na zewnątrz wyłącznie po
włączeniu `show_stage_publicly` (domyślnie wyłączone). **Każda nowa kolumna
w widoku `public_*` musi przejść ten test.**

**Dwie talie to DWA ADRESY, nie jeden z zakładką.** „Szukam projektu" mieszka
pod `/app/social/teams`, „Szukam ludzi" pod `/app/social/people` — czyli
poziom wyżej niż profile pojedynczych teamów i osób, które tam już leżały.
Nazwy mówią o INTENCJI, nie o obiekcie: pierwsze pytanie po wejściu brzmi
„po co tu jestem", a nie „co oglądam".

Pierwsza wersja trzymała obie talie pod `/app/social/discover?tab=…`. Zakładka
w parametrze opisuje stan, a to są miejsca — i widać to było po jednym
objawie: **gołego adresu nie dało się nikomu wysłać**, bo przekierowanie
zgadywało zakładkę z `looking_for` odbiorcy, więc ten sam link otwierał
u dwóch osób dwie różne rzeczy. `/app/social/discover` zostaje wyłącznie jako
rozjazd: obsługuje stare linki z `?tab=` i wejścia znaczące po prostu „idź do
Odkrywaj" (z dashboardu, z powiadomień, po kreatorze profilu) — tam
`looking_for` jest dobrą odpowiedzią, bo nikt nie liczy na konkretną.

**Karta w talii odpowiada na jedno pytanie: zaczepiam czy przewijam.**
Dlatego jest **jednym obiektem** — zdjęcie po lewej, decyzja po prawej, akcje
na dole, i **ani jednej ramki w środku**. Hierarchię robi rozmiar i odstęp.
Z karty świadomie wypadły: pełny opis, skład zespołu, tagi, opisy ról. To
wszystko jest na publicznym profilu, jedno kliknięcie dalej. **Karta = decyzja,
profil = szczegóły** — i dzięki temu karta mieści się na jednym ekranie.

**Skrzynka to lista zgłoszeń, nie stos kart.** Zakładki „Czeka na Ciebie /
Wysłane / Zakończone" z licznikiem, pod nimi jeden kontener z wierszami
(`InboxRow`). Cztery sekcje z nagłówkami i kartami po 150 px nie dawały się
przebiec wzrokiem, a skrzynka ma odpowiadać w pierwszej sekundzie na pytanie
**ile rzeczy czeka na mój ruch**. Ten sam wiersz obsługuje zaczepki i sprawy
członkostwa, i ten sam wiersz stoi na stronie teamu — dwie różne karty na tę
samą sprawę to dwa razy ta sama decyzja podejmowana od nowa.

**Wiadomości są dwupanelowe: lista po lewej, wątek po prawej.** Rozmowa nie
jest dokumentem, tylko jedną z kilku równoległych — żeby sprawdzić, kto jeszcze
napisał, nie można kazać wychodzić z tego, co się właśnie czyta. Lista siedzi
w `layout.tsx`, więc przy przejściu między wątkami się nie przeładowuje; to
warunek, żeby układ w ogóle czytał się jak komunikator. Na telefonie wracamy
do dwóch ekranów i decyduje o tym `usePathname` — layout w App Routerze nie
wie, co renderuje pod sobą.

**Czat wygląda jak czat, gdy ma cztery rzeczy naraz:** wyraźne strony (moje
pełnym pomarańczem, cudze płaską szarością — stronę rozmowy trzeba czytać
kątem oka, bez czytania treści), grupowanie kolejnych wiadomości jednej osoby
w jedną wypowiedź (jeden awatar, jedna godzina, przycięte rogi w środku
grupy), podział na dni i pole do pisania jako **jeden obiekt** — pigułka
z okrągłym przyciskiem, nie textarea plus przycisk obok.

**Czat jest na żywo** (migracja 019 wpuszcza `messages` do publikacji
`supabase_realtime`). Wątek nasłuchuje wstawień do swojej rozmowy i odświeża
dane serwera, zamiast doklejać wiersz z payloadu — jedno źródło prawdy o tym,
co jest w rozmowie, a kolejność i godziny liczy zawsze baza. Przycisk
odświeżenia **zostaje**: Realtime gubi połączenie przy uśpionej karcie
i słabej sieci, a wtedy jedyną informacją dla człowieka jest cisza.

**Imię rozmówcy nie przychodzi z `profiles`.** Polityka `profiles_select_visible`
wpuszcza do pełnego wiersza (jest w nim e-mail) wyłącznie siebie, kolegów
z teamu i kandydatów do własnego teamu — a cała warstwa Social działa POZA
teamem. Embed `profiles(...)` przy rozmowie z kimś poznanym w Odkrywaj zwracał
więc NULL i czat pokazywał „Bez imienia" mimo dwóch uzupełnionych profili.
Poszerzenie `is_profile_visible()` byłoby najgorszym lekarstwem: razem
z imieniem wypuściłoby e-mail. Zamiast tego jest wąski widok `contact_profiles`
(cztery kolumny, bez `security_invoker`, własne WHERE) widoczny wyłącznie dla
osób, z którymi łączy Cię zaczepka albo rozmowa. **Nie sprawdza
`is_discoverable`** — kto po wysłaniu zaczepki schował się z wyszukiwarki, nie
może zamienić się w trwającej już rozmowie w anonima.

**Prośby o dołączenie to jedna tabela** (`startup_join_requests`) z kolumną
`direction`: `application` (człowiek → team) i `invite` (team → człowiek).
Mechanika jest identyczna, więc dwie tabele znaczyłyby dwa razy te same
polityki i dwa razy ten sam błąd. Odpowiada zawsze **druga strona rozmowy**;
całą tę regułę trzyma funkcja `respond_join_request()` — wpis do
`startup_members` powstaje w tej samej transakcji co zmiana statusu, więc nie
ma stanu „zaakceptowane, ale nie dodane do teamu".

---

## Dashboard — pięć pytań

Guidelines: dashboard ma odpowiadać na pytania **gdzie jestem · co robić teraz ·
co blokuje · kto za co odpowiada · po czym poznam koniec etapu**.

**Lista „co teraz"** (`loadNextActions()` w [next-actions.ts](src/lib/next-actions.ts))
składa maksymalnie pięć pozycji z rzeczy, które naprawdę są w bazie: sprawy,
na które czeka drugi człowiek → konkretne nieukończone podpunkty etapu → braki
we własnym profilu. Każda pozycja ma **powód** pod spodem i prowadzi do
konkretnego miejsca. Bez powodu lista brzmi jak polecenia z systemu.

**Układ dashboardu jest STAŁY przez wszystkie etapy** (guidelines, sekcja 9):
na górze etap i postęp, po lewej „Co teraz", po prawej zespół i najbliższy cel,
na dole ostatnia aktywność i możliwości. Sekcje się nie przenoszą i nie znikają
zależnie od etapu.

Z tego wynika jedyny dopuszczalny rodzaj placeholdera w tej aplikacji:
**miejsce, które stoi, jest wyraźnie nieaktywne i nazywa, czego będzie dotyczyć
oraz kiedy się odblokuje.** To nie łamie zasady „zero fake UI", bo nic nie
udaje danych — pokazuje własną nieobecność. Wymyślona liczba w takim panelu
złamałaby ją natychmiast.

**Dashboard to siatka paneli, nie kolumna kart.** Kolumna narzuca czytanie po
kolei, jakby wszystko było tak samo ważne. Siatka pozwala postawić jedną rzecz
jako główną (bieżący etap na całą szerokość) i trzy krótkie odpowiedzi obok
siebie — program, team, własny profil publiczny. **Każda liczba w panelu
pochodzi z zapytania do bazy;** panel z wymyśloną metryką („wynik gotowości:
72") wyglądałby mądrze i nie znaczyłby nic.

**Przeszkodę pokazujemy tylko wtedy, gdy wynika z danych** — startup
wstrzymany, etap bez treści, rola bez prawa zapisu. Pełny model blockerów
(zgłaszanych ręcznie i wynikających z zależności) przychodzi razem z Execution
Stage. Do tego czasu komunikat o przeszkodzie bez konkretu byłby gorszy od jego
braku.

**Bieżący etap to NAJDALSZY rozpoczęty, nie najwcześniejszy otwarty.**
Do wcześniejszego etapu wolno wrócić (pominięty Ambition, ponownie otwarta
Idea) i to nie znaczy, że program się cofnął. Przy regule „pierwszy
`in_progress`" wejście w stary etap odbierało użytkownikowi bieżący i kazało
zaczynać od nowa. Tę samą regułę stosują `currentProgramEntry()`
i `getUserStartups()` — muszą dawać ten sam wynik, bo inaczej dashboard
i ekran etapu pokazują co innego.

**Start od Idea Stage domyka Ambition automatycznie.** Ambition istnieje po
to, żeby POMÓC znaleźć pomysł — kto przychodzi z pomysłem, ma ten etap
z definicji za sobą. Zostawianie go jako „pominięty" mówiło nieprawdę: że
człowiek coś ominął, zamiast tego, że nie było czego robić. `ensureStartupStage()`
przyjmuje więc status i przy zakładaniu startupu od Idea tworzy Ambition jako
`completed`. Dotyczy to obu dróg: onboardingu i `/app/startups/new`.

**Otwarcie etapu jest decyzją, nie skutkiem ubocznym oglądania.** Wejście
w pominięty etap pokazuje ekran z wyjaśnieniem i osobnym przyciskiem
„Uzupełnij mimo to"; instancja powstaje dopiero po tym kliknięciu. Wcześniej
samo kliknięcie w pasek zakładało etap i program cofał się do niego.

**Pasek etapów ma pięć stanów:** domknięty, bieżący, **otwarty** (ktoś do
niego wrócił, ale program jest dalej), **pominięty** i zablokowany. Pominięty
dostaje kreskę, nie kłódkę — kłódka PRZED bieżącym etapem czyta się jak
awaria. Wszystkie poza zablokowanym są klikalne.

**Każda akcja kończy się potwierdzeniem.** Do tej pory zapis kończył się tak,
że po prostu nic się nie działo — dane szły do bazy, strona się odświeżała
i człowiek musiał sam się domyślić, czy zadziałało. **Brak potwierdzenia nie
jest neutralny: czyta się jak niepewność**, a w aplikacji, w której zostawia
się swoje dane i pisze do obcych, to podkopuje zaufanie szybciej niż
jakikolwiek błąd.

`ToastProvider` ([toast.tsx](src/components/ui/toast.tsx)) pokazuje je w prawym
dolnym rogu. Trzy reguły: **sukces znika po 4 s, błąd NIE** (komunikat o błędzie
trzeba zdążyć przeczytać, czasem przepisać), maksymalnie **trzy naraz** (kolejka
dziesięciu przestaje być potwierdzeniem, a staje się przeszkodą) i `aria-live="polite"`,
żeby czytnik ekranu ogłosił treść bez przerywania pracy.

Błędy zostają **inline, przy polu**, a nie w toaście — bliżej przyczyny. Toast
niesie potwierdzenia.

**Powiadomienia przychodzą na żywo** ([live-notifications.tsx](src/components/app/live-notifications.tsx)):
subskrypcja Realtime na `notifications`, filtrowana po własnym `profile_id`.
Filtr jest oszczędnością, **nie zabezpieczeniem** — Realtime respektuje RLS,
więc polityka `notifications_select_own` i tak nie przepuści cudzych wierszy.
Toast składamy z `kind`, bez dociągania imienia nadawcy: wiersz go nie niesie
(celowo), a dodatkowe zapytanie przy każdym zdarzeniu to koszt bez pokrycia.
Pełne zdanie z imieniem czeka na liście powiadomień.

**Powiadomienia** (migracja 013) powstają wyłącznie z triggerów, więc nikt nie
wyśle powiadomienia w cudzym imieniu — tabela nie ma polityki INSERT. Treść
komunikatu składa [notifications.ts](src/lib/notifications.ts), nie baza:
zmiana brzmienia to jedna linijka, a zmiana imienia nadawcy nie zostawia
w skrzynce starej wersji. Kolejna wiadomość w tej samej, nieprzeczytanej
rozmowie **podmienia** wpis — jedna zmiana to jedno powiadomienie.

---

## Struktura kodu

```
src/
  app/
    app/                    sekcja po zalogowaniu (layout = AppShell)
      layout.tsx            user + lista teamów + aktywny kontekst (raz dla całości)
      page.tsx              dashboard: pasek etapów + karta bieżącego etapu
      stage/                ekran etapu + akcje zapisu odpowiedzi
      settings/profile/     edytor profilu osobowego
      startups/new/         kreator zakładania startupu
      team/                 skład, role, otwarte role, zgłoszenia
      team/profile/         profil publiczny teamu (to, co widzą obcy)
      social/discover/      wyszukiwarka ludzi i teamów
      social/people/[id]/   publiczny profil osoby
      social/teams/[id]/    publiczny profil teamu
      social/me/            podgląd własnej karty + ustawienia widoczności
      social/start/         kreator profilu publicznego (wejście do Social)
      social/invites/       jedna skrzynka: zaczepki i sprawy teamu
      social/messages/      skrzynka i wątki rozmów
      notifications/        dzwonek: wszystkie zdarzenia w jednym miejscu
      program/              jak działa Vairo — pięć etapów, z bazy
      stage/summary/        wszystko, co zespół ustalił w jednym etapie
    onboarding/             ścieżka: path → name → idea → categories
  components/
    app/                    powłoka aplikacji: sidebar, switcher, profil
    stage/                  silnik etapów: listy, modal, 14 typów pól, odczyt
    social/                 talia Odkrywaj (deck-frame, people/teams-deck),
                            karty, zgłoszenia, zaproszenia
    team/                   wiersz członka, otwarte role, profil teamu
    ui/                     prymitywy (Button, Card, Input, Pill, Modal, StepWizard, …)
  lib/
    supabase/               klienci: browser / server / proxy (middleware)
    stage.ts                drzewo etapu, dedup po shared_key, program etapów
    startup.ts              startupy usera, aktywny kontekst
    social.ts               discovery, profile publiczne, prośby, pominięci
    messages.ts             zaczepki, rozmowy, liczniki nieprzeczytanych
    notifications.ts        skrzynka zdarzeń, brzmienie komunikatów
    next-actions.ts         co teraz i przeszkody na dashboardzie
    db-errors.ts            jeden tłumacz błędów bazy na polski
    profile-completeness.ts na ile profil nadaje się do pokazania obcym
    permissions.ts          role po stronie serwera + czytelne komunikaty
    active-team.ts          aktywny workspace w ciasteczku
  types/                    profile.ts · startup.ts · stage.ts · social.ts
```

### Rzeczy, o które łatwo się potknąć

**Layouty nie dostają `searchParams`.** Aktywny team siedzi w ciasteczku
(`src/lib/active-team.ts`), bo sidebar renderuje się w layoucie. Przełączanie
idzie przez server action `switchTeam`, która weryfikuje członkostwo.

**`INSERT ... RETURNING` sprawdza też politykę SELECT.** `.insert().select()`
wymaga, żeby wiersz był widoczny dla autora *w trakcie* instrukcji. Trigger
`AFTER INSERT` (np. tworzący członkostwo) jeszcze się wtedy nie wykonał — dlatego
polityka SELECT na `startups` zawiera `created_by = auth.uid()`.

**Pliki `"use server"` eksportują wyłącznie funkcje async.** Stałe (np. limity)
trzymamy w `src/types/*`.

**RLS nie może się zapętlać.** Polityki nie odwołują się wzajemnie między
tabelami — zamiast tego używają helperów `security definer`:
`is_startup_member(uuid)`, `startup_role(uuid)`, `can_access_stage(uuid)`.

**PostgREST nie zgadnie, który klucz obcy złączyć.** `startup_join_requests`
ma trzy odwołania do `profiles` (`profile_id`, `created_by`, `responded_by`),
więc `profiles(...)` w `select()` kończy się błędem. Trzeba wskazać relację
nazwą ograniczenia: `profiles!startup_join_requests_profile_id_fkey(...)`.

**Widoki `public_*` celowo NIE mają `security_invoker`.** Omijają RLS tabeli
bazowej, a filtrem jest ich własne `WHERE`. To jedno miejsce decyduje, co widzi
obcy — dzięki temu nie da się przypadkiem wyciągnąć e-maila przez `select *`.
Odpowiedzialność: każda nowa kolumna w widoku to świadoma decyzja o ujawnieniu.

**`block` na przycisku wymusza `shrink`.** Bazowy `shrink-0` razem z `w-full`
daje dwa przyciski po 100% szerokości w jednym rzędzie flex, które nie mogą się
ścieśnić — i wychodzą poza kontener. Wariant `block` nadpisuje to jawnie.

---

## Prowadzenie za rękę — co to znaczy w kodzie

Zasada z góry tego pliku ma konkretne odbicie w aplikacji. Cztery wzorce, które
trzeba utrzymać przy każdej nowej funkcji:

**Pierwsze wejście wygląda inaczej niż dziesiąte.** Ekran etapu przy zerowym
postępie pokazuje wprowadzenie (czym to jest, ile podpunktów, że nic nie
przepada), a potem zwija się do jednego wiersza „Następny krok". Stan bierzemy
z danych (`tree.done === 0`), nie z `localStorage` — dzięki temu nie ma
osobnego stanu do zsynchronizowania i nic się nie pokazuje dwa razy na dwóch
urządzeniach.

**Każdy etap kończy się czymś do przeczytania.** `/app/stage/summary` renderuje
wszystkie odpowiedzi jednego etapu jako treść, nie jako drugą kopię formularza
(pytania bez odpowiedzi w ogóle się nie pokazują). Domknięcie Ambition prowadzi
przez ten ekran, zanim trafi do wyboru kategorii.

**Decyzja poprzedzona jest wynikami.** Kreator kończący Idea Stage zaczyna od
kroku „Zanim zdecydujesz" z liczbami i linkiem do pełnych odpowiedzi. System
nadal nie ocenia pomysłu — pokazuje to, na czym człowiek ma oprzeć własną decyzję.

**Widoczne jest to, co się czyta; akcje są pod ręką, nie przed oczami.**
Wiersz członka teamu miał po prawej trzy klikalne rzeczy — przycisk roli,
ołówek przy stanowisku i kosz — więc wiersz o jednej osobie niósł trzy wezwania
do działania, zanim dało się zobaczyć, czyj to wiersz. Teraz rola jest plakietką
do czytania, a akcje siedzą pod trzema kropkami (`components/ui/menu.tsx`).
Trzy kropki są jedynym wyjątkiem od zasady „ikona bez podpisu jest zagadką" —
ten znak ma ustalone znaczenie wszędzie i nikt nie kliknie go przez pomyłkę.

**Nagłówek sekcji nie potrzebuje akapitu pod spodem.** Zdanie wyjaśniające, po
co są otwarte role, jest potrzebne dokładnie wtedy, gdy ról nie ma — czyli
w pustym stanie. Nad gotową listą jest już tylko szumem.

**Żaden komunikat błędu nie wychodzi surowy.** `translateDbError()`
w [db-errors.ts](src/lib/db-errors.ts) zamienia naruszenia RLS, limity
i ograniczenia bazy na zdania po polsku. Nowa akcja serwerowa przepuszcza przez
niego każdy `error.message`, którego sama nie obsłużyła.

Dwie rzeczy, na których ten plik się wyłożył i które warto pamiętać:
**komunikaty muszą mieć polskie znaki** (powstały w pliku SQL bez ogonków
i tak trafiały na ekran — w najgorszym możliwym momencie, bo przy błędzie),
oraz **nieznany błąd też dostaje zdanie po polsku**. Funkcja kończyła się
`return message`, czyli przy czymkolwiek nieprzewidzianym wypluwała na ekran
tekst Postgresa. Teraz oryginał idzie do `console.error`, a user dostaje
zdanie, z którym da się coś zrobić.

**Żaden komunikat nie zgaduje też rodzaju.** „Już wysłałeś zaczepkę",
„Przeszedłeś przez wszystkich", „Oto, co ustaliłeś" — wszystkie zniknęły na
rzecz form bezosobowych. Polszczyzna odmienia czasowniki przez rodzaj, a my go
nie znamy; „Zaczepka już czeka na odpowiedź" działa dla każdego.

---

## Nawigacja — w menu jest tylko to, co działa

Żadnej pozycji wyszarzonej, żadnego „wkrótce", żadnego linku do ekranu
z informacją, że czegoś jeszcze nie ma. Ktoś, kto pierwszy raz widzi tę
aplikację, nie odróżni „nieaktywne, bo nie powstało" od „nieaktywne, bo coś
zrobiłem źle" — a pół menu na szaro wygląda jak aplikacja, która się nie
wczytała. Widoczność rozstrzyga [nav-config.ts](src/components/app/nav-config.ts);
`NavRow` nie ma już żadnej logiki dostępu.

Stan docelowy menu:

| Grupa | Pozycje |
|---|---|
| **Twój team** (tylko gdy jesteś w teamie) | Start · Etap startupu · Team · Profil publiczny\* |
| **Social** | Szukam projektu · Szukam ludzi · Wiadomości · Zaproszenia · Mój profil publiczny |
| **Stopka** | Powiadomienia · Jak to działa · Ustawienia |

\* „Profil publiczny" widzą wyłącznie Founder i Admin — dla Członka strona
i tak przekierowuje, a pozycja prowadząca pod zamknięte drzwi jest gorsza niż
jej brak. Rozstrzyga o tym `requiresManage` w `nav-config.ts`, filtrowane
w powłoce; `NavRow` nadal nie ma żadnej logiki dostępu.

**Dwa wejścia do Odkrywaj, nie jedno.** „Szukam projektu"
(`/app/social/teams`) i „Szukam ludzi" (`/app/social/people`) to osobne
pozycje menu, bo to najważniejsze rozwidlenie w całej warstwie Social i jedyne
pytanie, na które trzeba odpowiedzieć, ZANIM cokolwiek się zobaczy. Dwa
osobne `pathname` znaczą też, że `isActivePath()` nie musi zaglądać w query
string — a menu nie może pokazać czegoś innego niż ekran, bo nie ma już
stanu, który mógłby się rozjechać.

**Jedna skrzynka, nie dwie.** Zaczepki od ludzi i sprawy członkostwa w teamie
trafiają do wspólnych „Zaproszeń" z jednym licznikiem. Dwa osobne wejścia
(„Kontakty" i „Zaproszenia") dla nowej osoby znaczyły to samo: ktoś czegoś ode
mnie chce. Rozdział został w treści kart. `/app/social/connections` przekierowuje.

**Bez teamu cała grupa workspace'u znika.** Ścieżkę do założenia startupu
trzyma wtedy switcher teamów („Brak teamu → Stwórz startup"), a `/app` zostaje
dostępny przez logo.

Moduły, które wrócą razem z Execution Stage — Taski, Cele, Dokumenty, Workflow,
Możliwości — mają swoje adresy i uczciwe ekrany, ale **nie są linkowane**.
Wejdą do menu wtedy, gdy będą miały dane.

---

## Usuwanie — co wolno skasować i jak

Reguła, o którą chodzi: **startup, który istnieje, musi mieć co najmniej
jednego Foundera.** Usunięcie całego startupu to co innego niż odejście z niego
i nie może wpadać w tę samą blokadę.

**Jedna pomyłka w trzech miejscach.** Strażnik nie odróżniał „ktoś odbiera mi
wiersz" od „cały rodzic właśnie znika". Przy kaskadzie oba wyglądają tak samo,
więc blokada odpalała się w momencie, w którym nie ma już czego chronić.
Dotyczyło to trzech triggerów — i naprawa jest wszędzie ta sama: sprawdź, czy
wiersz nadrzędny jeszcze istnieje, a jeśli nie, przepuść kaskadę.

| Trigger | Co blokował | Naprawione w |
|---|---|---|
| `protect_last_founder` | kasowanie startupu i konta | 014 |
| `protect_general_category` | kasowanie startupu (kategoria `general`) | 015 |
| `recalc_subpoint_progress` | kasowanie startupu (wpis postępu do usuniętego etapu) | 015 |

**Wniosek na przyszłość:** każdy nowy trigger `BEFORE/AFTER DELETE`, który
cokolwiek blokuje albo dopisuje, musi na wejściu sprawdzić, czy jego rodzic
jeszcze żyje. Inaczej zablokuje własną kaskadę.

Konsekwencje, które z tego wynikają:

- **`startups.created_by` ma `on delete set null`**, nie kaskadę. Autor mógł
  dawno przekazać rolę i odejść; usunięcie jego konta nie może kasować startupu,
  który zespół nadal prowadzi.
- **Usunięcie konta kasuje tylko te startupy, w których ta osoba była jedynym
  Founderem** (trigger `profiles_cleanup_startups`, wykonywany PRZED kaskadą).
  Pozostałe zostają z resztą Founderów.
- **Usunięcie startupu wymaga przepisania nazwy** i jest dostępne wyłącznie dla
  Foundera (Team → Profil publiczny). To operacja bez cofnięcia, więc
  potwierdzenie musi wymagać uwagi, a nie jednego kliknięcia. Obok stoi
  przypomnienie o pauzie i archiwum — one istnieją właśnie po to, żeby nikt tu
  nie trafiał przez pomyłkę.
- **Usunięcie konta** (Ustawienia → Konto) idzie przez `delete_own_account()`:
  `security definer`, bierze `auth.uid()` z tokenu, nie z parametru, więc nie da
  się przez nią usunąć cudzego konta. Potwierdzeniem jest przepisanie adresu
  e-mail, a modal **wypisuje z nazwy** startupy, które znikną razem z kontem.
  Jeśli baza nie pozwala kasować z `auth.users`, aplikacja mówi to wprost
  i odsyła do panelu — nie udaje, że się udało.

---

## Design system

Tokeny w `src/app/globals.css`. **Nie używamy surowych hexów w komponentach `/app`.**

| Grupa | Tokeny |
|---|---|
| Marka | `--vairo` `#ee5f1c`, `--vairo-strong` (wypełnienia z białym tekstem) |
| Powierzchnie | `--bg` → `--surface` → `--surface-2` → `--surface-3` |
| Tekst | `--text` · `--text-muted` · `--text-subtle` · `--text-faint` |
| Semantyka | `--success` `--warning` `--danger` `--info` |

**Nazwy tokenów tekstu niosą regułę:** `--text-subtle` (52%) to **podłoga dla
treści** — poniżej kontrast spada pod 4.5:1. `--text-faint` (34%) wolno użyć
**wyłącznie do dekoracji**.

Zmierzone po skomponowaniu z tłem `#08090c`: `--text-subtle` daje **5,7:1**,
`--text-faint` **3,05:1**. Audyt z września 2026 znalazł tę regułę złamaną
w dziesięciu plikach — wszystkie przez ten sam wzorzec: **mikro-nagłówek
sekcji** (WERSALIKI, 11–12 px) siedział na `--text-faint`, bo „to tylko
etykieta". Nie jest. Etykieta mówi, co jest pod nią, więc jest treścią —
i to treścią, którą czyta się jako pierwszą. Dekoracja to kreska, kropka,
ikona bez znaczenia; nie słowo.

**Jeden akcent na ekran.** Pomarańcz oznacza akcję główną albo bieżący stan.
Wszystko inne jest w skali szarości.

### Głębokość — dlaczego same cienie nie wystarczają

Na czarnym tle cień nie ma czego przyciemnić, więc karta z `box-shadow`
wygląda identycznie jak bez niego. Działa dopiero **cień w dół plus jasny włos
na górnej krawędzi** (`inset`) — ten włos czyta się jako światło padające
z góry i to on sprawia, że element wygląda jak przedmiot, a nie jak prostokąt
w innym odcieniu.

| Klasa | Do czego |
|---|---|
| `lift-1` | karty, stopki, kolumny — domyślny poziom |
| `lift-2` | panele wyróżnione, wprowadzenie do etapu |
| `lift-3` | modale i karta w talii Odkrywaj |
| `lift-hover` | karty klikalne: unosi o 1 px, nie rusza layoutu |

### Tło jest bezbarwne — i to nie jest oszczędność

Pierwsza wersja tła aplikacji miała dwie pomarańczowe poświaty i dwie rozmyte
figury marki. Wyglądało tanio i **tak wygląda zawsze**: kolorowa plama
rozmytego światła pod treścią to najczęstszy znak amatorskiego dark UI. Trzy
powody, dla których to nie jest kwestia gustu:

1. **Rozmycie nie ma krawędzi**, więc nie da się go odczytać jako decyzji.
   Czyta się jak zabrudzona warstwa.
2. **Konkuruje z treścią o nasycenie.** Pomarańcz w tle odbiera pomarańczowi
   przycisku znaczenie „tu kliknij".
3. **Akcent rozlany po ekranie przestaje być akcentem.** Kolor marki ma
   pojawiać się tam, gdzie coś ZNACZY.

[app-backdrop.tsx](src/components/app/app-backdrop.tsx) składa tło z trzech
bezbarwnych warstw: **światło z góry** (białe, 4% — jedno źródło, przez które
karty niżej czyta się jako przedmioty), **ziarno** (drobny szum z data URI;
czysta czerń wygląda jak dziura, ziarno daje jej fakturę) i **znak marki jako
znak wodny** — ta sama figura co na stronie głównej, ale wypełniona bielą
przez `mask-image`, nie kolorem. Linia ma krawędź, więc widać kształt zamiast
mgły.

### Akcenty — dwa narzędzia, każde raz na ekran

- **`edge-accent`** — włos gradientu na górnej krawędzi. Najtańszy sposób,
  żeby sekcja wyglądała zaprojektowana. Wymaga `overflow-hidden` na
  elemencie, inaczej wystaje za zaokrąglone narożniki.
- **`glow-vairo`** — **pierścień**, nie poświata, wokół tego, co jest teraz
  aktywne (bieżący etap na pasku). Kiedyś było to 32 px rozmycia i czytało się
  jak smuga; teraz to wyraźna obwódka plus krótki refleks.

**Policz pomarańcz przed wysłaniem ekranu.** Dashboard miał go w dziewięciu
miejscach naraz — logo, aktywna pozycja menu, chip etapu, przycisk, włos na
karcie, dwa podświetlone wiersze listy, dwie plakietki licznika. Przy
dziewięciu żadne z nich nie znaczyło już „tu patrz". Wypełnienia wierszy
zniknęły; ton niesie sama kropka, a nasycenie zostaje przy akcji głównej.

**Dekoracje mogą wychodzić poza kontener, dlatego `html` ma `overflow-x: clip`.**
`clip`, nie `hidden` — `hidden` utworzyłby kontener przewijania i zepsuł
`position: sticky` w sidebarze.

### Pasek etapów to klocki ze strzałką

Pięć pigułek obok siebie nie niosło kierunku — czytało się jak menu, z którego
coś się wybiera, a nie jak droga, którą się idzie. Na wąskim ekranie zawijało
się do dwóch linii i przestawało być paskiem. Strzałka rozwiązuje jedno i drugie
jednym kształtem: grot pokazuje, w którą stronę biegnie program.

Kształt robi `clip-path`, nie obrazek. Ujemny margines jest o 2 px mniejszy od
groty — stąd kreska między klockami. `clip-path` przycina też `border`
i `border-radius`, dlatego klocki nie mają obramowań, a zaokrąglenie całości
daje kontener z `overflow-hidden`. **Jeden rząd, nigdy dwa:** na telefonie
podpis ma tylko bieżący etap, pozostałe zwijają się do numeru — i to numer,
nie kropka, bo „2 z 5" to cała informacja, po którą się na taki pasek patrzy.

### Wejście ekranu — ruch jako hierarchia

Trzy warianty jednego pomysłu: rzeczy pojawiają się w kolejności, w której
trzeba je przeczytać. Statyczny ekran wysypuje wszystko naraz i oko samo musi
ustalić, od czego zacząć.

| Klasa | Co robi |
|---|---|
| `panels > *` | panele dashboardu wjeżdżają od dołu, co 70 ms |
| `steps > *` | klocki etapów wchodzą od lewej, co 70 ms — w stronę grotu |
| `grow-bar` | wypełnienie paska narasta z lewej (`transform`, nie `width`) |

Wszystkie używają `both`, więc element jest niewidoczny **zanim** animacja
ruszy — bez tego panele mrugają w pełnej krasie przez klatkę i dopiero potem
znikają, żeby wjechać. `prefers-reduced-motion` zeruje też `animation-delay`:
same skrócone czasy zostawiłyby skokowe pojawianie się przez pół sekundy, co
jest gorsze od animacji.

### Dwie szerokości kolumny na całą aplikację

`page` (48rem) to kolumna do czytania i wypełniania. `page-wide` (68rem)
dostają tylko ekrany, które naprawdę potrzebują szerokości: siatka dashboardu,
talia w Odkrywaj, dwupanelowe wiadomości, podgląd własnej karty. **Trzeciej
wartości nie ma i nie dodajemy.**

Powód jest konkretny: każdy ekran wybierał sobie szerokość sam, więc w użyciu
były cztery. Przełączenie zakładki w Ustawieniach (Profil 3xl → Konto 2xl)
przesuwało treść w bok. Skok layoutu przy nawigacji czyta się jako niedoróbka,
nawet gdy nikt nie potrafi powiedzieć, co dokładnie zobaczył. Drugą przyczyną
takich skoków jest pasek przewijania znikający na krótkiej stronie — stąd
`scrollbar-gutter: stable` na `html`.

### Znak rozpoznawczy: kontur i grzbiet

Marka Vairo miała dotąd jedno narzędzie — pomarańcz. Pomarańcz ma każdy.
Rzeczą naprawdę nietypową w tej identyfikacji są **rysunki warstwicowe**:
dziesiątki równoległych, falujących linii w figurach fal. Dopóki leżały
wyłącznie jako znak wodny w rogu ekranu, aplikacja wyglądała jak dowolny
inny ciemny motyw z pomarańczowym przyciskiem.

**`topo`** przenosi tę DNA na powierzchnie: bezszwowy kafelek 120×72 px
z sześcioma falami, krycie wpisane w sam rysunek (`stroke-opacity`), nie
w element — dzięki temu klasa dokłada się do dowolnego tła z Tailwinda
zamiast je nadpisywać. Wariant `topo-brand` niesie kolor na pustych kadrach.

**Czego tu NIE ma: `ridge`** — trzech równoległych kresek na górnej krawędzi
karty. Próbowałem i wyleciało, a powód wart jest zapisania, bo pomyłkę łatwo
powtórzyć: **kreska o pełnym kryciu położona na krawędzi zaokrąglonej karty
zawsze wygląda na przyciętą.** Promień narożnika (25 px) ucina ją w innym
miejscu na każdej wysokości, więc trzy linie na 0, 4 i 8 px urywały się
odpowiednio na 25, 12 i 7 px. Oko czyta to jako usterkę, nie jako wzór.
Przesunięcie startu za łuk tylko przenosi problem — wtedy kreska zaczyna się
„znikąd".

`edge-accent` działa od początku właśnie dlatego, że **zaczyna się od
przezroczystości** i nabiera koloru dopiero na 18% szerokości. Przycięcie na
łuku jest wtedy niewidoczne, bo nie ma czego przycinać. **To jest reguła na
każdy przyszły akcent krawędziowy.**

| Gdzie wolno | Gdzie nie |
|---|---|
| bohater ekranu (karta bieżącego etapu, nagłówek przewodnika) | pod dłuższym tekstem — warstwice mają fakturę |
| puste kadry: fallback zdjęcia, stany bez treści | więcej niż jedna powierzchnia na ekran |
| `edge-accent` na JEDNEJ karcie — tej najważniejszej | ten sam akcent na trzech kartach naraz — przestaje znaczyć |

### Ozdoba musi mieć krawędź

Spór o pomarańcz w tle rozstrzyga się tak: **rozmyta plama koloru to brud,
rysunek konturowy przy tym samym nasyceniu to grafika.** Dlatego fale marki
są w tle jako linia, nie jako poświata — w dwóch przeciwległych rogach, przy
9–12% krycia, z bardzo powolnym dryfem (34 i 40 s, przeciwne kierunki).

Górna fala jest zakotwiczona w rogu **obszaru treści**, nie okna
(`lg:left-[calc(248px_-_14vmin)]`): w rogu okna chowałaby się za sidebarem,
a rozmywanie sidebara na tyle, żeby prześwitywała, psuje kontrast logo.

### Ruch — jeden rytm dla całej aplikacji

`--dur-fast: 150ms`, `--dur: 220ms`, `--ease-out`. Różne czasy w różnych
komponentach czyta się jako niedbałość, nawet gdy nikt tego nie nazwie.
`stagger` pokazuje listę po kolei, co 40 ms — kolejność jest informacją.

**`prefers-reduced-motion` jest obsłużone globalnie**, ale z jednym warunkiem:
skracamy czas trwania, a **nie** usuwamy animacji. Elementy z `animation:
fade-up both` muszą zostać widoczne — samo `animation: none` zostawiłoby je
przy `opacity: 0`.

### Dotyk

Przyciski mają na telefonie co najmniej 44 px wysokości (`h-11 sm:h-10`,
`h-9 sm:h-8`) i wracają do zwartych rozmiarów na większym ekranie. Listy
w kolumnach etapu **nie mają własnego przewijania poniżej `lg`** — na
telefonie kolumny są jedna pod drugą i przewijanie w przewijaniu jest jednym
z najbardziej frustrujących wzorców na dotyku.

**Każdy komponent ma komplet stanów:** hover, `focus-visible` (widoczny pierścień),
active, disabled z powodem, loading, empty, error.

---

## Komendy

```bash
npm run dev            serwer deweloperski (localhost:3000 — nie 127.0.0.1)
npm run build          build produkcyjny
npm run typecheck      tsc --noEmit
npm run lint           eslint
npm run content:build -- <plik>   JSON treści → migracja SQL
```

Po każdej zmianie: **typecheck + lint + build** muszą być czyste.

---

## Baza danych

Migracje w `supabase/migrations/`, odpalane ręcznie w Supabase → SQL Editor,
**w kolejności numerów**. Wszystkie są idempotentne.

| Plik | Zawartość |
|---|---|
| `002_profile_social` | skille, avatar, headline, weekly focus, bucket `avatars` |
| `002b_avatar_limit` | limit zdjęcia 15 MB |
| `003_startups` | startupy, role, limit 3, kategorie, tagi, helpery RLS |
| `003b_fix_startups_rls` | poprawka RLS dla `INSERT ... RETURNING` |
| `003c_industry_tags` | pełna lista branż |
| `004_migrate_idea_to_startup` | przeniesienie danych sprzed modelu startupów |
| `005_stage_engine` | katalog `stage_*`, instancja, kaskada postępu |
| `006_content_ambition_v1` | treść Ambition (generowana) |
| `007_content_idea_v1` | treść Idea (generowana) |
| `008_roles_and_stages` | RLS ról (member = odczyt), rejestr 5 etapów |
| `009_social` | profile publiczne, otwarte role, prośby o dołączenie, logo teamu |
| `010_stage_closure` | snapshot + decyzja kończąca etap (`close_stage`) |
| `011_discovery_passes` | pominięci w Odkrywaj (prywatne, odwracalne) |
| `012_contact_and_messages` | zaczepka → match → rozmowa, widok skrzynki |
| `013_notifications` | powiadomienia z triggerów, jedno na zdarzenie |
| `014_fix_deletion` | usuwanie startupu i konta przestaje wpadać w ochronę Foundera |
| `015_fix_deletion_2` | te same poprawki w dwóch pozostałych triggerach + usuwanie konta |
| `016_public_stage_consent` | etap widoczny publicznie tylko za zgodą Foundera |
| `017_join_as_member` | przyjęcie zaproszenia tworzy członkostwo zawsze jako Member |
| `018_notifications_realtime` | powiadomienia na żywo — tabela w publikacji `supabase_realtime` |
| `019_chat_identity_and_realtime` | widok `contact_profiles` + wiadomości na żywo |

**Schemat bazowy leży POZA `migrations/`.** Tabela `profiles` i onboarding
powstały przed wprowadzeniem numeracji, więc na świeżej bazie kolejność jest
taka: `supabase/profiles.sql` → `supabase/fix_ensure_profile.sql` → dopiero
`migrations/002`…`019`. Zaczęcie od `002` kończy się błędem „relation does not
exist", bo ta migracja robi `alter table public.profiles`. Pełna tabela
kolejności: [supabase/README.md](supabase/README.md).

Pomocnicze: `DIAGNOSTYKA.sql` (co faktycznie wjechało), `BACKUP_export.sql`
(zrzut danych bez `pg_dump`), `CLEANUP_puste_etapy.sql`, `ROLLBACK_003_007.sql`.
`profile_social.sql` w katalogu `supabase/` jest **wycofany** — zastąpiła go
migracja 002; ma rekurencję w politykach RLS i nie wolno go odpalać.

**Zasada:** każda zmiana schematu to **nowy numerowany plik**, nigdy edycja
odpalonego. Wyjątek: pliki jeszcze nieodpalone u nikogo.

---

## Czego świadomie nie robimy w MVP

CRM · osobny czat zespołowy · finanse · pełny HR · zaawansowana analityka ·
time tracking · kreator arkuszy · silnik automatyzacji diagramów · webhooki ·
AI. „Współpracownik" w dokumencie **nie** oznacza asystenta AI.

Ścieżka Partner — dopiero w alfie.
