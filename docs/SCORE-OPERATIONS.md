# SCORE — recenzje po zmianie zadań, limit warunku i mentorzy

## Wdrożenie

1. Po migracji 023 uruchom `024_score_mentors_and_condition_limits.sql`.
2. Uruchom `025_score_cron.sql` jako operator bazy (`postgres`). Instaluje
   rzeczywiste rozszerzenie pg_cron i zadanie `vairo-score-reward-queue`.
   Jeżeli projekt nie udostępnia rozszerzenia, ta migracja zwróci błąd,
   zamiast udawać, że harmonogram działa. Włącz Cron w panelu Supabase
   (Integrations → Cron) i ponów 025. Nie powtarzaj 022 ani 023.
3. Nadaj uprawnienia konkretnemu mentorowi i przypisz go do startupu — przykład poniżej.
4. Wdróż frontend. Nowy ekran wymaga `policy_revision=3` zwracanego przez 024.

Dokumentacja operatora Cron: [instalacja](https://supabase.com/docs/guides/cron/install),
[harmonogram i historia uruchomień](https://supabase.com/docs/guides/cron/quickstart).

## Kontrola harmonogramu

```sql
select jobid, jobname, schedule, active, command
from cron.job where jobname = 'vairo-score-reward-queue';

select d.status, d.start_time, d.end_time, d.return_message
from cron.job_run_details d join cron.job j on j.jobid = d.jobid
where j.jobname = 'vairo-score-reward-queue'
order by d.start_time desc limit 10;
```

Oczekiwany stan: jedno aktywne zadanie, `*/5 * * * *`, polecenie
`select public.score_flush_due_rewards();`. Ponowienie 025 aktualizuje
to samo nazwane zadanie. Sam komunikat sukcesu migracji potwierdza
rejestrację — po pierwszych pięciu minutach sprawdź historię wykonania.

Worker co pięć minut rozlicza partię do 100 użytkowników z kolejki.
Wybiera najdawniej sprawdzanych, również gdy poprzednia partia wciąż
czeka na limit. Nie wymaga logowania ani odwiedzania SCORE. Dzień limitu
jest nadal wyznaczany w Europe/Warsaw; harmonogram UTC nie zmienia tej zasady.
Wejście do SCORE pozostaje dodatkową ścieżką rozliczenia własnej kolejki.
Blokada workera zapobiega nakładaniu się dwóch przebiegów, a rozliczanie
zwykłych użytkowników nadal używa niezależnych blokad per osoba.

## N1 — zmienione zadania

`score_reviews.review_key` utrwala klucz zaakceptowanego dowodu, właściciela
i pełnego zestawu zadań. `score_review_candidates` pokazuje cel ponownie,
gdy aktualny klucz jest inny, nawet jeśli cel ma aktywną recenzję.
Właściciel widzi informację o potrzebie ponownej recenzji.

Nie trzeba otwierać ani zamykać celu. Recenzja dopłaca wyłącznie nowe
uprawnione nagrody; wcześniejsza nagroda za cel i opłacone zadania nie są
naliczane drugi raz. Pula 30 punktów zadań na cel nadal obowiązuje.
Dotychczasowe klucze rekonstruujemy tylko wtedy, gdy historyczny snapshot
zadań nadal pasuje i nic nie zostało zmienione po recenzji. Niepewne
historyczne recenzje wracają na listę raz do ponownego sprawdzenia.

## N2 — min_count

Liczba punktowanych Goals jest ograniczona do `min_count` rzeczywistego
warunku programu. Bierzemy mniejszą z wartości snapshotu i opublikowanego
szablonu, więc Founder nie podniesie limitu przez edycję własnego snapshotu.
Limit jest wspólny dla właścicieli w teamie i obejmuje zaakceptowane
oraz oczekujące nagrody, także przed wypłatą dzienną.

Cel rezerwuje jeden trwały slot jednego zgodnego warunku. Jeśli ma wiele
powiązań, wybieramy pierwszy dostępny warunek w stałej kolejności.
Ponowna recenzja tego samego celu nie zajmuje następnego slotu.
Odpięcie, archiwizacja, usunięcie celu lub ponowne utworzenie instancji
etapu nie zwalniają wykorzystanego slotu do nabijania kolejnych nagród.
Slot jest związany ze startupem i szablonowym warunkiem, nie z ID jego kopii.
Nawet usunięcie i odtworzenie startupu o tym samym UUID nie resetuje slotów.

Ponad limit nadal można tworzyć i realizować Goals, ale nie ma dodatkowej
nagrody SCORE za taki cel, jego zadania ani dokument. UI wyjaśnia przyczynę.
Migracja rezerwuje sloty dla wcześniejszych zaakceptowanych Goals, od
najstarszej recenzji. Wypłacona historia zostaje zachowana. Niewypłacone
nagrody ponad nowy limit nie są realizowane.

To ogranicza sondę z trzema Goals pod jednym warunkiem, ale nie rozwiązuje
tożsamości dwóch kont. Odrębny startup ma własne limity warunków. Jednorazowe
osobiste bonusy punktów i etapów nadal nie mnożą się między startupami.

## Mentor programu

Nie zmieniamy ról Founder/Admin/Member w teamach. Mentor jest osobnym,
zweryfikowanym uprawnieniem w `program_mentors`, z przypisaniem do konkretnego
startupu w `startup_mentors`. Nadanie i cofnięcie wykonuje wyłącznie operator
SQL lub zaufany backend z `service_role`. Founder nie ma INSERT/UPDATE/DELETE
do tych tabel i nie może samodzielnie nadać uprawnienia drugiemu kontu.

Mentor otwiera `/app/score`, wybiera przypisany team i może:

- ustalić skalę cudzej pracy przed rozpoczęciem;
- przeczytać dowód oraz zadania i zaakceptować wynik Foundera;
- przeczytać odpowiedzi/dowody punktu lub etapu i zaakceptować udział Foundera;
- otworzyć pliki z przypisanego startupu do weryfikacji dowodu.

Mentor nie otrzymuje członkostwa teamu ani uprawnień do edycji celów,
odpowiedzi, plików i członkostwa. Nadal nie zatwierdza własnych nagród ani
pakietu, którego jest beneficjentem. Cofnięte przypisanie odbiera dostęp
oraz unieważnia niewypłacone nagrody oczekujące na taką akceptację.

Przykład dla operatora — zastąp UUID rzeczywistymi identyfikatorami:

```sql
-- Znajdź konta i startup; nie wpisuj tych komend do klienta aplikacji.
select id, full_name, email from public.profiles order by full_name;
select id, name from public.startups order by name;

insert into public.program_mentors(profile_id, operator_note)
values ('MENTOR_PROFILE_UUID'::uuid, 'Mentor zweryfikowany przez operatora Vairo')
on conflict(profile_id) do update set revoked_at = null, operator_note = excluded.operator_note;

insert into public.startup_mentors(startup_id, mentor_id)
values ('STARTUP_UUID'::uuid, 'MENTOR_PROFILE_UUID'::uuid)
on conflict(startup_id, mentor_id) do update set revoked_at = null;

-- Cofnięcie dostępu do jednego teamu:
update public.startup_mentors set revoked_at = now()
where startup_id = 'STARTUP_UUID'::uuid and mentor_id = 'MENTOR_PROFILE_UUID'::uuid;
```

## Testy

```sh
node scripts/test-score.mjs
node scripts/test-score-v2.mjs
node scripts/test-score-v3.mjs
npm run typecheck
```

Nowy zestaw wykonuje 024 na PostgreSQL/WASM z produkcyjnymi walidatorami
dowodów i warunków. Sprawdza N1, limit wspólny/ponowną recenzję, zakres
mentora, brak samodzielnego nadawania roli i wypłatę po odnowieniu limitu
bez `score_overview`. PGlite nie uruchamia demona pg_cron: test rejestracji
używa makiety API `cron.schedule`, a następnie wykonuje dokładnie polecenie
zapisanego zadania. Rzeczywistą instalację i harmonogram trzeba sprawdzić
w zdalnym Supabase powyższymi zapytaniami.
