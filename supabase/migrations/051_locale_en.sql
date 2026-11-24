-- =============================================================================
-- 051 — Angielski jako piąty język interfejsu
--
-- Odpal PO 049 (i 050). Idempotentna.
--
-- 049 dopuściła w `profiles.locale` tylko pl/de/uk/es, więc zapis „en”
-- w Ustawieniach odbiłby się od ograniczenia. Ta migracja tylko je poszerza.
-- 049 jest już odpalona, więc zmiana idzie nowym plikiem (CLAUDE.md).
--
-- Tłumaczenia treści etapów na angielski wgrywa 052 (wygenerowane:
-- node scripts/content-i18n.mjs build 052).
-- =============================================================================

alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check
  check (locale is null or locale in ('pl', 'en', 'de', 'uk', 'es'));

comment on column public.profiles.locale is
  'Język interfejsu (pl/en/de/uk/es). Prywatne ustawienie — nie wychodzi do widoków public_*.';

-- Kontrola: definicja ograniczenia powinna zawierać 'en'.
select pg_get_constraintdef(oid) as profiles_locale_check
from pg_constraint
where conname = 'profiles_locale_check';
