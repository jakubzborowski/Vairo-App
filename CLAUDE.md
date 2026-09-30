# Vairo — baza wiedzy projektu

Platforma prowadząca startup przez pięć etapów walidacji i budowy, plus warstwa
Social do znajdowania ludzi i zespołów.

**Ten plik zawiera wyłącznie to, co wiąże przy DOWOLNEJ zmianie w kodzie.**
Reguły dotyczące jednego obszaru leżą w `docs/` i czyta się je wtedy, gdy
rusza się ten obszar — **zanim** napisze się kod, nie po zepsuciu czegoś.
Każda wskazówka niżej mówi, czego dotyczy plik, więc da się poznać, że trzeba
tam zajrzeć, bez otwierania go.

| Plik | Kiedy jest obowiązkowy |
|---|---|
| [docs/design.md](docs/design.md) | zmiana czegokolwiek, co widać: kolory, odstępy, cienie, animacje, tło |
| [docs/social.md](docs/social.md) | Odkrywaj, zaczepki, rozmowy, zaproszenia, profile publiczne, menu boczne |
| [docs/dashboard.md](docs/dashboard.md) | ekran `/app`, lista „co teraz", powiadomienia, toasty |
| [docs/ux.md](docs/ux.md) | dokładanie nowej funkcji — jak prowadzić kogoś, kto się na tym nie zna |
| [docs/deletion.md](docs/deletion.md) | nowy trigger `DELETE`, nowy bucket, cokolwiek kasującego |
| [docs/content.md](docs/content.md) | zmiana pytań w etapach, importer treści, `answer_key` |
| [supabase/README.md](supabase/README.md) | kolejność odpalania migracji na świeżej bazie |

> Plany, audyty i rozpiski są w `_plan/` — katalog lokalny, w `.gitignore`.
> To nie jest miejsce na reguły: nie przetrwa sklonowania repo.

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

## Treść etapów jest DANYMI, nie kodem

Pytania nigdy nie trafiają do JSX. Źródłem są pliki JSON w `supabase/content/`,
a migrację SQL buduje z nich `npm run content:build -- <plik>`.

Odpowiedzi kluczujemy po `stage_fields.answer_key`, **nie po `field_id`** —
inaczej ponowny import osierociłby wszystko, co ludzie już wpisali.

→ [docs/content.md](docs/content.md), zanim dotkniesz treści albo importera.

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

## Warstwa Social — granice, które trzyma schemat

Dwie strony tego samego rynku: joiner szuka projektu, startup szuka ludzi.
Pętla kontaktu to **zaczepka → przyjęcie → rozmowa**; prośby o dołączenie to
jedna tabela z kolumną `direction`.

Trzy rzeczy z tej warstwy wiążą wszędzie, więc stoją tutaj:

- **Widoki `public_*` są jedynym wyjściem danych poza team.** Każda nowa
  kolumna w nich to świadoma decyzja o ujawnieniu. `idea_description`
  i `profiles.email` nie mają tam czego szukać — nigdy.
- **Publiczne jest to, co człowiek napisał dla obcych; prywatne jest to, co
  system o nim policzył.** Wyliczony etap walidacji wychodzi na zewnątrz
  wyłącznie za zgodą (`show_stage_publicly`, migracja 016).
- **Nie budujemy algorytmu rekomendacji.** Karta nazywa pokrycie, które i tak
  jest w danych. Nie liczymy wyniku, nie sortujemy „od najlepszych", nikogo
  nie ukrywamy — wymyślony powód to fake UI.

→ [docs/social.md](docs/social.md): talia, skrzynka, czat, nawigacja, pełna
tabela prywatności i to, czego karta świadomie nie pokazuje.

---

## Dashboard i powiadomienia

Dashboard odpowiada na pięć pytań: **gdzie jestem · co robić teraz · co
blokuje · kto za co odpowiada · po czym poznam koniec etapu.** Układ jest
**STAŁY przez wszystkie etapy** — sekcje się nie przenoszą i nie znikają.

Dwie reguły stąd obowiązują w całej aplikacji:

- **Każda liczba pochodzi z zapytania do bazy.** Panel z wymyśloną metryką
  („wynik gotowości: 72") wyglądałby mądrze i nie znaczyłby nic.
- **Każda akcja kończy się potwierdzeniem** (toast w prawym dolnym rogu).
  Brak potwierdzenia nie jest neutralny — czyta się jak niepewność. Błędy
  zostają **inline, przy polu**; toast niesie potwierdzenia.

→ [docs/dashboard.md](docs/dashboard.md): skład listy „co teraz", placeholdery,
reguła bieżącego etapu, Realtime.

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
      social/people/        talia „szukam ludzi" (+ [id]/ profil osoby)
      social/teams/         talia „szukam projektu" (+ [id]/ profil teamu)
      social/discover/      stary adres — tylko przekierowanie
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

## Prowadzenie za rękę

Zasada z góry tego pliku ma cztery konkretne odbicia w kodzie: pierwsze
wejście wygląda inaczej niż dziesiąte, każdy etap kończy się czymś do
przeczytania, decyzja jest poprzedzona wynikami, akcje siedzą pod ręką, a nie
przed oczami.

Jedna reguła stąd wiąże każdą nową akcję serwerową:

**Żaden komunikat błędu nie wychodzi surowy.** `translateDbError()`
w [db-errors.ts](src/lib/db-errors.ts) zamienia naruszenia RLS i ograniczenia
bazy na zdania po polsku — z ogonkami, bezosobowo (polszczyzna odmienia przez
rodzaj, a my go nie znamy), i **nieznany błąd też dostaje zdanie po polsku**.

→ [docs/ux.md](docs/ux.md) przed dokładaniem nowej funkcji.

---

## Usuwanie

Reguła, o którą chodzi: **startup, który istnieje, musi mieć co najmniej
jednego Foundera** — ale usunięcie całego startupu to co innego niż odejście
z niego i nie może wpadać w tę samą blokadę. Ta pomyłka wystąpiła w trzech
triggerach naraz (naprawione w 014 i 015), więc wniosek jest twardy:

**Każdy nowy trigger `BEFORE/AFTER DELETE`, który cokolwiek blokuje albo
dopisuje, musi na wejściu sprawdzić, czy jego rodzic jeszcze żyje.** Inaczej
zablokuje własną kaskadę.

**Storage nie jest częścią kaskady.** `storage.objects` nie ma klucza obcego
do niczego z `public`, więc pliki trzeba kasować osobno. Wszystkie buckety
trzymają je pod `<uuid-właściciela>/…` i **każdy nowy bucket ma się do tej
konwencji stosować**. Trigger kasuje wiersz, ale bajty zwalnia dopiero API
Storage — stąd `purgeStartupFiles()` w akcji, wołane PRZED usunięciem wiersza.

→ [docs/deletion.md](docs/deletion.md): co dokładnie kasuje usunięcie konta,
potwierdzenia, `delete_own_account()`.

---

## Design system

Tokeny w `src/app/globals.css`. Cztery reguły, które łamie się najczęściej
i które kosztują najwięcej:

- **Nie używamy surowych hexów w komponentach `/app`.**
- **`--text-faint` (34%, kontrast 3,05:1) wolno użyć WYŁĄCZNIE do dekoracji.**
  Podłogą dla treści jest `--text-subtle` (5,7:1). Mikro-nagłówek sekcji jest
  treścią, nie etykietą — audyt znalazł tę regułę złamaną w dziesięciu plikach.
- **Jeden akcent na ekran.** Pomarańcz oznacza akcję główną albo bieżący stan.
  Policz go przed wysłaniem ekranu; przy dziewięciu miejscach naraz żadne nie
  znaczy już „tu patrz".
- **Ozdoba musi mieć krawędź.** Rozmyta plama koloru to brud, rysunek
  konturowy przy tym samym nasyceniu to grafika. Akcent krawędziowy **zaczyna
  się od przezroczystości** — kreska o pełnym kryciu na zaokrąglonym narożniku
  zawsze wygląda na przyciętą.

→ [docs/design.md](docs/design.md): warstwy `lift-*`, tło, `topo`, pasek
etapów, animacje wejścia, dwie szerokości kolumny, dotyk, komplet stanów.

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
| `020_storage_cleanup` | pliki znikają razem z etapem, startupem i kontem |

**Schemat bazowy leży POZA `migrations/`.** Tabela `profiles` i onboarding
powstały przed wprowadzeniem numeracji, więc na świeżej bazie kolejność jest
taka: `supabase/profiles.sql` → `supabase/fix_ensure_profile.sql` → dopiero
`migrations/002`…`020`. Zaczęcie od `002` kończy się błędem „relation does not
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
