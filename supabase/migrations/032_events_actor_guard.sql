-- =============================================================================
-- 032 — historia celów i zadań nie blokuje usuwania konta
--
-- Odpal PO 031. Idempotentna.
--
-- Problem: triggery historii (`goals_after_write` z 025, `tasks_log_events`
-- z 029) wpisują autora zmiany jako `auth.uid()`. Przy usuwaniu konta baza
-- zeruje `owner_id` w celach i zadaniach tej osoby (`on delete set null`),
-- co jest UPDATE-em — trigger dopisuje wtedy wpis historii z `actor_id`
-- wskazującym profil, który właśnie znika. Klucz obcy `actor_id → profiles`
-- odrzuca taki wiersz i całe `delete_own_account()` się wycofuje.
-- Dotyczy każdego, kto prowadził cel albo zadanie w teamie, który zostaje.
--
-- Poprawka nie przepisuje dużych funkcji z 025 — dokłada strażnika PRZED
-- zapisem do obu tabel historii: autor, którego profilu już nie ma, staje
-- się pustym autorem. Tak samo skończyłby wpis zapisany wcześniej
-- (`on delete set null`), więc historia wygląda identycznie.
-- (CLAUDE.md, „Usuwanie": trigger przy kaskadzie musi sprawdzić, czy to,
-- na co wskazuje, jeszcze żyje.)
-- =============================================================================

create or replace function public.events_drop_missing_actor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.actor_id is not null
     and not exists (select 1 from public.profiles p where p.id = new.actor_id) then
    new.actor_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists goal_events_drop_missing_actor on public.goal_events;
create trigger goal_events_drop_missing_actor
  before insert on public.goal_events
  for each row execute function public.events_drop_missing_actor();

-- task_events powstaje w 029 — bez niej ta część się pomija.
do $$
begin
  if to_regclass('public.task_events') is not null then
    execute 'drop trigger if exists task_events_drop_missing_actor on public.task_events';
    execute 'create trigger task_events_drop_missing_actor
      before insert on public.task_events
      for each row execute function public.events_drop_missing_actor()';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Weryfikacja: oba wiersze powinny mieć `jest = true`
-- (task_events tylko, jeśli 029 jest odpalona).
-- -----------------------------------------------------------------------------
select tgname, true as jest
from pg_trigger
where tgname in ('goal_events_drop_missing_actor', 'task_events_drop_missing_actor')
  and not tgisinternal;
