# Prowadzenie za rękę — co to znaczy w kodzie

> Jak zasada nadrzędna („Vairo jest dla ludzi, którzy mogą się na tym
> całkowicie nie znać") odbija się w konkretnym kodzie. Do przeczytania
> przed dokładaniem nowej funkcji. Skrót jest w [CLAUDE.md](../CLAUDE.md).


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
w [db-errors.ts](../src/lib/db-errors.ts) zamienia naruszenia RLS, limity
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
