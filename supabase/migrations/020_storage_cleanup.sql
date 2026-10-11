-- ===========================================================================
-- 020 · Pliki znikają razem z tym, do czego należały
-- ===========================================================================
--
-- PROBLEM
--
-- Kasowanie idzie kaskadą po tabelach: usunięcie startupu zabiera etapy,
-- etapy zabierają `stage_answers`. Storage nie jest częścią tej kaskady —
-- `storage.objects` nie ma klucza obcego do niczego z `public`, bo ścieżka
-- pliku to zwykły tekst. Efekt: po usunięciu startupu odpowiedzi znikały,
-- a załączniki, logo i avatary zostawały w bucketach na zawsze.
--
-- To nie jest tylko sprzątanie. Trzy powody, dla których to ma znaczenie:
--
--   1. **Prywatność.** RLS na `stage-files` sprawdza `can_access_stage()`
--      po pierwszym segmencie ścieżki. Po usunięciu etapu ta funkcja nie ma
--      już czego znaleźć, więc plik jest niedostępny — ale NADAL LEŻY
--      w buckecie. „Nie da się otworzyć" to nie to samo co „nie ma".
--   2. **Rachunek.** Bajty liczą się do limitu projektu niezależnie od tego,
--      czy coś w aplikacji jeszcze o nich wie.
--   3. **Zgodność z tym, co obiecujemy.** Ekran usuwania startupu mówi
--      wprost: „kasuje wszystko". Musi kasować wszystko.
--
-- CO TEN PLIK ROBI, A CZEGO NIE
--
-- Kasuje **wiersze w `storage.objects`**, czyli to, co widzi aplikacja, RLS
-- i przeglądarka plików w panelu. Fizyczne usunięcie bajtów z backendu
-- Storage robi dopiero API Storage, a nie SQL — dlatego akcja `deleteStartup`
-- w aplikacji **najpierw** kasuje pliki przez API (własnym tokenem Foundera,
-- póki jeszcze ma do nich dostęp), a te triggery są siatką bezpieczeństwa na
-- drogi, które API nie obsłuży: usunięcie konta, kaskadę z innego miejsca,
-- pojedynczy etap skasowany ręcznie w SQL-u.
--
-- Świadomie NIE używamy tu klucza `service_role` ani wywołań HTTP z bazy.
-- Klucz omija całe RLS i nie ma go ani w repo, ani na kliencie — i tak
-- zostaje.
--
-- Idempotentna. Odpalać po 019.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Jeden helper na trzy buckety
-- ---------------------------------------------------------------------------
-- Wszystkie trzy trzymają pliki pod `<uuid-właściciela>/…`:
--
--   avatars        <profile_id>/avatar.<ext>
--   startup-logos  <startup_id>/logo.<ext>
--   stage-files    <startup_stage_id>/<answer_key>/<znacznik>-<nazwa>
--
-- Dzięki tej jednej konwencji sprzątanie to zawsze to samo pytanie: „czy
-- pierwszy segment ścieżki nadal istnieje w swojej tabeli". Każdy nowy bucket
-- ma się do niej stosować — inaczej trzeba będzie pisać trzeci wariant tego
-- samego kodu.

create or replace function public.purge_storage_folder(
  p_bucket text,
  p_owner  uuid
)
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  removed integer;
begin
  delete from storage.objects
   where bucket_id = p_bucket
     and (storage.foldername(name))[1] = p_owner::text;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_storage_folder(text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Triggery
-- ---------------------------------------------------------------------------
-- Uwaga do reguły z bazy wiedzy: „każdy nowy trigger BEFORE/AFTER DELETE musi
-- sprawdzić, czy jego rodzic jeszcze żyje, inaczej zablokuje własną kaskadę".
-- Tutaj sprawdzać nie ma czego i nie ma po co: te triggery niczego nie
-- blokują i nie dopisują do tabeli, która może już nie istnieć — kasują
-- wiersze w `storage.objects`, a ta tabela stoi zawsze. Dlatego są
-- bezpieczne wewnątrz dowolnej kaskady.

create or replace function public.cleanup_stage_files()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.purge_storage_folder('stage-files', old.id);
  return old;
end;
$$;

drop trigger if exists startup_stages_cleanup_files on public.startup_stages;
create trigger startup_stages_cleanup_files
  before delete on public.startup_stages
  for each row execute function public.cleanup_stage_files();

create or replace function public.cleanup_startup_logo()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.purge_storage_folder('startup-logos', old.id);
  return old;
end;
$$;

drop trigger if exists startups_cleanup_logo on public.startups;
create trigger startups_cleanup_logo
  before delete on public.startups
  for each row execute function public.cleanup_startup_logo();

create or replace function public.cleanup_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  perform public.purge_storage_folder('avatars', old.id);
  return old;
end;
$$;

drop trigger if exists profiles_cleanup_avatar on public.profiles;
create trigger profiles_cleanup_avatar
  before delete on public.profiles
  for each row execute function public.cleanup_profile_avatar();

-- ---------------------------------------------------------------------------
-- 3. Jednorazowe pozbieranie tego, co już zostało
-- ---------------------------------------------------------------------------
-- Warunek na kształt UUID jest celowy. Bez niego plik wrzucony kiedykolwiek
-- do korzenia bucketa (`foldername` daje wtedy pustą tablicę, a `[1]` NULL)
-- trafiłby pod `not exists` i zostałby skasowany. Sprzątaczka nie ma prawa
-- kasować niczego, czego nie rozpoznaje.

delete from storage.objects o
 where o.bucket_id = 'stage-files'
   and (storage.foldername(o.name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and not exists (
     select 1 from public.startup_stages s
      where s.id::text = (storage.foldername(o.name))[1]
   );

delete from storage.objects o
 where o.bucket_id = 'startup-logos'
   and (storage.foldername(o.name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and not exists (
     select 1 from public.startups s
      where s.id::text = (storage.foldername(o.name))[1]
   );

delete from storage.objects o
 where o.bucket_id = 'avatars'
   and (storage.foldername(o.name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and not exists (
     select 1 from public.profiles p
      where p.id::text = (storage.foldername(o.name))[1]
   );

-- ---------------------------------------------------------------------------
-- 4. Weryfikacja
-- ---------------------------------------------------------------------------
-- Po odpaleniu wszystkie trzy liczby sierot mają być zerami, a triggerów ma
-- być trzy. Ten sam SELECT można odpalić kiedykolwiek później jako kontrolę.

select
  (select count(*) from pg_trigger
    where tgname in (
      'startup_stages_cleanup_files',
      'startups_cleanup_logo',
      'profiles_cleanup_avatar'
    )) as triggerow,
  (select count(*) from storage.objects o
    where o.bucket_id = 'stage-files'
      and not exists (select 1 from public.startup_stages s
                       where s.id::text = (storage.foldername(o.name))[1])
  ) as sieroty_stage_files,
  (select count(*) from storage.objects o
    where o.bucket_id = 'startup-logos'
      and not exists (select 1 from public.startups s
                       where s.id::text = (storage.foldername(o.name))[1])
  ) as sieroty_logo,
  (select count(*) from storage.objects o
    where o.bucket_id = 'avatars'
      and not exists (select 1 from public.profiles p
                       where p.id::text = (storage.foldername(o.name))[1])
  ) as sieroty_avatary;
