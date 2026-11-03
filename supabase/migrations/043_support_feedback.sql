-- =============================================================================
-- 043 — Pomoc i opinie: zgłoszenia do zespołu Vairo
--
-- Odpal PO 042. Idempotentna.
--
-- Model: zgłoszenie trafia MAILEM do skrzynki zespołu (wysyła aplikacja,
-- `src/lib/mailer.ts`), z `Reply-To` ustawionym na autora — odpowiada się
-- zwykłym „Odpowiedz” w poczcie albo w helpdesku podpiętym pod tę skrzynkę.
-- Ta tabela NIE jest systemem ticketów. Jest:
--
--   • skrzynką nadawczą — zapis powstaje PRZED wysyłką maila, więc awaria
--     dostawcy poczty nie gubi zgłoszenia (`delivery_status`),
--   • źródłem numeru zgłoszenia (VA-XXXXXX) do tematu maila i potwierdzenia,
--   • rejestrem, z którego da się policzyć, ile i czego zgłaszają ludzie.
--
-- Kontakt (e-mail, imię, nazwa zespołu) jest ZAPISANY w chwili wysłania,
-- nie dociągany przez klucz obcy. Zgłoszenie to korespondencja z firmą:
-- usunięcie konta odpina je od profilu (`profile_id` → null), ale nie kasuje
-- — tak jak usunięcie konta nie kasuje maila w skrzynce support@.
-- Prośbę o usunięcie danych obsługuje się ręcznie: SUPPORT_zgloszenia.sql
-- (sekcja 4) + skrzynka pocztowa.
--
-- Aplikacja nie ma tu żadnej polityki RLS. Pisze wyłącznie przez dwie
-- funkcje `security definer`; czytać z aplikacji nie da się wcale.
-- =============================================================================

create table if not exists public.support_requests (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  created_at       timestamptz not null default now(),
  profile_id       uuid references public.profiles(id) on delete set null,
  contact_email    text not null,
  contact_name     text,
  startup_id       uuid references public.startups(id) on delete set null,
  startup_name     text,
  kind             text not null,
  message          text not null,
  page_path        text,
  user_agent       text,
  delivery_status  text not null default 'pending',
  delivery_attempts integer not null default 0,
  delivered_at     timestamptz,
  delivery_error   text,
  constraint support_kind_valid check (kind in ('bug', 'idea', 'question', 'other')),
  constraint support_delivery_valid check (delivery_status in ('pending', 'sent', 'failed')),
  constraint support_message_length check (char_length(btrim(message)) between 10 and 4000),
  constraint support_page_length check (page_path is null or char_length(page_path) <= 300),
  constraint support_agent_length check (user_agent is null or char_length(user_agent) <= 400),
  constraint support_error_length check (delivery_error is null or char_length(delivery_error) <= 500)
);

create index if not exists support_requests_profile_idx
  on public.support_requests (profile_id, created_at desc);
create index if not exists support_requests_undelivered_idx
  on public.support_requests (created_at)
  where delivery_status <> 'sent';

alter table public.support_requests enable row level security;

-- ---------------------------------------------------------------------------
-- Zapis zgłoszenia. E-mail do odpowiedzi bierzemy z `auth.users`, NIGDY
-- z formularza — inaczej dałoby się wysłać zgłoszenie z cudzym adresem
-- w `Reply-To` i zespół odpisałby obcej osobie.
-- ---------------------------------------------------------------------------
create or replace function public.submit_support_request(
  p_kind       text,
  p_message    text,
  p_page_path  text default null,
  p_user_agent text default null,
  p_startup_id uuid default null
)
returns table (
  id            uuid,
  reference     text,
  contact_email text,
  contact_name  text,
  startup_name  text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid     uuid := auth.uid();
  v_email   text;
  v_name    text;
  v_startup uuid;
  v_sname   text;
  v_ref     text;
  v_id      uuid;
  v_created timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- 10 zgłoszeń na godzinę na konto: przytrzymany Enter albo skrypt nie
  -- zaleje skrzynki, a nikt, kto naprawdę pisze, tego limitu nie dotknie.
  if (select count(*) from public.support_requests r
       where r.profile_id = v_uid
         and r.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'support_rate_limited';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;
  if v_email is null then
    select p.email into v_email from public.profiles p where p.id = v_uid;
  end if;
  if v_email is null then
    raise exception 'support_no_email';
  end if;

  select nullif(btrim(p.full_name), '') into v_name
    from public.profiles p where p.id = v_uid;

  -- Zespół tylko wtedy, gdy autor do niego należy.
  if p_startup_id is not null and public.is_startup_member(p_startup_id) then
    v_startup := p_startup_id;
    select s.name into v_sname from public.startups s where s.id = p_startup_id;
  end if;

  -- Numer czytelny przez telefon: bez 0/O i 1/I.
  loop
    v_ref := 'VA-' || (
      select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
        from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.support_requests r where r.reference = v_ref);
  end loop;

  insert into public.support_requests
    (reference, profile_id, contact_email, contact_name, startup_id, startup_name,
     kind, message, page_path, user_agent)
  values
    (v_ref, v_uid, v_email, v_name, v_startup, v_sname,
     p_kind, btrim(p_message), left(p_page_path, 300), left(p_user_agent, 400))
  returning support_requests.id, support_requests.created_at into v_id, v_created;

  return query select v_id, v_ref, v_email, v_name, v_sname, v_created;
end;
$$;

-- ---------------------------------------------------------------------------
-- Wynik wysyłki maila. Tylko autor i tylko świeżo po zapisie — stare
-- zgłoszenia są już zamknięte dla aplikacji.
-- ---------------------------------------------------------------------------
create or replace function public.mark_support_delivery(
  p_id    uuid,
  p_ok    boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_requests r
     set delivery_status   = case when p_ok then 'sent' else 'failed' end,
         delivery_attempts = r.delivery_attempts + 1,
         delivered_at      = case when p_ok then now() else r.delivered_at end,
         delivery_error    = case when p_ok then null else left(p_error, 500) end
   where r.id = p_id
     and r.profile_id = auth.uid()
     and r.created_at > now() - interval '15 minutes';
end;
$$;

revoke all on function public.submit_support_request(text, text, text, text, uuid) from public, anon;
grant execute on function public.submit_support_request(text, text, text, text, uuid) to authenticated;
revoke all on function public.mark_support_delivery(uuid, boolean, text) from public, anon;
grant execute on function public.mark_support_delivery(uuid, boolean, text) to authenticated;
