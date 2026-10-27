# SCORE v1

> Historyczny opis wersji 022. Aktualne zasady, niezależna akceptacja,
> podział puli i kolejka: [SCORE-V2.md](SCORE-V2.md). Wdrażaj 023 po 022.

Osobisty SCORE pracy i osobna reputacja społecznościowa. Wyniki pochodzą
wyłącznie z nieedytowalnego rejestru `score_events`; klient może go czytać
tylko dla zalogowanego użytkownika. Rangi to propozycja nowych nazw — Kuba
potwierdził dwa rodzaje punktów, ale nie przekazał nazw ze starego Vairo.

## Uruchomienie

1. Po migracji 021 uruchom `supabase/migrations/022_score.sql` w Supabase SQL Editor.
2. Uruchom `npm run dev` i wejdź na `/app/score`.
3. Naliczanie obejmuje zdarzenia od migracji. Nie wykonujemy backfillu dawnych osiągnięć.

## Punktowane efekty

- Zadanie standardowe: 5; wymagające: 15. Rozliczenie następuje po ukończeniu
  nadrzędnego celu z dowodem. Jeśli cel już ma nagrodę, późniejsze ukończenie
  zadania rozlicza się od razu. Budżet wszystkich zadań jednego celu: 30,
  wspólny dla teamu. Limit osobisty: 60 dziennie.
- Cel standardowy: 40; wymagający: 80. Właściciel otrzymuje punkty dopiero za
  `completed` z poprawnym `proof_snapshot`. Limit osobisty: 200 dziennie.
- Dokument/plik: 10 dla autora uploadu, po wykorzystaniu w ukończonym celu.
  Musi istnieć w Storage i mieć dodatni rozmiar w Storage oraz bibliotece.
  Sam upload lub edycja nie punktuje. Limit: 30 dziennie.
- Punkt programu: 25 dla osoby, która kończy ostatni wymagany podpunkt.
  Weryfikujemy postęp, odpowiedzi i warunki Goals. Reguły `skip_when` sprawdzamy tak samo jak silnik etapu. Punkt
  złożony wyłącznie z pominiętych podpunktów nie nagradza użytkownika.
- Etap: 150 dla osoby zamykającej etap. Wymaga opublikowanej treści,
  decyzji `continue` i nagród za wszystkie aktywne, niepominięte punkty.
  Przynajmniej jeden punkt musi być rzeczywiście ukończony. Szkielet/skip: 0.
- Feedback: 5 reputacji; pomoc z rezultatem: 10 reputacji. Odbiorca potwierdza
  wartość rzeczywiście otrzymanej wiadomości (minimum 80 znaków) w SCORE.
  Autor nie zatwierdza własnej pracy. Wiadomość można docenić raz, niezależnie
  od wybranego rodzaju. Limit: 15 feedbacku i 20 pomocy dziennie; 10 od tej
  samej osoby w ruchomych 7 dniach. Wzajemne oceny w 7 dniach są blokowane.

Skalę pracy ustala Founder/Admin w SCORE, zanim status opuści `todo`.
Pierwsze rozpoczęcie zamraża skalę, także po cofnięciu do `todo`.
Wszyscy zaczynają od skali standardowej. Zwykły Member nie zmienia skali.

SCORE jest osobisty, sumowany ze wszystkich teamów. Cel i zadanie nagradzają
właściciela, dokument autora uploadu. Bonusy punktów i etapów otrzymuje
osoba kończąca, a nie cały team. Reputacja ma równe wagi i nie wpływa na
rangę pracy. Limity dzienne używają strefy Europe/Warsaw; przekroczenie
limitu nie tworzy nagrody oczekującej na następny dzień.

## Rangi

- Odkrywca: 0.
- Inicjator: 100.
- Budowniczy: 300.
- Realizator: 700.
- Lider: 1500.
- Twórca wpływu: 3000.

Przykład: dwa zadania (5 + 15), cel z proof (40), dokument użyty w proof
(10), punkt programu (25) i etap (150) dają 245 SCORE. To Inicjator,
55 punktów do Budowniczego. Potwierdzony feedback daje osobno 5 reputacji.

## Ograniczenia nabijania

W rejestrze obowiązuje unikalność rodzaju i źródła nagrody. Ponowne
otwieranie, kończenie lub przeniesienie własności nie daje kolejnej nagrody.
Identyczny proof w tym samym teamie nie nagradza kolejnego celu: odcisk
pomija czas zapisu; dla tekstu normalizuje wielkość liter i odstępy, dla
linku używa URL, dla pliku używa ETag Storage (lub ścieżki, jeśli ETag brak).
Nagrody celów z powielonym dowodem nie uruchamiają nagród ich zadań.
SCORE mierzy utrwalone efekty, nie automatyczną ocenę jakości biznesowej.

Puste pliki nie nagradzają ani celu, ani dokumentu. Skip, logowanie,
swipe, liczba wiadomości i kosmetyczne wersje dokumentu dają 0.
Funkcja naliczająca jest prywatna dla klienta; zapis następuje w triggerach
w tej samej transakcji co rezultat. Blokada transakcyjna serializuje
naliczanie i kontrolę limitów przy równoczesnych żądaniach.
Rejestr zapisuje osiągnięcia historyczne: ponowne otwarcie nie odejmuje XP.

## Weryfikacja

```sh
npm install --prefix .next/score-verification --no-save --package-lock=false @electric-sql/pglite
node scripts/test-score.mjs
npm run typecheck
```

Test używa lokalnego PostgreSQL/WASM i minimalnej makiety tabel domenowych.
Sprawdza prawdziwe funkcje i triggery migracji 022, RLS i uprawnienia RPC.
Nie łączy się ze zdalnym Supabase. Pełny smoke test po migracji: ustal skalę
celu w `todo`, ukończ zadanie (jeszcze 0), ukończ cel z proof, otwórz SCORE
i sprawdź nagrody właściciela; ponownie otwórz/zamknij cel (brak nowej nagrody).
Z drugiego konta potwierdź otrzymaną wiadomość i sprawdź reputację autora.
