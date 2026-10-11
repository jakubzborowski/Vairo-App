-- ===========================================================================
-- 018 · Powiadomienia na zywo (Supabase Realtime)
-- ===========================================================================
--
-- PO CO
--
-- Dotad powiadomienie o zaproszeniu albo wiadomosci pojawialo sie dopiero po
-- przeladowaniu strony. Czlowiek, ktory wlasnie wyslal zaczepke i siedzi na
-- ekranie, nie ma zadnego sygnalu, ze druga strona odpowiedziala — dopoki sam
-- nie kliknie odswiezenia. Dla aplikacji, w ktorej cala wartosc polega na tym,
-- ze ktos sie odezwie, to jest najgorsze mozliwe miejsce na cisze.
--
-- CO TO ROBI
--
-- Dopisuje tabele `notifications` do publikacji `supabase_realtime`, dzieki
-- czemu klient moze subskrybowac wstawienia. **Nie zmienia to niczego
-- w uprawnieniach**: Realtime respektuje RLS, wiec kazdy dostaje wylacznie
-- wiersze, ktore i tak wolno mu przeczytac (`notifications_select_own`).
--
-- `replica identity full` jest potrzebne, zeby zdarzenie niosło komplet
-- kolumn. Bez tego przy UPDATE dostajemy tylko klucz glowny, a my podmieniamy
-- istniejacy wpis przy kolejnej wiadomosci w tej samej rozmowie i chcemy
-- wtedy znac nowa tresc.
--
-- Idempotentna. Odpalac po 017.

alter table public.notifications replica identity full;

do $$
begin
  -- `add table` wywala sie, gdy tabela juz jest w publikacji, a nie ma dla
  -- tego skladni `if not exists`. Stad sprawdzenie w katalogu systemowym.
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

comment on table public.notifications is
  'Powiadomienia z triggerow. W publikacji supabase_realtime (018) — klient subskrybuje wstawienia, RLS nadal obowiazuje.';
