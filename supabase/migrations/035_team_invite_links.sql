-- =============================================================================
-- 035 — zaproszenie do teamu linkiem
--
-- Odpal PO 034. Idempotentna.
--
-- Uwaga z redesignu (🟠): „Vairo od początku jako multiplayer — zachęcać do
-- zaproszenia znajomych do swojego startupu”. Do tej pory zaprosić dało się
-- wyłącznie kogoś, kto JUŻ ma konto i jest widoczny w Social
-- (`startup_join_requests.profile_id` jest wymagane). Znajomego spoza Vairo
-- nie było jak ściągnąć do teamu.
--
-- Teraz Founder albo Admin tworzy link, wysyła go gdziekolwiek (WhatsApp,
-- Messenger), a osoba po zalogowaniu albo założeniu konta dołącza jako
-- Member — ta sama rola co przy zwykłym zaproszeniu (017).
--
-- Zasady:
--   • jeden aktywny link na team — nowy unieważnia poprzedni;
--   • ważny 7 dni, maksymalnie 10 dołączeń;
--   • token: 64 znaki szesnastkowe z dwóch gen_random_uuid() (244 losowe
--     bity) — bez rozszerzenia pgcrypto;
--   • tabela bez polityk zapisu: tworzenie, wyłączanie i przyjmowanie idą
--     wyłącznie przez funkcje poniżej, które same sprawdzają uprawnienia;
--   • limit 3 teamów pilnuje istniejący trigger `enforce_startup_limit` (003)
--     — funkcja wstawia członka zwykłym INSERT-em, więc go nie omija.
-- =============================================================================

create table if not exists public.startup_invite_links (
  id          uuid primary key default gen_random_uuid(),
  startup_id  uuid not null references public.startups (id) on delete cascade,
  token       text not null unique,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  revoked_at  timestamptz,
  use_count   integer not null default 0,
  max_uses    integer not null default 10,
  constraint startup_invite_links_max_uses check (max_uses between 1 and 50),
  constraint startup_invite_links_token_format check (token ~ '^[0-9a-f]{64}$')
);

create index if not exists startup_invite_links_startup_idx
  on public.startup_invite_links (startup_id) where revoked_at is null;

alter table public.startup_invite_links enable row level security;

-- Odczyt: tylko Founder i Admin tego teamu (karta „Zaproś” na stronie Team).
-- Zwykły członek nie widzi linku — gdyby go przekazał dalej, decyzja o tym,
-- kto wchodzi do teamu, przestałaby należeć do zarządzających.
drop policy if exists "Managers read invite links" on public.startup_invite_links;
create policy "Managers read invite links"
  on public.startup_invite_links for select
  to authenticated
  using (
    exists (
      select 1 from public.startup_members m
       where m.startup_id = startup_invite_links.startup_id
         and m.profile_id = auth.uid()
         and m.role in ('founder', 'admin')
    )
  );

revoke all on public.startup_invite_links from anon;
grant select on public.startup_invite_links to authenticated;

-- ---------------------------------------------------------------------------
-- Tworzenie linku (unieważnia poprzedni)
-- ---------------------------------------------------------------------------
create or replace function public.create_invite_link(p_startup uuid)
returns table (token text, expires_at timestamptz, use_count integer, max_uses integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (
    select 1 from public.startup_members m
     where m.startup_id = p_startup and m.profile_id = auth.uid()
       and m.role in ('founder', 'admin')
  ) then
    raise exception 'invite_not_allowed';
  end if;

  update public.startup_invite_links l
     set revoked_at = now()
   where l.startup_id = p_startup and l.revoked_at is null;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  return query
  insert into public.startup_invite_links (startup_id, token, created_by)
  values (p_startup, v_token, auth.uid())
  returning startup_invite_links.token, startup_invite_links.expires_at,
            startup_invite_links.use_count, startup_invite_links.max_uses;
end;
$$;

-- ---------------------------------------------------------------------------
-- Wyłączenie linku
-- ---------------------------------------------------------------------------
create or replace function public.revoke_invite_links(p_startup uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.startup_members m
     where m.startup_id = p_startup and m.profile_id = auth.uid()
       and m.role in ('founder', 'admin')
  ) then
    raise exception 'invite_not_allowed';
  end if;

  update public.startup_invite_links l
     set revoked_at = now()
   where l.startup_id = p_startup and l.revoked_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Podgląd zaproszenia — strona /join/<token>, także przed zalogowaniem.
-- Zwraca nazwę i logo teamu tylko temu, kto zna token; reszty nie zdradza.
-- ---------------------------------------------------------------------------
create or replace function public.invite_link_info(p_token text)
returns table (startup_id uuid, startup_name text, logo_url text, member_count integer, status text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  l public.startup_invite_links%rowtype;
  s public.startups%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return query select null::uuid, null::text, null::text, null::integer, 'not_found'::text;
    return;
  end if;

  select * into l from public.startup_invite_links where token = p_token;
  if not found then
    return query select null::uuid, null::text, null::text, null::integer, 'not_found'::text;
    return;
  end if;

  select * into s from public.startups where id = l.startup_id;

  return query
  select s.id, s.name, s.logo_url,
         (select count(*)::integer from public.startup_members m where m.startup_id = s.id),
         case
           when s.status is distinct from 'active' then 'inactive'
           when l.revoked_at is not null then 'revoked'
           when l.expires_at <= now() then 'expired'
           when l.use_count >= l.max_uses then 'used_up'
           else 'ok'
         end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Przyjęcie zaproszenia
-- ---------------------------------------------------------------------------
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

  return l.startup_id;
end;
$$;

revoke all on function public.create_invite_link(uuid) from public;
revoke all on function public.revoke_invite_links(uuid) from public;
revoke all on function public.invite_link_info(text) from public;
revoke all on function public.accept_invite_link(text) from public;
grant execute on function public.create_invite_link(uuid) to authenticated;
grant execute on function public.revoke_invite_links(uuid) to authenticated;
grant execute on function public.invite_link_info(text) to anon, authenticated;
grant execute on function public.accept_invite_link(text) to authenticated;
