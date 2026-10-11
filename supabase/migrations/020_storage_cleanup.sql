-- ===========================================================================
-- 020 · Pliki kasuje wyłącznie API Storage — nigdy SQL
-- ===========================================================================
--
-- HISTORIA TEGO PLIKU
--
-- Pierwsza wersja kasowała wiersze z `storage.objects` triggerami (przy
-- usunięciu etapu, startupu i profilu) i jednorazowo sprzątała sieroty.
-- Supabase blokuje to od strony platformy: trigger `storage.protect_delete()`
-- odrzuca każdy DELETE na tabelach Storage komunikatem
--
--   „Direct deletion from storage tables is not allowed. Use the Storage API
--    instead."
--
-- Powód po ich stronie jest ten sam, który opisywała pierwsza wersja tego
-- pliku: skasowany wiersz w `storage.objects` nie usuwa bajtów z backendu,
-- więc zostawia plik, o którym nic już nie wie. Platforma po prostu nie
-- pozwala na to w ogóle.
--
-- Skutek dla nas był gorszy niż błąd przy odpalaniu: gdyby triggery z
-- pierwszej wersji weszły do bazy, KAŻDE usunięcie startupu albo konta
-- kończyłoby się tym samym błędem — kaskada odpaliłaby trigger, trigger
-- spróbowałby skasować wiersz w Storage, platforma by odmówiła.
--
-- CO TEN PLIK ROBI TERAZ
--
-- Usuwa triggery i funkcje z pierwszej wersji, jeśli zdążyły powstać
-- (np. ktoś odpalał plik kawałkami), i nic poza tym. Na bazie, gdzie
-- pierwsza wersja się wywaliła, wszystkie polecenia są bezczynne.
--
-- GDZIE JEST SPRZĄTANIE PLIKÓW
--
-- Wyłącznie w aplikacji: `purgeStartupFiles()` i `purgeOwnAccountFiles()`
-- w `src/lib/storage-cleanup.ts`, wołane PRZED usunięciem wiersza, przez
-- API Storage, tokenem użytkownika — póki RLS jeszcze go do plików wpuszcza.
--
-- Pliki osierocone wcześniej (albo przez drogi, które nie przechodzą przez
-- aplikację) widać zapytaniem w `supabase/SPRAWDZ_MIGRACJE.sql`. Kasuje się
-- je ręcznie w panelu: Supabase → Storage. Klucza `service_role` do tego nie
-- używamy i nie wpisujemy nigdzie.
--
-- Idempotentna. Odpalać po 019.
-- ===========================================================================

drop trigger if exists startup_stages_cleanup_files on public.startup_stages;
drop trigger if exists startups_cleanup_logo on public.startups;
drop trigger if exists profiles_cleanup_avatar on public.profiles;

drop function if exists public.cleanup_stage_files();
drop function if exists public.cleanup_startup_logo();
drop function if exists public.cleanup_profile_avatar();
drop function if exists public.purge_storage_folder(text, uuid);

-- ---------------------------------------------------------------------------
-- Weryfikacja: ma być 0 triggerów i 0 funkcji ze starej wersji.
-- ---------------------------------------------------------------------------

select
  (select count(*) from pg_trigger
    where tgname in (
      'startup_stages_cleanup_files',
      'startups_cleanup_logo',
      'profiles_cleanup_avatar'
    )) as triggery_ze_starej_wersji,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('cleanup_stage_files', 'cleanup_startup_logo',
                        'cleanup_profile_avatar', 'purge_storage_folder')
  ) as funkcje_ze_starej_wersji;
