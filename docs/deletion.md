# Usuwanie — co wolno skasować i jak

> Usuwanie startupu, konta i plików. Obowiązuje przy każdym nowym
> triggerze `DELETE` i przy każdym nowym buckecie.
> Twarde reguły są powtórzone w [CLAUDE.md](../CLAUDE.md).


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

**Storage nie jest częścią kaskady.** `storage.objects` nie ma klucza obcego
do niczego z `public` — ścieżka pliku to zwykły tekst — więc usunięcie
startupu zabierało odpowiedzi, a załączniki, logo i avatary zostawały
w bucketach na zawsze. „Nie da się otworzyć" (bo `can_access_stage()` nie ma
już czego znaleźć) to nie to samo co „nie ma".

Wszystkie trzy buckety trzymają pliki pod `<uuid-właściciela>/…`
(`avatars/<profile_id>`, `startup-logos/<startup_id>`,
`stage-files/<startup_stage_id>/<answer_key>`), więc sprzątanie to zawsze to
samo pytanie. **Każdy nowy bucket ma się do tej konwencji stosować** —
inaczej trzeba będzie napisać trzeci wariant tego samego kodu.

Sprzątanie jest DWUCZĘŚCIOWE i to nie jest nadmiarowość:

| Gdzie | Co kasuje | Po co |
|---|---|---|
| triggery (migracja 020) | wiersz w `storage.objects` | spójność: aplikacja, RLS i przeglądarka plików przestają go widzieć; łapie każdą drogę, także usunięcie konta |
| `purgeStartupFiles()` w akcji | plik przez API Storage | zwolnienie bajtów — **SQL tego nie robi** |

Kolejność w aplikacji jest istotna: **najpierw pliki, potem wiersz.** Póki
startup istnieje, Founder jest jego członkiem i RLS na buckecie go
przepuszcza; po usunięciu wiersza ten sam człowiek nie ma już prawa dotknąć
własnych załączników. Błąd przy kasowaniu pliku **nie przerywa** usuwania:
nieusunięty plik to koszt, nieusunięty startup po kliknięciu „usuń" to
złamana obietnica.

Świadomie nie robimy tego kluczem `service_role` ani wywołaniem HTTP z bazy.

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
