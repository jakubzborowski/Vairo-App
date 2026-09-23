-- ============================================================================
-- 015 · Dokończenie naprawy usuwania + usuwanie konta z aplikacji
-- ----------------------------------------------------------------------------
-- 014 naprawiło jeden trigger, ale ta sama pomyłka siedziała w dwóch innych:
-- **strażnik nie odróżniał „ktoś odbiera mi wiersz" od „cały rodzic właśnie
-- znika"**. Przy kaskadzie oba wyglądają identycznie, więc blokada odpalała
-- się w momencie, w którym nie ma już czego chronić.
--
--   • `protect_general_category` — kategorii `general` nie wolno usunąć
--     ze ŻYJĄCEGO startupu. Gdy startup jest kasowany, ta kategoria ma
--     zniknąć razem z nim.
--   • `recalc_subpoint_progress` — po usunięciu odpowiedzi przelicza postęp
--     podpunktu. Przy kaskadowym kasowaniu etapu próbował wpisać postęp do
--     etapu, którego już nie ma — czyli naruszenie klucza obcego.
--
-- Plus funkcja `delete_own_account()`, żeby konto dało się usunąć z aplikacji,
-- a nie tylko ręcznie w panelu Supabase.
--
-- Odpal PO 014. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Kategoria `general` znika razem ze startupem
-- ---------------------------------------------------------------------------

create or replace function public.protect_general_category()
returns trigger
language plpgsql
as $$
begin
  -- Startup jest właśnie kasowany, więc jego kategorie lecą kaskadowo.
  -- Nie ma czego chronić — obowiązkowa kategoria dotyczy istniejącego startupu.
  if not exists (select 1 from public.startups where id = old.startup_id) then
    return old;
  end if;

  if old.category = 'general' then
    raise exception 'general_category_required'
      using errcode = 'check_violation',
            hint = 'Kategoria Ogolna walidacja jest obowiazkowa dla kazdego startupu.';
  end if;

  return old;
end;
$$;

drop trigger if exists startup_categories_protect_general on public.startup_categories;
create trigger startup_categories_protect_general
  before delete on public.startup_categories
  for each row execute function public.protect_general_category();

-- ---------------------------------------------------------------------------
-- 2. Postęp nie przelicza się dla etapu, którego już nie ma
-- ---------------------------------------------------------------------------
-- Zmiana wobec 005 to WYŁĄCZNIE dodana bramka na początku. Reszta ciała
-- funkcji jest bez zmian — kaskada postępu w obie strony działa dalej.

create or replace function public.recalc_subpoint_progress()
returns trigger
language plpgsql
as $$
declare
  v_stage uuid := coalesce(new.startup_stage_id, old.startup_stage_id);
  v_key   text := coalesce(new.answer_key, old.answer_key);
  r       record;
  v_missing integer;
begin
  -- Etap znika (kasowany startup albo konto), więc odpowiedzi lecą kaskadowo.
  -- Wpisywanie postępu do nieistniejącego etapu to naruszenie klucza obcego.
  if not exists (select 1 from public.startup_stages where id = v_stage) then
    return coalesce(new, old);
  end if;

  for r in
    select distinct f.subpoint_id
    from public.stage_fields f
    where f.answer_key = v_key
  loop
    select count(*) into v_missing
    from public.stage_fields f
    left join public.stage_answers a
      on a.answer_key = f.answer_key and a.startup_stage_id = v_stage
    where f.subpoint_id = r.subpoint_id
      and f.is_required
      and (
        a.value is null
        or a.value = 'null'::jsonb
        or a.value = '""'::jsonb
        or a.value = '[]'::jsonb
        or a.value = 'false'::jsonb
      );

    insert into public.stage_subpoint_progress
      (startup_stage_id, subpoint_id, is_complete, completed_at)
    values (v_stage, r.subpoint_id, v_missing = 0,
            case when v_missing = 0 then now() end)
    on conflict (startup_stage_id, subpoint_id) do update
    set is_complete  = excluded.is_complete,
        completed_at = case
          when excluded.is_complete
          then coalesce(public.stage_subpoint_progress.completed_at, now())
          else null
        end;
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists stage_answers_recalc on public.stage_answers;
create trigger stage_answers_recalc
  after insert or update or delete on public.stage_answers
  for each row execute function public.recalc_subpoint_progress();

-- ---------------------------------------------------------------------------
-- 3. Usunięcie własnego konta
-- ---------------------------------------------------------------------------
-- Kasujemy wiersz z `auth.users`; wszystko pozostałe idzie kaskadą:
--   auth.users → profiles → startup_members, profile_skills, wiadomości,
--   zaczepki, pominięci, powiadomienia
-- a trigger `profiles_cleanup_startups` (migracja 014) usuwa po drodze te
-- startupy, w których ta osoba była JEDYNYM Founderem.
--
-- Funkcja kasuje wyłącznie konto osoby, która ją wywołała — `auth.uid()`
-- pochodzi z tokenu, nie z parametru, więc nie da się podać cudzego id.

create or replace function public.delete_own_account()
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Weryfikacja
-- ---------------------------------------------------------------------------
-- `moze_usuwac_konta` MUSI być true. Jeśli wyjdzie false, usuwanie konta
-- z aplikacji nie przejdzie (aplikacja powie o tym wprost) i konta trzeba
-- kasować w panelu: Supabase → Authentication → Users.

select
  has_table_privilege(
    (select rolname from pg_roles where oid = (
      select proowner from pg_proc
      where proname = 'delete_own_account'
        and pronamespace = 'public'::regnamespace
      limit 1
    )),
    'auth.users', 'DELETE'
  ) as moze_usuwac_konta,
  (select count(*) from information_schema.routines
    where routine_schema = 'public'
      and routine_name = 'delete_own_account') as ma_funkcje;
