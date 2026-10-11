# Dashboard — pięć pytań

> Dashboard i lista „co teraz". Obowiązuje przy zmianach na `/app`
> i w `next-actions.ts`. Skrót jest w [CLAUDE.md](../CLAUDE.md).


Guidelines: dashboard ma odpowiadać na pytania **gdzie jestem · co robić teraz ·
co blokuje · kto za co odpowiada · po czym poznam koniec etapu**.

**Lista „co teraz"** (`loadNextActions()` w [next-actions.ts](../src/lib/next-actions.ts))
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

`ToastProvider` ([toast.tsx](../src/components/ui/toast.tsx)) pokazuje je w prawym
dolnym rogu. Trzy reguły: **sukces znika po 4 s, błąd NIE** (komunikat o błędzie
trzeba zdążyć przeczytać, czasem przepisać), maksymalnie **trzy naraz** (kolejka
dziesięciu przestaje być potwierdzeniem, a staje się przeszkodą) i `aria-live="polite"`,
żeby czytnik ekranu ogłosił treść bez przerywania pracy.

Błędy zostają **inline, przy polu**, a nie w toaście — bliżej przyczyny. Toast
niesie potwierdzenia.

**Powiadomienia przychodzą na żywo** ([live-notifications.tsx](../src/components/app/live-notifications.tsx)):
subskrypcja Realtime na `notifications`, filtrowana po własnym `profile_id`.
Filtr jest oszczędnością, **nie zabezpieczeniem** — Realtime respektuje RLS,
więc polityka `notifications_select_own` i tak nie przepuści cudzych wierszy.
Toast składamy z `kind`, bez dociągania imienia nadawcy: wiersz go nie niesie
(celowo), a dodatkowe zapytanie przy każdym zdarzeniu to koszt bez pokrycia.
Pełne zdanie z imieniem czeka na liście powiadomień.

**Powiadomienia** (migracja 013) powstają wyłącznie z triggerów, więc nikt nie
wyśle powiadomienia w cudzym imieniu — tabela nie ma polityki INSERT. Treść
komunikatu składa [notifications.ts](../src/lib/notifications.ts), nie baza:
zmiana brzmienia to jedna linijka, a zmiana imienia nadawcy nie zostawia
w skrzynce starej wersji. Kolejna wiadomość w tej samej, nieprzeczytanej
rozmowie **podmienia** wpis — jedna zmiana to jedno powiadomienie.
