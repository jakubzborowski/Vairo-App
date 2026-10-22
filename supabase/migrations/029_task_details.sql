-- =============================================================================
-- 029 — szczegóły zadania: notatka, powód blokady, data ukończenia, historia
--
-- Odpal PO 028. Idempotentna.
--
-- Redesign Tasków (Claude Design, 8a–8d) pokazuje na karcie powód blokady
-- („Czeka na podpis po stronie firmy"), w panelu zadania notatkę i historię,
-- a w kolumnie Zrobione „3 w tym tygodniu". Żadnej z tych rzeczy nie było
-- w schemacie 025 — tu dochodzą.
--
-- Aplikacja działa także BEZ tej migracji: odczyt pyta najpierw z nowymi
-- kolumnami, a przy błędzie ponawia bez nich i chowa pola, których nie ma
-- gdzie zapisać.
-- =============================================================================

alter table public.tasks add column if not exists note text;
alter table public.tasks add column if not exists blocker_note text;
alter table public.tasks add column if not exists completed_at timestamptz;

alter table public.tasks drop constraint if exists tasks_note_len;
alter table public.tasks
  add constraint tasks_note_len check (note is null or char_length(note) <= 2000);
alter table public.tasks drop constraint if exists tasks_blocker_note_len;
alter table public.tasks
  add constraint tasks_blocker_note_len check (blocker_note is null or char_length(blocker_note) <= 300);

-- Data ukończenia ustawia baza, nie aplikacja — inaczej „zrobione w tym
-- tygodniu" zależałoby od tego, czy ktoś nie zapomniał jej wysłać.
create or replace function public.tasks_track_completion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  -- Powód blokady ma sens tylko przy zablokowanym zadaniu.
  if new.status <> 'blocked' then
    new.blocker_note := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_track_completion on public.tasks;
create trigger tasks_track_completion
  before insert or update on public.tasks
  for each row execute function public.tasks_track_completion();

-- Uzupełnienie dla zadań, które już są zrobione: bez daty nie liczą się
-- do „w tym tygodniu", co jest prawdą — nie wiemy, kiedy je zrobiono.

-- -----------------------------------------------------------------------------
-- Historia zadania — jak goal_events, osobna tabela, bo zadanie żyje dłużej
-- niż jedna zmiana statusu celu.
-- -----------------------------------------------------------------------------
create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  startup_id uuid not null references public.startups (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint task_events_kind_valid check (kind in ('created', 'status', 'owner', 'deadline'))
);

create index if not exists task_events_task_idx on public.task_events (task_id, created_at desc);

alter table public.task_events enable row level security;

drop policy if exists "task_events_select" on public.task_events;
create policy "task_events_select"
  on public.task_events for select to authenticated
  using (public.is_startup_member(startup_id));

grant select on public.task_events to authenticated;

-- Wpisy powstają WYŁĄCZNIE z triggera. Nikt nie może dopisać sobie historii.
create or replace function public.tasks_log_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_events (task_id, startup_id, kind, payload, actor_id)
    values (new.id, new.startup_id, 'created', jsonb_build_object('owner_id', new.owner_id), auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_events (task_id, startup_id, kind, payload, actor_id)
    values (new.id, new.startup_id, 'status',
            jsonb_build_object('from', old.status, 'to', new.status, 'note', new.blocker_note),
            auth.uid());
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.task_events (task_id, startup_id, kind, payload, actor_id)
    values (new.id, new.startup_id, 'owner',
            jsonb_build_object('from', old.owner_id, 'to', new.owner_id), auth.uid());
  end if;
  if new.due_date is distinct from old.due_date then
    insert into public.task_events (task_id, startup_id, kind, payload, actor_id)
    values (new.id, new.startup_id, 'deadline',
            jsonb_build_object('due_date', new.due_date), auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_log_events on public.tasks;
create trigger tasks_log_events
  after insert or update on public.tasks
  for each row execute function public.tasks_log_events();
