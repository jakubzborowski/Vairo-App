# Baza danych — kolejność uruchamiania

Wszystko odpalamy ręcznie w **Supabase → SQL Editor**, w kolejności z tej
tabeli. Każdy plik jest idempotentny, więc ponowne odpalenie niczego nie psuje
— w razie wątpliwości lepiej odpalić drugi raz niż pominąć.

> **Uwaga na pliki spoza `migrations/`.** Schemat bazowy (tabela `profiles`
> i onboarding) powstał przed wprowadzeniem numeracji i leży w katalogu
> `supabase/`, nie w `migrations/`. Na świeżej bazie trzeba zacząć od niego —
> migracja `002` zakłada, że `profiles` już istnieje, i wywali się z błędem
> „relation does not exist", jeśli tego nie zrobisz.

## Na świeżej bazie — pełna kolejność

| # | Plik | Co robi |
|---|---|---|
| 1 | `profiles.sql` | tabela `profiles`, onboarding, helpery (`set_updated_at`, `slugify`) |
| 2 | `fix_ensure_profile.sql` | polityka INSERT na `profiles` + `ensure_own_profile()` — bez tego rejestracja nie zakłada profilu |
| 3 | `migrations/002_profile_social.sql` | umiejętności, avatar, headline, bucket `avatars` |
| 4 | `migrations/002b_avatar_limit.sql` | limit zdjęcia 15 MB |
| 5 | `migrations/003_startups.sql` | startupy, role, limit 3 teamów, kategorie, tagi, helpery RLS |
| 6 | `migrations/003b_fix_startups_rls.sql` | poprawka RLS dla `INSERT ... RETURNING` |
| 7 | `migrations/003c_industry_tags.sql` | pełna lista branż |
| 8 | `migrations/004_migrate_idea_to_startup.sql` | przeniesienie danych sprzed modelu startupów |
| 9 | `migrations/005_stage_engine.sql` | katalog `stage_*`, instancja etapu, kaskada postępu, bucket `stage-files` |
| 10 | `migrations/006_content_ambition_v1.sql` | treść Ambition (generowana z JSON) |
| 11 | `migrations/007_content_idea_v1.sql` | treść Idea (generowana z JSON) |
| 12 | `migrations/008_roles_and_stages.sql` | RLS ról (member = odczyt), rejestr pięciu etapów |
| 13 | `migrations/009_social.sql` | profile publiczne, otwarte role, prośby o dołączenie, bucket `startup-logos` |
| 14 | `migrations/010_stage_closure.sql` | snapshot + decyzja kończąca etap (`close_stage`) |
| 15 | `migrations/011_discovery_passes.sql` | pominięci w Odkrywaj |
| 16 | `migrations/012_contact_and_messages.sql` | zaczepka → match → rozmowa |
| 17 | `migrations/013_notifications.sql` | powiadomienia z triggerów |
| 18 | `migrations/014_fix_deletion.sql` | usuwanie startupu i konta przestaje wpadać w ochronę Foundera |
| 19 | `migrations/015_fix_deletion_2.sql` | te same poprawki w dwóch pozostałych triggerach |
| 20 | `migrations/016_public_stage_consent.sql` | etap publiczny tylko za zgodą Foundera |
| 21 | `migrations/017_join_as_member.sql` | przyjęcie zaproszenia tworzy członkostwo zawsze jako Member |
| 22 | `migrations/018_notifications_realtime.sql` | powiadomienia na żywo — tabela w publikacji `supabase_realtime` |
| 23 | `migrations/019_chat_identity_and_realtime.sql` | widok `contact_profiles` (imię rozmówcy spoza teamu) + wiadomości na żywo |

## Bucketów nie zakładamy ręcznie

Wszystkie trzy powstają z migracji:

| Bucket | Skąd | Limit |
|---|---|---|
| `avatars` | 002 + 002b | 15 MB |
| `stage-files` | 005 | wg migracji |
| `startup-logos` | 009 | 15 MB |

## Pliki pomocnicze — nie są częścią kolejności

| Plik | Do czego |
|---|---|
| `DIAGNOSTYKA.sql` | sprawdza, co faktycznie wjechało do bazy — odpal, gdy coś nie działa |
| `BACKUP_export.sql` | zrzut danych bez `pg_dump` |
| `CLEANUP_puste_etapy.sql` | kasuje puste wiersze `startup_stages` (najpierw `select`, dopiero potem odkomentowany `delete`) |
| `ROLLBACK_003_007.sql` | cofa migracje 003–007 |
| `profile_social.sql` | **NIE URUCHAMIAĆ** — zastąpiony przez `migrations/002`, ma rekurencję w politykach RLS |

## Zmiana schematu

Każda zmiana to **nowy numerowany plik** w `migrations/`, nigdy edycja
odpalonego. Wyjątek: plik, którego jeszcze nikt nie odpalił.
