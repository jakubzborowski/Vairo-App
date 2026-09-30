-- ============================================================================
-- 013 · Powiadomienia (minimum z guidelines 10.7)
-- ----------------------------------------------------------------------------
-- Problem, który to zamyka: wysyłasz zgłoszenie i nic. Dostajesz zaproszenie
-- i nie wiesz o tym, dopóki sam nie wejdziesz w zakładkę. Rozmowy umierały
-- w skrzynce, do której nikt nie zaglądał.
--
-- Dwie zasady z guidelines, których pilnuje ten schemat:
--   • powiadomienie prowadzi PROSTO do właściwej karty (kolumna `href`),
--   • jedna zmiana to jedno powiadomienie — nie trzy z trzech modułów.
--     Dlatego kolejna wiadomość w tej samej, nieprzeczytanej rozmowie
--     podmienia wpis, a nie dokłada nowego.
--
-- Wpisy tworzą WYŁĄCZNIE triggery (security definer). Użytkownik nie ma
-- polityki INSERT — nikt nie wyśle powiadomienia w cudzym imieniu.
--
-- Odpal PO 012. Idempotentne.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  -- Kto wywołał zdarzenie. Nazwę czytamy przy wyświetlaniu, żeby zmiana
  -- imienia nie zostawiała w powiadomieniach starej wersji.
  -- Klucz nazwany jawnie: tabela ma dwa odwołania do `profiles`, więc PostgREST
  -- musi dostać nazwę ograniczenia, żeby wiedzieć, które złączyć.
  actor_id   uuid,
  startup_id uuid references public.startups (id) on delete cascade,
  href       text not null,
  -- Urywek treści, jeśli zdarzenie ją miało (wiadomość, zgłoszenie).
  preview    text,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_kind_valid check (kind in (
    'contact_received', 'contact_accepted', 'message_received',
    'join_application', 'join_invite', 'join_accepted', 'join_declined'
  )),
  constraint notifications_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null
);

create index if not exists notifications_inbox_idx
  on public.notifications (profile_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (profile_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (profile_id = auth.uid());

-- Jedyna zmiana dostępna userowi: oznaczenie jako przeczytane.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete to authenticated
  using (profile_id = auth.uid());

-- Świadomie brak INSERT: wpisy dodają tylko triggery poniżej.

-- ---------------------------------------------------------------------------
-- Wspólny zapis
-- ---------------------------------------------------------------------------

create or replace function public.push_notification(
  p_profile_id uuid,
  p_kind       text,
  p_href       text,
  p_actor_id   uuid default null,
  p_startup_id uuid default null,
  p_preview    text default null,
  -- true = kolejne takie samo zdarzenie podmienia nieprzeczytany wpis
  p_collapse   boolean default false
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Nikt nie dostaje powiadomienia o własnym działaniu.
  if p_profile_id is null or p_profile_id = p_actor_id then
    return;
  end if;

  if p_collapse then
    delete from public.notifications
    where profile_id = p_profile_id
      and kind = p_kind
      and href = p_href
      and read_at is null;
  end if;

  insert into public.notifications
    (profile_id, kind, href, actor_id, startup_id, preview)
  values
    (p_profile_id, p_kind, p_href, p_actor_id, p_startup_id,
     left(nullif(trim(coalesce(p_preview, '')), ''), 240));
end;
$$;

-- ---------------------------------------------------------------------------
-- Kontakt i rozmowa
-- ---------------------------------------------------------------------------

create or replace function public.notify_contact_signal()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.push_notification(
      new.recipient_id, 'contact_received', '/app/social/invites',
      new.sender_id, new.context_startup_id, new.message, false);
    return new;
  end if;

  if new.status = 'accepted' and old.status <> 'accepted' then
    perform public.push_notification(
      new.sender_id, 'contact_accepted', '/app/social/messages',
      new.recipient_id, new.context_startup_id, null, false);
  end if;

  return new;
end;
$$;

drop trigger if exists contact_signals_notify_insert on public.contact_signals;
create trigger contact_signals_notify_insert
  after insert on public.contact_signals
  for each row execute function public.notify_contact_signal();

drop trigger if exists contact_signals_notify_update on public.contact_signals;
create trigger contact_signals_notify_update
  after update on public.contact_signals
  for each row execute function public.notify_contact_signal();

create or replace function public.notify_message()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  target record;
begin
  for target in
    select profile_id
    from public.conversation_participants
    where conversation_id = new.conversation_id
      and profile_id <> new.sender_id
  loop
    perform public.push_notification(
      target.profile_id, 'message_received',
      '/app/social/messages/' || new.conversation_id::text,
      new.sender_id, null, new.body, true);
  end loop;
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_message();

-- ---------------------------------------------------------------------------
-- Zgłoszenia i zaproszenia do teamu
-- ---------------------------------------------------------------------------

create or replace function public.notify_join_request()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  manager record;
begin
  if tg_op = 'INSERT' then
    if new.direction = 'application' then
      -- Zgłoszenie idzie do wszystkich, którzy mogą je rozpatrzyć.
      for manager in
        select profile_id from public.startup_members
        where startup_id = new.startup_id and role in ('founder', 'admin')
      loop
        perform public.push_notification(
          manager.profile_id, 'join_application', '/app/team',
          new.profile_id, new.startup_id, new.message, false);
      end loop;
    else
      perform public.push_notification(
        new.profile_id, 'join_invite', '/app/social/invites',
        new.created_by, new.startup_id, new.message, false);
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- O rozstrzygnięciu dowiaduje się ten, kto prośbę wysłał.
  if new.status = 'accepted' then
    perform public.push_notification(
      new.created_by, 'join_accepted', '/app/team',
      new.responded_by, new.startup_id, null, false);
  elsif new.status = 'declined' then
    perform public.push_notification(
      new.created_by, 'join_declined', '/app/social/invites',
      new.responded_by, new.startup_id, null, false);
  end if;

  return new;
end;
$$;

drop trigger if exists join_requests_notify_insert on public.startup_join_requests;
create trigger join_requests_notify_insert
  after insert on public.startup_join_requests
  for each row execute function public.notify_join_request();

drop trigger if exists join_requests_notify_update on public.startup_join_requests;
create trigger join_requests_notify_update
  after update on public.startup_join_requests
  for each row execute function public.notify_join_request();

-- ---------------------------------------------------------------------------
-- Oznaczenie wszystkiego jako przeczytane
-- ---------------------------------------------------------------------------

create or replace function public.mark_notifications_read()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.notifications
  set read_at = now()
  where profile_id = auth.uid() and read_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_notifications_read() from public;
grant execute on function public.mark_notifications_read() to authenticated;

-- ---------------------------------------------------------------------------
-- Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'notifications') as ma_tabele,
  (select count(*) from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name in (
        'contact_signals_notify_insert', 'contact_signals_notify_update',
        'messages_notify', 'join_requests_notify_insert',
        'join_requests_notify_update')) as triggerow;
