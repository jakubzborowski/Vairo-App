-- =============================================================================
-- 048 — SCORE nie blokuje usuwania konta i nie ujawnia imienia z konta obcym
--
-- Odpal PO 047. Idempotentna.
--
-- SCORE powstał na gałęzi `codex/score-test` przed redesignem. Po scaleniu
-- (044–047) test na pełnym łańcuchu migracji wykazał dwie rzeczy:
--
-- 1. USUNIĘCIE KONTA PRZESTAWAŁO DZIAŁAĆ (`delete_own_account()`):
--    • osoba, która choć raz ruszyła cel albo zadanie — `score_freeze`
--      (BEFORE UPDATE na goals/tasks) odpalał się w kaskadzie
--      `owner_id → null` i zapisywał ocenę z `assessed_by` = usuwane konto;
--    • osoba, która recenzowała czyjś wynik — `score_reviews.reviewer_id`,
--      `score_program_claims.reviewer_id`, `score_reward_queue.confirmed_by`
--      i `score_assessments.assessed_by` wskazywały profil bez `on delete`.
--    To ta sama klasa błędu co 014/015/032 — CLAUDE.md, sekcja „Usuwanie”.
--
--    Naprawa: klucze → `on delete set null` (kolumny dopuszczają null),
--    a trigger zamrażający skalę nic nie zapisuje, gdy profil autora albo
--    startup już nie istnieje (czyli w trakcie kaskady usuwania).
--
--    Skutek dla punktów: oczekująca nagroda, której recenzent usunął konto,
--    nie zostanie wypłacona — `score_queue_valid()` wymaga `confirmed_by`.
--    To zamierzone: recenzent-widmo (konto założone tylko po to, żeby
--    zatwierdzić punkty, i usunięte) niczego nie zatwierdza. Punkty już
--    przyznane (`score_events`) zostają — tam `confirmed_by` było `set null`
--    od początku.
--
-- 2. LISTA „DOCEŃ WIADOMOŚĆ” POKAZYWAŁA IMIĘ I NAZWISKO Z KONTA nadawcy.
--    Wiadomości przychodzą od ludzi poznanych w Odkrywaj, a po 033 obcy
--    widzą się wyłącznie pod nazwą publiczną. Teraz ta sama reguła co
--    w `contact_profiles`: `coalesce(public_name, full_name)`.
--    Recenzje w zespole (`score_review_candidates`) zostają przy imieniu
--    z konta — zespół zna prawdziwe nazwiska (docs/social.md).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1a. Klucze do profili: set null zamiast blokady
-- ---------------------------------------------------------------------------

alter table public.score_assessments alter column assessed_by drop not null;
alter table public.score_assessments drop constraint if exists score_assessments_assessed_by_fkey;
alter table public.score_assessments
  add constraint score_assessments_assessed_by_fkey
  foreign key (assessed_by) references public.profiles(id) on delete set null;

alter table public.score_reviews alter column reviewer_id drop not null;
alter table public.score_reviews drop constraint if exists score_reviews_reviewer_id_fkey;
alter table public.score_reviews
  add constraint score_reviews_reviewer_id_fkey
  foreign key (reviewer_id) references public.profiles(id) on delete set null;

alter table public.score_program_claims drop constraint if exists score_program_claims_reviewer_id_fkey;
alter table public.score_program_claims
  add constraint score_program_claims_reviewer_id_fkey
  foreign key (reviewer_id) references public.profiles(id) on delete set null;

alter table public.score_reward_queue drop constraint if exists score_reward_queue_confirmed_by_fkey;
alter table public.score_reward_queue
  add constraint score_reward_queue_confirmed_by_fkey
  foreign key (confirmed_by) references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 1b. Zamrożenie skali — nic nie zapisuje w trakcie kaskady usuwania
-- ---------------------------------------------------------------------------
-- Treść jak w 044; doszedł jeden warunek na wejściu.

create or replace function public.score_freeze_assessment()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_kind text := case when tg_table_name='tasks' then 'task' else 'goal' end;
begin
  -- Rodzic musi żyć (CLAUDE.md → „Usuwanie”): przy usuwaniu konta kaskada
  -- ustawia `owner_id = null` na celach i zadaniach — to UPDATE, który
  -- odpalał ten trigger z `auth.uid()` = usuwane konto. Wpis z autorem,
  -- którego już nie ma, zablokowałby całe usunięcie.
  if auth.uid() is null
     or not exists (select 1 from public.profiles where id = auth.uid())
     or not exists (select 1 from public.startups where id = new.startup_id) then
    return new;
  end if;
  if new.status<>'todo' then
    insert into public.score_assessments(kind,source_id,startup_id,weight,assessed_by,frozen)
    values(v_kind,new.id,new.startup_id,'standard',auth.uid(),true)
    on conflict(kind,source_id) do update set frozen=true;
  end if;
  return new;
end $$;
revoke all on function public.score_freeze_assessment() from public;

-- ---------------------------------------------------------------------------
-- 2. Nazwa nadawcy w „Doceń wiadomość” — publiczna, jak w rozmowach (033)
-- ---------------------------------------------------------------------------
-- Treść jak w 045; zmienia się tylko źródło nazwy.

create or replace function public.score_feedback_candidates()
returns table(id uuid,body text,sender_name text) language sql stable security definer set search_path=public as $$
  select m.id,m.body,coalesce(nullif(trim(p.public_name),''),p.full_name,'Użytkownik Vairo') from public.messages m join public.profiles p on p.id=m.sender_id
  where m.sender_id<>auth.uid() and public.score_text_quality(m.body,80,12)
    and exists(select 1 from public.conversation_participants cp where cp.conversation_id=m.conversation_id and cp.profile_id=auth.uid())
    and not exists(select 1 from public.score_reward_queue q where q.source_key=m.id::text and q.kind in ('help','feedback'))
  order by m.created_at desc,m.id desc limit 30;
$$;
revoke all on function public.score_feedback_candidates() from public;
grant execute on function public.score_feedback_candidates() to authenticated;

commit;
