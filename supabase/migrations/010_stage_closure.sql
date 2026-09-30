-- ============================================================================
-- 010 · Zamknięcie etapu: snapshot + decyzja
-- ----------------------------------------------------------------------------
-- Guidelines, sekcja 10.5: zamknięcie etapu zapisuje snapshot podsumowania,
-- użytych dowodów i decyzji — i dopiero potem odblokowuje kolejny etap.
--
-- Decyzja kończąca Idea Stage ma cztery warianty:
--   • continue — wymagania spełnione, odblokowuje Preparation,
--   • pivot    — zmiana kierunku: etap zostaje otwarty, Founder wskazuje
--                podpunkty do ponownego wypełnienia, dotychczasowe odpowiedzi
--                zostają w snapshocie (nie znikają z historii),
--   • pause    — startup dostaje status Paused, kolejny etap się nie otwiera,
--   • archive  — startup dostaje status Archived.
--
-- System NIE ocenia pomysłu. Zapisuje to, co zdecydował człowiek.
--
-- Odpal PO 009. Idempotentne.
-- ============================================================================

create table if not exists public.stage_closures (
  id uuid primary key default gen_random_uuid(),
  startup_stage_id uuid not null
    references public.startup_stages (id) on delete cascade,
  decision   text not null,
  note       text,
  -- Pełny stan etapu w chwili zamknięcia: odpowiedzi + postęp podpunktów.
  -- Dzięki temu „zmiana kierunku" może wyczyścić pola do ponownego
  -- wypełnienia, a poprzednia wersja nadal istnieje.
  snapshot   jsonb not null default '{}'::jsonb,
  closed_by  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stage_closure_decision_valid check (
    decision in ('continue', 'pivot', 'pause', 'archive')),
  constraint stage_closure_note_len check (
    note is null or char_length(trim(note)) between 1 and 2000)
);

create index if not exists stage_closures_stage_idx
  on public.stage_closures (startup_stage_id, created_at desc);

alter table public.stage_closures enable row level security;

-- Historia jest do czytania dla całego zespołu i do pisania dla Foundera
-- i Admina. Świadomie brak UPDATE i DELETE — snapshot ma być niezmienny.
drop policy if exists "stage_closures_select" on public.stage_closures;
create policy "stage_closures_select"
  on public.stage_closures for select to authenticated
  using (public.can_access_stage(startup_stage_id));

drop policy if exists "stage_closures_insert" on public.stage_closures;
create policy "stage_closures_insert"
  on public.stage_closures for insert to authenticated
  with check (public.can_edit_stage(startup_stage_id));

-- ---------------------------------------------------------------------------
-- Zamknięcie etapu jako jedna transakcja
-- ---------------------------------------------------------------------------
-- Snapshot, decyzja, status etapu i status startupu muszą zmienić się razem
-- albo w ogóle. Stąd funkcja, a nie cztery zapytania z aplikacji.

create or replace function public.close_stage(
  p_startup_stage_id uuid,
  p_decision         text,
  p_note             text default null,
  p_reopen_subpoints uuid[] default null
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_startup_id uuid;
  v_snapshot jsonb;
  v_reopened integer := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_decision not in ('continue', 'pivot', 'pause', 'archive') then
    raise exception 'invalid_decision';
  end if;

  if not public.can_edit_stage(p_startup_stage_id) then
    raise exception 'not_allowed'
      using hint = 'Tylko Founder i Admin moga zamknac etap.';
  end if;

  select startup_id into v_startup_id
  from public.startup_stages
  where id = p_startup_stage_id;

  if v_startup_id is null then
    raise exception 'stage_not_found';
  end if;

  -- Snapshot: wszystko, co da się odtworzyć bez katalogu treści.
  select jsonb_build_object(
    'captured_at', now(),
    'answers', coalesce((
      select jsonb_object_agg(a.answer_key, a.value)
      from public.stage_answers a
      where a.startup_stage_id = p_startup_stage_id
    ), '{}'::jsonb),
    'completed_subpoints', coalesce((
      select jsonb_agg(pr.subpoint_id)
      from public.stage_subpoint_progress pr
      where pr.startup_stage_id = p_startup_stage_id and pr.is_complete
    ), '[]'::jsonb)
  ) into v_snapshot;

  insert into public.stage_closures
    (startup_stage_id, decision, note, snapshot, closed_by)
  values
    (p_startup_stage_id, p_decision, nullif(trim(coalesce(p_note, '')), ''),
     v_snapshot, uid);

  if p_decision = 'continue' then
    update public.startup_stages
    set status = 'completed', completed_at = now()
    where id = p_startup_stage_id;

  elsif p_decision = 'pivot' then
    -- Etap zostaje otwarty. Czyścimy tylko wskazane podpunkty; snapshot
    -- powyżej trzyma poprzednie odpowiedzi, więc nic nie ginie bezpowrotnie.
    if p_reopen_subpoints is not null and array_length(p_reopen_subpoints, 1) > 0 then
      delete from public.stage_answers a
      where a.startup_stage_id = p_startup_stage_id
        and a.answer_key in (
          select f.answer_key
          from public.stage_fields f
          where f.subpoint_id = any (p_reopen_subpoints)
        );
      v_reopened := array_length(p_reopen_subpoints, 1);
    end if;

    update public.startup_stages
    set status = 'in_progress', completed_at = null
    where id = p_startup_stage_id;

  elsif p_decision = 'pause' then
    update public.startups set status = 'paused' where id = v_startup_id;

  elsif p_decision = 'archive' then
    update public.startups set status = 'archived' where id = v_startup_id;
  end if;

  return jsonb_build_object(
    'decision', p_decision,
    'reopened_subpoints', v_reopened
  );
end;
$$;

revoke all on function public.close_stage(uuid, text, text, uuid[]) from public;
grant execute on function public.close_stage(uuid, text, text, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'stage_closures') as ma_tabele,
  (select count(*) from information_schema.routines
    where routine_schema = 'public' and routine_name = 'close_stage') as ma_funkcje;
