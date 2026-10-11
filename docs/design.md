# Design system

> Reguły wizualne Vairo. Obowiązują przy każdej zmianie w `/app`.
> Skrót i wskazówka, kiedy tu zajrzeć, są w [CLAUDE.md](../CLAUDE.md).


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

## Głębokość — dlaczego same cienie nie wystarczają

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

## Tło jest bezbarwne — i to nie jest oszczędność

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

[app-backdrop.tsx](../src/components/app/app-backdrop.tsx) składa tło z trzech
bezbarwnych warstw: **światło z góry** (białe, 4% — jedno źródło, przez które
karty niżej czyta się jako przedmioty), **ziarno** (drobny szum z data URI;
czysta czerń wygląda jak dziura, ziarno daje jej fakturę) i **znak marki jako
znak wodny** — ta sama figura co na stronie głównej, ale wypełniona bielą
przez `mask-image`, nie kolorem. Linia ma krawędź, więc widać kształt zamiast
mgły.

## Akcenty — dwa narzędzia, każde raz na ekran

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

## Pasek etapów to klocki ze strzałką

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

## Wejście ekranu — ruch jako hierarchia

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

## Dwie szerokości kolumny na całą aplikację

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

## Znak rozpoznawczy: kontur i grzbiet

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

## Ozdoba musi mieć krawędź

Spór o pomarańcz w tle rozstrzyga się tak: **rozmyta plama koloru to brud,
rysunek konturowy przy tym samym nasyceniu to grafika.** Dlatego fale marki
są w tle jako linia, nie jako poświata — w dwóch przeciwległych rogach, przy
9–12% krycia, z bardzo powolnym dryfem (34 i 40 s, przeciwne kierunki).

Górna fala jest zakotwiczona w rogu **obszaru treści**, nie okna
(`lg:left-[calc(248px_-_14vmin)]`): w rogu okna chowałaby się za sidebarem,
a rozmywanie sidebara na tyle, żeby prześwitywała, psuje kontrast logo.

## Ruch — jeden rytm dla całej aplikacji

`--dur-fast: 150ms`, `--dur: 220ms`, `--ease-out`. Różne czasy w różnych
komponentach czyta się jako niedbałość, nawet gdy nikt tego nie nazwie.
`stagger` pokazuje listę po kolei, co 40 ms — kolejność jest informacją.

**`prefers-reduced-motion` jest obsłużone globalnie**, ale z jednym warunkiem:
skracamy czas trwania, a **nie** usuwamy animacji. Elementy z `animation:
fade-up both` muszą zostać widoczne — samo `animation: none` zostawiłoby je
przy `opacity: 0`.

## Dotyk

Przyciski mają na telefonie co najmniej 44 px wysokości (`h-11 sm:h-10`,
`h-9 sm:h-8`) i wracają do zwartych rozmiarów na większym ekranie. Listy
w kolumnach etapu **nie mają własnego przewijania poniżej `lg`** — na
telefonie kolumny są jedna pod drugą i przewijanie w przewijaniu jest jednym
z najbardziej frustrujących wzorców na dotyku.

**Każdy komponent ma komplet stanów:** hover, `focus-visible` (widoczny pierścień),
active, disabled z powodem, loading, empty, error.
