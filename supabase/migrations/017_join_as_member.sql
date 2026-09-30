-- ===========================================================================
-- 017 · Przyjecie zaproszenia tworzy czlonkostwo ZAWSZE jako Member
-- ===========================================================================
--
-- PROBLEM
--
-- Guidelines, sekcja 4 („Match i dodanie do startupu"), mowia wprost:
--
--   „Dopiero zaakceptowanie zaproszenia tworzy membership. Uzytkownik
--    otrzymuje dostep do odpowiedniego workspace'u w dashboardzie JAKO
--    MEMBER. NIE OTRZYMUJE AUTOMATYCZNIE UPRAWNIEN ADMINISTRACYJNYCH,
--    taskow ani odpowiedzialnosci za Validation Milestones. Role i permisje
--    ustawia Founder albo Admin."
--
-- Funkcja `respond_join_request()` robila co innego: przy kierunku `invite`
-- wstawiala czlonkostwo z rola z pola `proposed_role`, ktora mogla byc
-- `admin`. Czyli **jedno klikniecie „Przyjmij" nadawalo prawa do zarzadzania
-- zespolem, zamykania etapow i usuwania ludzi** — bez zadnej osobnej decyzji
-- po stronie teamu.
--
-- DLACZEGO TO MA ZNACZENIE
--
-- Nadanie uprawnien jest czynnoscia teamu, nie zapraszanego. Przy poprzedniej
-- wersji Founder ustalal role w momencie wysylania zaproszenia — czesto na
-- dlugo przed tym, zanim ktokolwiek odpowiedzial — a samo nadanie dzialo sie
-- pozniej, w tle, bez jego udzialu. Roznica jest taka sama jak miedzy
-- „zapraszam cie do domu" a „dam ci klucze".
--
-- ROZWIAZANIE
--
-- Czlonkostwo powstaje zawsze jako `member`, w obu kierunkach. Awans na
-- Admina jest osobnym, jawnym ruchem Foundera albo Admina — jednym
-- klikanieciem w menu przy czlonku, juz po dolaczeniu.
--
-- `proposed_role` zostaje w tabeli: nadal niesie informacje, jaka role team
-- PLANUJE dac. Przestaje tylko nadawac ja sam z siebie.
--
-- Idempotentna. Odpalac po 016.

create or replace function public.respond_join_request(
  p_request_id uuid,
  p_action     text
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  req public.startup_join_requests;
  uid uuid := auth.uid();
  is_manager boolean;
  is_target  boolean;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_action not in ('accept', 'decline', 'withdraw') then
    raise exception 'invalid_action';
  end if;

  select * into req
  from public.startup_join_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  if req.status <> 'pending' then
    raise exception 'request_not_pending'
      using hint = 'Ta prosba zostala juz rozpatrzona.';
  end if;

  is_manager := public.can_edit_startup(req.startup_id);
  is_target  := (req.direction = 'application' and is_manager)
             or (req.direction = 'invite' and req.profile_id = uid);

  -- Wycofac moze tylko ten, kto prosbe wyslal.
  if p_action = 'withdraw' then
    if req.created_by <> uid then
      raise exception 'not_allowed';
    end if;
    update public.startup_join_requests
    set status = 'withdrawn', responded_at = now(), responded_by = uid
    where id = req.id;
    return 'withdrawn';
  end if;

  -- Zaakceptowac lub odrzucic moze wylacznie druga strona rozmowy.
  if not is_target then
    raise exception 'not_allowed';
  end if;

  if p_action = 'decline' then
    update public.startup_join_requests
    set status = 'declined', responded_at = now(), responded_by = uid
    where id = req.id;
    return 'declined';
  end if;

  -- accept: wpis do zespolu robi ta funkcja, zeby limit 3 teamow i ochrona
  -- ostatniego Foundera zadzialaly w tej samej transakcji co zmiana statusu.
  --
  -- ROLA JEST ZAWSZE `member`, niezaleznie od kierunku i od `proposed_role`.
  -- Uprawnienia administracyjne nadaje Founder albo Admin osobnym ruchem,
  -- juz po dolaczeniu (guidelines, sekcja 4).
  -- `job_title` zostaje bez zmian: to wizytowka w skladzie, nie uprawnienie.
  -- Gdy zaproszenie dotyczylo konkretnej otwartej roli, bierzemy jej nazwe.
  insert into public.startup_members (startup_id, profile_id, role, job_title)
  values (
    req.startup_id,
    req.profile_id,
    'member',
    coalesce(
      req.job_title,
      (select r.title from public.startup_open_roles r where r.id = req.open_role_id)
    )
  )
  on conflict (startup_id, profile_id) do nothing;

  update public.startup_join_requests
  set status = 'accepted', responded_at = now(), responded_by = uid
  where id = req.id;

  return 'accepted';
end;
$$;

comment on function public.respond_join_request(uuid, text) is
  'Odpowiedz na prosbe o dolaczenie. Przyjecie tworzy czlonkostwo ZAWSZE jako member — uprawnienia nadaje Founder/Admin osobno (guidelines sekcja 4).';
