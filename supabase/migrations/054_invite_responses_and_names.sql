-- =============================================================================
-- 054 — zaproszenia do zespołu: powiadomienia o odpowiedzi i nazwy stron
--
-- Odpal PO 053. Idempotentna. Dwie poprawki z testów:
--
-- 1. Odpowiedź na zaproszenie ma własne powiadomienie.
--
-- O rozstrzygnięciu prośby dowiaduje się ten, kto ją wysłał (`created_by`).
-- Przy zgłoszeniu to kandydat, więc „Jesteś w {team}" pasowało. Przy
-- ZAPROSZENIU to Founder albo Admin — i dostawał „Jesteś w Mój projekt",
-- jakby to on dołączył do własnego zespołu, zamiast „Kasia dołącza".
--
-- Ten sam `kind` dla obu kierunków nie pozwalał tego odróżnić ani na liście,
-- ani w toaście na żywo (ten nie dociąga niczego poza wierszem). Dlatego dwa
-- nowe rodzaje: `invite_accepted` i `invite_declined`. Sprawcą jest osoba
-- zaproszona (`responded_by`), adres prowadzi do strony Zespół — tam są
-- skład i wysłane zaproszenia. Zgłoszenia zostają przy `join_accepted`
-- i `join_declined`, jak dotąd.
--
-- `notify_join_request()` przepisana 1:1 z 013, zmienia się tylko gałąź
-- rozstrzygnięcia. Wcześniejsze powiadomienia zostają z dawnym `kind`.
--
-- 2. Osoba zaproszona widzi, kto i do jakiego zespołu ją zaprasza.
--
-- Zaproszony nie jest jeszcze członkiem, więc RLS na `startups` i `profiles`
-- odcinał mu embed — skrzynka pokazywała „— zaprasza Cię do zespołu" bez
-- nazwy zespołu i bez zapraszającego. `my_join_request_parties()` zwraca
-- WYŁĄCZNIE dla próśb, w których wołający jest osobą zaproszoną albo
-- kandydatem: nazwę i logo zespołu oraz nazwę publiczną (lub imię z konta,
-- gdy publicznej brak — tak jak widoki `public_*`) i awatar zapraszającego.
-- Bez e-maila, bez opisu pomysłu. Zespół sam tę osobę zaprosił, więc ujawnia
-- jej dokładnie to, co i tak musi zobaczyć, żeby zdecydować.
-- =============================================================================

alter table public.notifications drop constraint if exists notification_kind_valid;
alter table public.notifications
  add constraint notification_kind_valid check (kind in (
    'contact_received', 'contact_accepted', 'message_received',
    'join_application', 'join_invite', 'join_accepted', 'join_declined',
    'invite_accepted', 'invite_declined',
    'goal_assigned', 'task_assigned', 'goal_blocked', 'goal_due',
    'invite_link_joined'
  ));

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

  -- O rozstrzygnięciu dowiaduje się ten, kto prośbę wysłał. Przy zaproszeniu
  -- to strona zespołu, więc zdanie mówi o osobie zaproszonej, nie o odbiorcy.
  if new.direction = 'invite' then
    if new.status = 'accepted' then
      perform public.push_notification(
        new.created_by, 'invite_accepted', '/app/team',
        new.responded_by, new.startup_id, null, false);
    elsif new.status = 'declined' then
      perform public.push_notification(
        new.created_by, 'invite_declined', '/app/team',
        new.responded_by, new.startup_id, null, false);
    end if;
  else
    if new.status = 'accepted' then
      perform public.push_notification(
        new.created_by, 'join_accepted', '/app/team',
        new.responded_by, new.startup_id, null, false);
    elsif new.status = 'declined' then
      perform public.push_notification(
        new.created_by, 'join_declined', '/app/social/invites',
        new.responded_by, new.startup_id, null, false);
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Nazwy stron prośby dla osoby, której prośba dotyczy
-- ---------------------------------------------------------------------------

create or replace function public.my_join_request_parties()
returns table (
  request_id uuid,
  startup_id uuid,
  startup_name text,
  startup_logo_url text,
  inviter_id uuid,
  inviter_name text,
  inviter_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    s.id,
    s.name,
    s.logo_url,
    p.id,
    coalesce(nullif(trim(p.public_name), ''), p.full_name),
    p.avatar_url
  from public.startup_join_requests r
  join public.startups s on s.id = r.startup_id
  left join public.profiles p
    on p.id = r.created_by and r.direction = 'invite'
  where r.profile_id = auth.uid()
  order by r.created_at desc
  limit 200;
$$;

revoke all on function public.my_join_request_parties() from public, anon;
grant execute on function public.my_join_request_parties() to authenticated;
