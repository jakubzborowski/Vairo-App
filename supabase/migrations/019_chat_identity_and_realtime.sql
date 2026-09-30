-- ===========================================================================
-- 019 · Kto to jest po drugiej stronie rozmowy + czat na żywo
-- ===========================================================================
--
-- PROBLEM 1 — „Bez imienia" w rozmowie i w skrzynce
--
-- Polityka `profiles_select_visible` (migracja 009) wpuszcza do pełnego
-- wiersza profilu wyłącznie: siebie, osoby z tego samego teamu i kandydatów
-- z oczekującym zgłoszeniem do teamu, którym się zarządza. To jest dobra
-- reguła — w tym wierszu jest e-mail i nie ma powodu, żeby trafiał dalej.
--
-- Tyle że cała warstwa Social działa POZA teamem. Dwie osoby, które poznały
-- się w Odkrywaj, nie mają wspólnego startupu, więc przy wczytywaniu rozmowy
-- `profiles(full_name, avatar_url)` zwracało NULL dla drugiej strony i czat
-- pokazywał „Bez imienia". To samo w skrzynce zaczepek: zgłoszenie przychodziło
-- od nikogo.
--
-- Rozwiązaniem NIE jest poszerzenie `is_profile_visible()` — to otworzyłoby
-- razem z imieniem e-mail. Rozwiązaniem jest osobny, wąski widok, który
-- wystawia dokładnie cztery kolumny i tylko tym osobom, z którymi rozmowa
-- już się zaczęła.
--
-- PROBLEM 2 — wiadomości nie dochodzą na żywo
--
-- Migracja 018 wpuściła do publikacji `supabase_realtime` powiadomienia.
-- Sam wątek nadal trzeba było odświeżać ręcznie, więc rozmowa wyglądała jak
-- formularz, a nie jak czat.
--
-- Obie sprawy są w jednym pliku, bo dotyczą jednej rzeczy: rozmowy, która ma
-- wyglądać jak rozmowa z konkretnym człowiekiem.
--
-- Idempotentna. Odpalać w Supabase → SQL Editor po migracji 018.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Wizytówka rozmówcy
-- ---------------------------------------------------------------------------
-- Widok CELOWO bez `security_invoker` — tak jak `public_profiles`
-- i `public_startups`. Omija RLS tabeli bazowej, a filtrem jest jego własne
-- WHERE. Dzięki temu jedno miejsce decyduje, co wychodzi poza team.
--
-- Zakres jest węższy niż `public_profiles` pod jednym względem i szerszy pod
-- drugim:
--   • węższy — wyłącznie osoby, z którymi łączy Cię zaczepka albo rozmowa;
--   • szerszy — nie sprawdza `is_discoverable`. Ktoś, kto po wysłaniu
--     zaczepki schował się z wyszukiwarki, nie może zamienić się w rozmowie
--     w anonima. Rozmowa już trwa; ukrycie profilu dotyczy przyszłych
--     znajomości, nie tych zawartych.
--
-- KAŻDA nowa kolumna w tym widoku to świadoma decyzja o ujawnieniu.
-- `email` nie ma tu czego szukać i nie ma go tu wpisywać.

drop view if exists public.contact_profiles;
create view public.contact_profiles as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.headline
from public.profiles p
where
  exists (
    select 1
    from public.contact_signals cs
    where (cs.sender_id = auth.uid() and cs.recipient_id = p.id)
       or (cs.recipient_id = auth.uid() and cs.sender_id = p.id)
  )
  or exists (
    select 1
    from public.conversation_participants mine
    join public.conversation_participants theirs
      on theirs.conversation_id = mine.conversation_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = p.id
  );

revoke all on public.contact_profiles from public, anon;
grant select on public.contact_profiles to authenticated;

-- Podzapytania widoku chodzą po tych kolumnach przy każdym otwarciu skrzynki.
create index if not exists contact_signals_sender_idx
  on public.contact_signals (sender_id);
create index if not exists contact_signals_recipient_idx
  on public.contact_signals (recipient_id);
create index if not exists conversation_participants_profile_idx
  on public.conversation_participants (profile_id);

-- ---------------------------------------------------------------------------
-- 2. Wiadomości na żywo
-- ---------------------------------------------------------------------------
-- `replica identity full` jest potrzebne, żeby zdarzenie niosło cały wiersz,
-- a nie sam klucz — inaczej klient dostaje INSERT bez treści i i tak musi
-- dopytać bazę.

alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.views
    where table_schema = 'public' and table_name = 'contact_profiles') as widok_contact_profiles,
  (select count(*) from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages') as messages_w_publikacji,
  (select count(*) from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications') as notifications_w_publikacji;
