-- =============================================================================
-- 049 — Wersje językowe: język użytkownika i miejsce na tłumaczenia treści
--
-- Odpal PO 048. Idempotentna. Potem 050 (wygenerowane tłumaczenia treści).
--
-- 1. `profiles.locale` — język interfejsu wybrany w Ustawieniach
--    (pl, de, uk, es). Ten sam na każdym urządzeniu po zalogowaniu; po nim
--    aplikacja wie też, w jakim języku pisać powiadomienia i maile do tej
--    osoby. `null` = jeszcze niewybrany — aplikacja zapisuje wtedy język
--    z przeglądarki przy pierwszym wejściu.
--
--    Kolumna NIE trafia do widoków `public_*` ani `contact_profiles`: język
--    interfejsu to ustawienie, nie coś, co człowiek pisze dla obcych
--    (CLAUDE.md, „Warstwa Social”).
--
-- 2. `translations jsonb` w tabelach treści etapów:
--      { "de": { "title": "…", "question": "…", "config": { … } }, "uk": … }
--    Polskie kolumny zostają źródłem prawdy i domyślnym tekstem — aplikacja
--    nakłada tłumaczenie na wiersz (`src/lib/stage-i18n.ts`). Odpowiedzi
--    nadal kluczujemy po `answer_key`, więc zmiana języka niczego nie
--    osieroca. Wartości opcji (`config.options[].value`) się NIE tłumaczą —
--    to one trafiają do odpowiedzi i warunków `skip_when`; tłumaczy się
--    tylko `label`.
--
--    Dlaczego kolumna, a nie osobna tabela `stage_translations`: każde
--    zapytanie o drzewo etapu już ciągnie te wiersze — tłumaczenie przychodzi
--    w tym samym `select`, bez dodatkowego złączenia i bez ryzyka, że któraś
--    ścieżka (pasek etapów, podsumowanie, mentor AI) o nim zapomni.
--
--    Pliki treści 006–042 tej kolumny nie znają i nie muszą: tłumaczenia
--    ustawia osobno 050 (CLAUDE.md, „Plik treści nie może wyprzedzać
--    schematu”).
-- =============================================================================

alter table public.profiles
  add column if not exists locale text;

alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check
  check (locale is null or locale in ('pl', 'de', 'uk', 'es'));

comment on column public.profiles.locale is
  'Język interfejsu (pl/de/uk/es). Prywatne ustawienie — nie wychodzi do widoków public_*.';

alter table public.stage_templates  add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.stage_categories add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.stage_points     add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.stage_subpoints  add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.stage_fields     add column if not exists translations jsonb not null default '{}'::jsonb;

-- Kontrola: co faktycznie wjechało.
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'locale') as profiles_locale,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and column_name = 'translations'
      and table_name in ('stage_templates', 'stage_categories', 'stage_points', 'stage_subpoints', 'stage_fields')) as kolumny_translations;
