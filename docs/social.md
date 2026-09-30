# Warstwa Social i nawigacja

> Warstwa Social i nawigacja. Obowiązuje przy pracy nad Odkrywaj,
> zaczepkami, rozmowami, zaproszeniami i menu bocznym.
> Skrót jest w [CLAUDE.md](../CLAUDE.md).

## Odkrywaj, kontakt, rozmowy


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
w [profile-completeness.ts](../src/lib/profile-completeness.ts) liczy, na ile
karta nadaje się do pokazania obcym, i **nazywa każdy brak razem z powodem**.
Zdjęcie waży najwięcej (25), bo w tej warstwie decyduje o kliknięciu.
Nie blokujemy wejścia do Odkrywaj poniżej progu — blokada wypchnęłaby z
aplikacji tych, którzy najbardziej jej potrzebują. Zamiast tego pasek nad
talią mówi wprost, co jest puste.

Joiner po rejestracji idzie **prosto do kreatora profilu** (`/app/social/start`),
nie na pusty dashboard.

**Karta mówi, dlaczego ją widzisz.** [match.ts](../src/lib/match.ts) nazywa
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

## Nawigacja — w menu jest tylko to, co działa

Żadnej pozycji wyszarzonej, żadnego „wkrótce", żadnego linku do ekranu
z informacją, że czegoś jeszcze nie ma. Ktoś, kto pierwszy raz widzi tę
aplikację, nie odróżni „nieaktywne, bo nie powstało" od „nieaktywne, bo coś
zrobiłem źle" — a pół menu na szaro wygląda jak aplikacja, która się nie
wczytała. Widoczność rozstrzyga [nav-config.ts](../src/components/app/nav-config.ts);
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
