-- ============================================================================
-- 014 · Naprawa usuwania startupu i konta
-- ----------------------------------------------------------------------------
-- Błąd: `protect_last_founder` odpala się także wtedy, gdy wiersze
-- `startup_members` znikają KASKADOWO — przy usuwaniu całego startupu albo
-- całego profilu. Skutek: nie dało się usunąć ani startupu, ani konta;
-- oba kończyły się komunikatem „najpierw przekaż rolę Foundera".
--
-- Reguła, o którą naprawdę chodziło: **startup, który istnieje, musi mieć
-- co najmniej jednego Foundera.** Kasowanie samego startupu jest czymś innym
-- niż odejście z niego i nie może wpadać w tę samą blokadę.
--
-- Przy okazji dwie rzeczy, które wychodzą z tego samego założenia:
--   • `startups.created_by` przestaje kasować startup razem z autorem konta —
--     autor mógł dawno przekazać rolę i odejść, a zespół pracuje dalej,
--   • usunięcie konta kasuje tylko te startupy, w których ta osoba była
--     JEDYNYM Founderem; reszta zostaje z pozostałymi Founderami.
--
-- Odpal PO 013. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ochrona ostatniego Foundera tylko dla żyjącego startupu
-- ---------------------------------------------------------------------------

create or replace function public.protect_last_founder()
returns trigger
language plpgsql
as $$
begin
  -- Startup jest właśnie kasowany (jego wiersz w tej transakcji już nie
  -- istnieje), więc członkostwa znikają kaskadowo. Nie ma czego chronić.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.startups where id = old.startup_id)
  then
    return old;
  end if;

  -- To samo, gdy znika cały profil: kasujemy członkostwo, nie odbieramy roli.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.profiles where id = old.profile_id)
  then
    return old;
  end if;

  if (tg_op = 'DELETE' and old.role = 'founder')
     or (tg_op = 'UPDATE' and old.role = 'founder' and new.role <> 'founder') then
    if (select count(*) from public.startup_members
        where startup_id = old.startup_id and role = 'founder') <= 1 then
      raise exception 'cannot_remove_last_founder'
        using errcode = 'check_violation',
              hint = 'Najpierw przekaz role Foundera innej osobie.';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists startup_members_protect_founder on public.startup_members;
create trigger startup_members_protect_founder
  before delete or update on public.startup_members
  for each row execute function public.protect_last_founder();

-- ---------------------------------------------------------------------------
-- 2. Autor konta nie zabiera ze sobą cudzego startupu
-- ---------------------------------------------------------------------------
-- `created_by` było `not null` z kaskadą, więc usunięcie konta autora kasowało
-- startup nawet wtedy, gdy rolę Foundera dawno przejął ktoś inny.

alter table public.startups alter column created_by drop not null;

alter table public.startups drop constraint if exists startups_created_by_fkey;
alter table public.startups
  add constraint startups_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 3. Usunięcie konta: znikają tylko startupy bez innego Foundera
-- ---------------------------------------------------------------------------
-- Musi wykonać się PRZED kaskadą na `startup_members`, inaczej zostałby
-- startup bez ani jednego Foundera — czyli stan, którego cała reguła zabrania.

create or replace function public.cleanup_orphan_startups()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.startups s
  where exists (
    select 1 from public.startup_members m
    where m.startup_id = s.id
      and m.profile_id = old.id
      and m.role = 'founder'
  )
  and not exists (
    select 1 from public.startup_members other
    where other.startup_id = s.id
      and other.role = 'founder'
      and other.profile_id <> old.id
  );

  return old;
end;
$$;

drop trigger if exists profiles_cleanup_startups on public.profiles;
create trigger profiles_cleanup_startups
  before delete on public.profiles
  for each row execute function public.cleanup_orphan_startups();

-- ---------------------------------------------------------------------------
-- 4. Weryfikacja
-- ---------------------------------------------------------------------------
-- Powinno zwrócić: created_by_nullable = YES, ma_trigger_sprzatajacy = 1.

select
  (select is_nullable from information_schema.columns
    where table_schema = 'public' and table_name = 'startups'
      and column_name = 'created_by') as created_by_nullable,
  (select count(*) from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name = 'profiles_cleanup_startups') as ma_trigger_sprzatajacy;
