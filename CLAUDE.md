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

**Otwarcie etapu jest decyzją, nie skutkiem ubocznym oglądania.** Wejście
w pominięty etap pokazuje ekran z wyjaśnieniem i osobnym przyciskiem
„Uzupełnij mimo to"; instancja powstaje dopiero po tym kliknięciu. Wcześniej
samo kliknięcie w pasek zakładało etap i program cofał się do niego.

**Pasek etapów ma pięć stanów:** domknięty, bieżący, **otwarty** (ktoś do
niego wrócił, ale program jest dalej), **pominięty** i zablokowany. Pominięty
dostaje kreskę, nie kłódkę — kłódka PRZED bieżącym etapem czyta się jak
awaria. Wszystkie poza zablokowanym są klikalne.

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

**Żaden komunikat błędu nie wychodzi surowy.** `translateDbError()`
w [db-errors.ts](src/lib/db-errors.ts) zamienia naruszenia RLS, limity
i ograniczenia bazy na zdania po polsku. Nowa akcja serwerowa przepuszcza przez
niego każdy `error.message`, którego sama nie obsłużyła.

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
| **Twój team** (tylko gdy jesteś w teamie) | Start · Etap startupu · Team |
| **Social** | Odkrywaj · Wiadomości · Zaproszenia · Mój profil publiczny |
| **Stopka** | Powiadomienia · Jak to działa · Ustawienia |

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

**Jeden akcent na ekran.** Pomarańcz oznacza akcję główną albo bieżący stan.
Wszystko inne jest w skali szarości.

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

Pomocnicze: `DIAGNOSTYKA.sql` (co faktycznie wjechało), `BACKUP_export.sql`
(zrzut danych bez `pg_dump`), `ROLLBACK_003_007.sql`.

**Zasada:** każda zmiana schematu to **nowy numerowany plik**, nigdy edycja
odpalonego. Wyjątek: pliki jeszcze nieodpalone u nikogo.

---

## Czego świadomie nie robimy w MVP

CRM · osobny czat zespołowy · finanse · pełny HR · zaawansowana analityka ·
time tracking · kreator arkuszy · silnik automatyzacji diagramów · webhooki ·
AI. „Współpracownik" w dokumencie **nie** oznacza asystenta AI.

Ścieżka Partner — dopiero w alfie.
