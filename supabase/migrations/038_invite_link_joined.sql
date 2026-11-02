-- =============================================================================
-- 038 — zapraszający dostaje powiadomienie, gdy ktoś dołączy przez link
--
-- Odpal PO 037. Idempotentna.
--
-- „Vairo rozwój socialu”, przebieg zaproszenia, krok 5: „Osoba zapraszająca
-- dostaje potwierdzenie”. W 035 `accept_invite_link` dodawał członka po
-- cichu — zapraszający dowiadywał się dopiero, zaglądając do składu teamu.
--
-- Nowy rodzaj powiadomienia `invite_link_joined` trafia do autora linku
-- (a gdy jego konta już nie ma — do nikogo; Founder i tak widzi skład).
-- Funkcja `accept_invite_link` jest przepisana 1:1 z 035 + jedno wywołanie
-- `push_notification` po dodaniu członka.
-- =============================================================================

alter table public.notifications drop constraint if exists notification_kind_valid;
alter table public.notifications
  add constraint notification_kind_valid check (kind in (
    'contact_received', 'contact_accepted', 'message_received',
    'join_application', 'join_invite', 'join_accepted', 'join_declined',
    'goal_assigned', 'task_assigned', 'goal_blocked', 'goal_due',
    'invite_link_joined'
  ));

create or replace function public.accept_invite_link(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.startup_invite_links%rowtype;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invite_invalid';
  end if;

  -- Blokada wiersza: dwa równoległe kliknięcia nie przekroczą `max_uses`.
  select * into l from public.startup_invite_links where token = p_token for update;
  if not found then
    raise exception 'invite_invalid';
  end if;

  -- Już w teamie: nic nie zmieniamy i nie zużywamy linku.
  if exists (select 1 from public.startup_members m
              where m.startup_id = l.startup_id and m.profile_id = auth.uid()) then
    return l.startup_id;
  end if;

  select st.status into v_status from public.startups st where st.id = l.startup_id;
  if v_status is distinct from 'active'
     or l.revoked_at is not null
     or l.expires_at <= now()
     or l.use_count >= l.max_uses then
    raise exception 'invite_invalid';
  end if;

  -- Zwykły INSERT — trigger `enforce_startup_limit` (003) zgłosi
  -- `startup_limit_reached`, jeśli to byłby czwarty team.
  insert into public.startup_members (startup_id, profile_id, role)
  values (l.startup_id, auth.uid(), 'member');

  update public.startup_invite_links
     set use_count = use_count + 1
   where id = l.id;

  -- Potwierdzenie dla autora linku. `push_notification` sam pomija pusty
  -- odbiorca (konto autora usunięte) i powiadomienie o własnym działaniu.
  perform public.push_notification(
    l.created_by, 'invite_link_joined', '/app/team',
    auth.uid(), l.startup_id, null, false
  );

  return l.startup_id;
end;
$$;

revoke all on function public.accept_invite_link(text) from public;
grant execute on function public.accept_invite_link(text) to authenticated;
