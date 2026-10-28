# SCORE v2 — zweryfikowane wyniki

> Aktualizacja: migracje 024/025 dodają limit `min_count`, ponowne recenzje
> zadań, mentorów i rzeczywisty cron. Instrukcja: [SCORE-OPERATIONS.md](SCORE-OPERATIONS.md).

Aktualne zasady zastępują naliczanie po zmianie statusu z wersji 1.
Po migracji 022 zastosuj **023_score_verification.sql**. Nie uruchamiaj
ponownie 022 po 023. Migracja 023 jest idempotentna.

## Co podlega akceptacji

Cel musi być ukończony, mieć poprawny dowód i jawne powiązanie przez
`goal_condition_links` z rzeczywistym warunkiem opublikowanego programu.
Sprawdzamy pochodzenie warunku z `stage_goal_conditions`, startup, typ celu
i wymagany format dowodu. Sama edytowalna wartość `created_for_condition_id`
ani ręcznie utworzony warunek nie wystarczają.

SCORE wymaga akceptacji innego Foundera/Admina tego teamu. Nie wystarczy,
że ktoś inny kliknął status „Ukończony”. Recenzent sprawdza dowód i zadania,
a następnie zapisuje uzasadnienie (minimum 80 znaków, 12 słów i różnorodne
słownictwo). Nie może być właścicielem nagradzanego celu, jego ukończonych
zadań ani autorem punktowanego pliku. Praca jednoosobowa nadal działa,
ale nie tworzy samodzielnie zweryfikowanego SCORE.

Formularz akceptacji jest związany z wersją dowodu i zadań. Zmiana wyniku
po otwarciu formularza wymaga ponownego sprawdzenia; stary formularz nie
akceptuje po cichu nowej wersji. Dla plików uwzględniamy także ETag Storage.

Skalę standardową/wymagającą zatwierdza Founder/Admin **inny niż właściciel**,
przed pierwszym rozpoczęciem pracy. Po rozpoczęciu skala jest zamrożona,
również po cofnięciu do `todo`. Stare samodzielne oceny „wymagający”
przechodzą do skali standardowej na potrzeby nowych nagród.

## Jakość i deduplikacja

- Zdanie: minimum 40 znaków, 8 słów; długi tekst: 80 znaków, 12 słów.
- Link: poprawny URL oraz opis minimum 40 znaków, 8 słów.
- Plik: istnieje w Storage i bibliotece, ma dodatni rozmiar; recenzent
  sprawdza zawartość. Sam upload, kolejne wersje i pusty plik nie punktują.
- Wynik modułu: niepuste bloczki; zestaw Goals: zaakceptowane dowody celów.
- Dropdown/skala: poprawna odpowiedź plus niezależne merytoryczne uzasadnienie
  recenzenta — sam wybór wartości nie tworzy nagrody.
- Powtarzane znaki i niewystarczająco różnorodne słowa odpadają także w Social.
- Odcisk tekstu ignoruje interpunkcję, odstępy i wielkość liter. Ten sam dowód
  nie nagradza kolejnego celu tej samej osoby także w innym startupie.
  Dla pliku używamy ETag (awaryjnie ścieżki), dla linku URL.

To podstawowy filtr spamu oraz recenzja człowieka, nie automatyczne rozumienie
jakości biznesowej. Dwa współpracujące konta mogą oszukiwać recenzję; bez
weryfikacji tożsamości nie da się zagwarantować, że „druga osoba” jest realnie
niezależna. Nie twierdzimy, że minimalna długość dowodzi jakości.

## Punktacja i beneficjenci

- Cel: 40 / 80 dla właściciela.
- Zadanie: 5 / 15 dla właściciela, dopiero w zaakceptowanym wyniku.
  Wspólna pula zadań jednego celu to 30. Gdy zostaje mniej niż pełna waga
  kolejnego zadania, otrzymuje ono pozostałą część puli. Kolejność: data
  utworzenia i identyfikator. Task dodany później wymaga ponownej recenzji.
- Dokument: 10 dla autora uploadu, po akceptacji celu wykorzystującego plik.
- Punkt programu: pula 25; etap: pula 150. Dzielimy ją równo między członków
  teamu w chwili rzeczywistego ukończenia. Resztę pojedynczych punktów
  rozdzielamy według identyfikatorów; przy większej liczbie osób niż punktów
  część udziałów wynosi zero. Zamykający nie dostaje specjalnego bonusu.
  Każdy udział wymaga akceptacji innego Foundera/Admina niż beneficjent.
- Osobisty bonus danego punktu/etapu jest jednorazowy **łącznie ze wszystkich
  startupów i wersji tego etapu**. Klonowanie startupów nie powiela nagrody.
- Reputacja: feedback 5, pomoc 10 dla autora po potwierdzeniu wartości przez
  odbiorcę rzeczywiście otrzymanej, treściwej wiadomości.

Bonus programu sprawdza faktyczne odpowiedzi, warunki Goals i postęp
podpunktów. Nie zależy od nagród w rejestrze. Przy zamknięciu etapu
przygotowujemy także udziały za punkty ukończone przed wdrożeniem SCORE.
Nie przyznajemy wstecznie nagród za etapy już zamknięte przed migracją.
Całkowite pominięcie punktu lub szkielet bez treści nie daje nagrody.
Aktualizacja postępu przez mentora spoza teamu nie blokuje bonusu:
beneficjentami są rzeczywiści członkowie teamu, niezależnie od autora kliknięcia.

## Dzienny limit i kolejka

Limity osobiste w Europe/Warsaw: cele 200, zadania 60, dokumenty 30,
punkty programu 50, etapy 150; dodatkowo **260 SCORE pracy łącznie**.
Nadwyżka trafia do trwałej kolejki z widocznym powodem. Nie przepada
i nie wymaga otwierania/zamykania celu. Kolejkę rozliczamy przy wejściu
do SCORE oraz podczas odświeżenia widocznego ekranu co minutę.
Prywatna funkcja `score_flush_due_rewards()` jest dostępna dla `service_role`
do podłączenia przez worker/cron; migracja nie zakłada istnienia pg_cron
i sama nie tworzy harmonogramu. Bez workera nie obiecujemy wypłaty o północy
osobom, które nie odwiedzają SCORE.

Reputacja: feedback 15, pomoc 20 dziennie; do 10 od tej samej osoby
w ruchomych 7 dniach, bez wzajemnego wymieniania ocen. Limity dzienne
obejmują oczekujące, zatwierdzone nagrody przez kolejkę, nie ciche odrzucenie.

Przed wypłatą ponownie sprawdzamy zatwierdzony snapshot, właściciela,
członkostwo, powiązanie z programem i aktualny stan. Ponowne otwarcie celu
anuluje oczekującą akceptację i pokazuje przyczynę. Potrzebna jest nowa recenzja.
Wypłacone osiągnięcia są historią: nie płacimy drugi raz ani ich nie kasujemy.
Blokady działają dla użytkownika lub pary oceniających; nie ma jednego mutexu
serializującego nagrody wszystkich osób w aplikacji.

## Rangi i wcześniejsze wpisy

Świadoma decyzja: ranga pracy zależy **tylko od zweryfikowanego SCORE pracy**.
Reputacja jest osobnym wynikiem społecznościowym. Progi pozostają: Odkrywca 0,
Inicjator 100, Budowniczy 300, Realizator 700, Lider 1500, Twórca wpływu 3000.

Stare wpisy z 022 zostają w bazie jako `rules_version=1`, widoczne w UI jako
historia poprzednich zasad. Nie są przedstawiane jako zweryfikowane punkty
i nie podwyższają nowych rang/reputacji. Żadnych danych konta nie usuwamy.

## Testy

```sh
npm install --prefix .next/score-verification --no-save --package-lock=false @electric-sql/pglite
node scripts/test-score.mjs
node scripts/test-score-v2.mjs
npm run typecheck
```

Drugi zestaw używa oryginalnych `proof_matches` (018) i
`subpoint_goals_met` (019), migracji 022 i 023 oraz izolowanych tabel domeny.
Sprawdza regresje P1–P8, role/RLS, odnowienie limitu i idempotencję migracji.
Nie łączy się z produkcyjnym Supabase. Pełny smoke test na środowisku nadal
wymaga dwóch kont teamu: właściciela i niezależnego Foundera/Admina.
