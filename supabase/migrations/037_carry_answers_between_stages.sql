-- =============================================================================
-- 037 — odpowiedzi idą za polem, gdy pole przechodzi do innego etapu
--
-- Odpal PO 036. Idempotentna.
--
-- Po uwagach do redesignu punkt „Porozmawiaj z osobami, którym chcesz pomóc”
-- przeszedł z Idei do Preparation (036). Pola zachowały klucze odpowiedzi
-- (`shared_key` = `idea.rozmowy.…`), ale odpowiedź w bazie należy do
-- KONKRETNEGO etapu startupu (`stage_answers.startup_stage_id`). Bez tej
-- migracji to, co ktoś już wpisał w Idei, zostałoby w Idei — niewidoczne.
--
-- Rozwiązanie ogólne, nie tylko dla rozmów: gdy startup ma odpowiedź pod
-- kluczem pola z innego swojego etapu, a w etapie docelowym jej brakuje —
-- kopiujemy ją. Działa:
--   • raz teraz (wyrównanie dla etapów, które już istnieją),
--   • i automatycznie przy każdym nowym etapie startupu (trigger) — startup,
--     który dopiero zamknie Ideę, dostanie rozmowy w Preparation od razu.
--
-- Nic nie nadpisuje: istniejąca odpowiedź w etapie docelowym wygrywa
-- (`on conflict do nothing`). Oryginał w starym etapie zostaje nietknięty.
-- Dziś żadne inne pole nie dzieli klucza między etapami, więc w praktyce
-- dotyczy to wyłącznie przeniesionych rozmów.
-- =============================================================================

create or replace function public.carry_answers_into_stage(p_startup_stage uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.stage_answers (startup_stage_id, answer_key, value, answered_by, updated_at)
  select distinct on (a.answer_key)
         dst.id, a.answer_key, a.value, a.answered_by, a.updated_at
    from public.startup_stages dst
    join public.startup_stages src
      on src.startup_id = dst.startup_id and src.id <> dst.id
    join public.stage_answers a
      on a.startup_stage_id = src.id
   where dst.id = p_startup_stage
     and a.value is not null
     and a.answer_key in (
       select f.shared_key
         from public.stage_fields f
         join public.stage_subpoints s  on s.id = f.subpoint_id
         join public.stage_points p     on p.id = s.point_id
         join public.stage_categories c on c.id = p.category_id
        where c.template_id = dst.template_id
     )
   order by a.answer_key, a.updated_at desc
  on conflict (startup_stage_id, answer_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.carry_answers_into_stage(uuid) from public, anon, authenticated;

create or replace function public.carry_answers_on_stage_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.carry_answers_into_stage(new.id);
  return new;
end;
$$;

drop trigger if exists startup_stages_carry_answers on public.startup_stages;
create trigger startup_stages_carry_answers
  after insert on public.startup_stages
  for each row execute function public.carry_answers_on_stage_insert();

-- Wyrównanie dla etapów, które już istnieją.
select public.carry_answers_into_stage(ss.id) from public.startup_stages ss;
