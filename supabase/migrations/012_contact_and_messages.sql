-- ============================================================================
-- 012 · Kontakt, match i rozmowa
-- ----------------------------------------------------------------------------
-- Brakująca połowa warstwy Social. Do tej pory jedyną akcją było „zgłoś się do
-- teamu", którą widzieli wyłącznie Founder i Admin — czyli osoba bez teamu,
-- dla której Social w ogóle powstał, nie mogła zrobić nic poza oglądaniem.
--
-- Pętla, którą domyka ta migracja:
--   sygnał kontaktu → odpowiedź drugiej strony → rozmowa
--
-- Kontekst kontaktu: nadawca wybiera, czy pisze prywatnie, czy w imieniu
-- konkretnego teamu. Odbiorca zawsze widzi który — bez tego „cześć, fajny
-- profil" od nieznajomego nic nie znaczy.
--
-- Odpal PO 011. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Sygnał kontaktu
-- ---------------------------------------------------------------------------

create table if not exists public.contact_signals (
  id uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  -- null = piszę prywatnie, jako osoba
  context_startup_id uuid references public.startups (id) on delete set null,
  message      text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint contact_signal_not_self check (sender_id <> recipient_id),
  constraint contact_signal_status_valid check (
    status in ('pending', 'accepted', 'declined', 'withdrawn')),
  constraint contact_signal_message_len check (
    message is null or char_length(trim(message)) between 1 and 600)
);

-- Jedna otwarta zaczepka na parę. Historia zostaje.
create unique index if not exists contact_signals_one_pending
  on public.contact_signals (sender_id, recipient_id)
  where status = 'pending';

create index if not exists contact_signals_recipient_idx
  on public.contact_signals (recipient_id, status);
create index if not exists contact_signals_sender_idx
  on public.contact_signals (sender_id, status);

-- W imieniu teamu pisze tylko ktoś, kto do niego należy.
create or replace function public.validate_contact_signal()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.context_startup_id is not null
     and not exists (
       select 1 from public.startup_members
       where startup_id = new.context_startup_id
         and profile_id = new.sender_id
     )
  then
    raise exception 'not_a_member_of_context'
      using hint = 'Mozesz pisac w imieniu teamu, do ktorego nalezysz.';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_signals_validate on public.contact_signals;
create trigger contact_signals_validate
  before insert on public.contact_signals
  for each row execute function public.validate_contact_signal();

-- ---------------------------------------------------------------------------
-- 2. Rozmowa
-- ---------------------------------------------------------------------------
-- Rozmowa powstaje dopiero po przyjęciu kontaktu. Dzięki temu skrzynka nie
-- zapełnia się wątkami, na które nikt nie odpowiedział.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- kontekst przeniesiony z sygnału: „rozmawiacie w sprawie tego teamu"
  context_startup_id uuid references public.startups (id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);

create index if not exists conversation_participants_profile_idx
  on public.conversation_participants (profile_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint message_body_len check (char_length(trim(body)) between 1 and 4000)
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);

-- Lista rozmów sortuje się po ostatniej wiadomości, więc utrzymujemy to pole
-- triggerem zamiast liczyć max() przy każdym otwarciu skrzynki.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- 3. Helpery RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and profile_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

/**
 * Rozmowa z konkretną osobą, jeśli już istnieje.
 * Dzięki temu „Napisz" do kogoś, z kim już rozmawiamy, otwiera istniejący
 * wątek zamiast wysyłać drugą zaczepkę.
 */
create or replace function public.conversation_with(p_other uuid)
returns uuid
language sql security definer stable
set search_path = public
as $$
  select mine.conversation_id
  from public.conversation_participants mine
  join public.conversation_participants theirs
    on theirs.conversation_id = mine.conversation_id
  where mine.profile_id = auth.uid()
    and theirs.profile_id = p_other
  limit 1;
$$;

revoke all on function public.conversation_with(uuid) from public;
grant execute on function public.conversation_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------

alter table public.contact_signals            enable row level security;
alter table public.conversations              enable row level security;
alter table public.conversation_participants  enable row level security;
alter table public.messages                   enable row level security;

drop policy if exists "contact_signals_select" on public.contact_signals;
create policy "contact_signals_select"
  on public.contact_signals for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "contact_signals_insert" on public.contact_signals;
create policy "contact_signals_insert"
  on public.contact_signals for insert to authenticated
  with check (sender_id = auth.uid() and status = 'pending');

-- Świadomie brak UPDATE i DELETE: każda zmiana statusu idzie przez
-- respond_contact_signal(), żeby „kto może odpowiedzieć" było zapisane raz.

drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select to authenticated
  using (public.is_conversation_participant(id));

drop policy if exists "conversation_participants_select" on public.conversation_participants;
create policy "conversation_participants_select"
  on public.conversation_participants for select to authenticated
  using (public.is_conversation_participant(conversation_id));

-- Jedyna rzecz, którą uczestnik zmienia sam: znacznik przeczytania.
drop policy if exists "conversation_participants_update_own" on public.conversation_participants;
create policy "conversation_participants_update_own"
  on public.conversation_participants for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- 5. Odpowiedź na sygnał kontaktu
-- ---------------------------------------------------------------------------
-- Przyjęcie tworzy rozmowę i przenosi do niej pierwszą wiadomość — wszystko
-- w jednej transakcji, żeby nie powstał match bez wątku.

create or replace function public.respond_contact_signal(
  p_signal_id uuid,
  p_action    text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  sig public.contact_signals;
  uid uuid := auth.uid();
  v_conversation_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_action not in ('accept', 'decline', 'withdraw') then
    raise exception 'invalid_action';
  end if;

  select * into sig from public.contact_signals where id = p_signal_id for update;

  if not found then
    raise exception 'signal_not_found';
  end if;

  if sig.status <> 'pending' then
    raise exception 'signal_not_pending'
      using hint = 'Ta zaczepka zostala juz rozpatrzona.';
  end if;

  if p_action = 'withdraw' then
    if sig.sender_id <> uid then
      raise exception 'not_allowed';
    end if;
    update public.contact_signals
    set status = 'withdrawn', responded_at = now()
    where id = sig.id;
    return null;
  end if;

  -- Przyjąć albo odrzucić może wyłącznie adresat.
  if sig.recipient_id <> uid then
    raise exception 'not_allowed';
  end if;

  if p_action = 'decline' then
    update public.contact_signals
    set status = 'declined', responded_at = now()
    where id = sig.id;
    return null;
  end if;

  -- accept
  select mine.conversation_id into v_conversation_id
  from public.conversation_participants mine
  join public.conversation_participants theirs
    on theirs.conversation_id = mine.conversation_id
  where mine.profile_id = uid and theirs.profile_id = sig.sender_id
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (context_startup_id)
    values (sig.context_startup_id)
    returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, profile_id)
    values (v_conversation_id, sig.sender_id), (v_conversation_id, uid);
  end if;

  if sig.message is not null then
    insert into public.messages (conversation_id, sender_id, body, created_at)
    values (v_conversation_id, sig.sender_id, sig.message, sig.created_at);
  end if;

  update public.contact_signals
  set status = 'accepted', responded_at = now()
  where id = sig.id;

  return v_conversation_id;
end;
$$;

revoke all on function public.respond_contact_signal(uuid, text) from public;
grant execute on function public.respond_contact_signal(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Widok skrzynki
-- ---------------------------------------------------------------------------
-- Lista rozmów potrzebuje na pozycję: ostatniej wiadomości i liczby
-- nieprzeczytanych. Liczenie tego w aplikacji to zapytanie na każdą rozmowę;
-- tutaj jest jedno. `security_invoker` zostaje włączone, bo to NIE jest widok
-- publiczny — ma obowiązywać RLS tabel bazowych.

drop view if exists public.conversation_overview;
create view public.conversation_overview
with (security_invoker = true)
as
select
  cp.conversation_id,
  cp.profile_id,
  cp.last_read_at,
  c.context_startup_id,
  c.last_message_at,
  (select count(*)
     from public.messages m
    where m.conversation_id = cp.conversation_id
      and m.sender_id <> cp.profile_id
      and (cp.last_read_at is null or m.created_at > cp.last_read_at)
  ) as unread_count,
  (select m.body
     from public.messages m
    where m.conversation_id = cp.conversation_id
    order by m.created_at desc
    limit 1
  ) as last_body,
  (select m.sender_id
     from public.messages m
    where m.conversation_id = cp.conversation_id
    order by m.created_at desc
    limit 1
  ) as last_sender_id
from public.conversation_participants cp
join public.conversations c on c.id = cp.conversation_id;

grant select on public.conversation_overview to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('contact_signals', 'conversations',
                         'conversation_participants', 'messages')) as nowe_tabele,
  (select count(*) from information_schema.routines
    where routine_schema = 'public'
      and routine_name in ('respond_contact_signal', 'conversation_with',
                           'is_conversation_participant')) as nowe_funkcje;
