-- ============================================================================
-- ROLLBACK migracji 003–007
-- ----------------------------------------------------------------------------
-- Cofa wszystko, co dodały migracje 003, 004, 005, 006 i 007.
-- Baza wraca do stanu po 002 (czyli: profil + skille + avatary działają,
-- startupy i etapy znikają).
--
-- ⚠️ KASUJE DANE: startupy, członkostwa, wszystkie odpowiedzi w etapach.
--    Dane sprzed 003 (profile, skille, tagi) zostają nietknięte.
--
-- NIE cofa 002 — tamta migracja jest w pełni addytywna i nie ma powodu,
-- żeby ją usuwać.
--
-- Użycie: Supabase → SQL Editor → wklej całość → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Silnik etapów wraz z treścią (005, 006, 007)
-- ---------------------------------------------------------------------------
-- Kolejność wymuszona przez klucze obce: najpierw instancja, potem katalog.

drop table if exists public.stage_subpoint_progress cascade;
drop table if exists public.stage_answers          cascade;
drop table if exists public.startup_stages         cascade;

drop view  if exists public.stage_point_progress;

drop table if exists public.stage_fields     cascade;
drop table if exists public.stage_subpoints  cascade;
drop table if exists public.stage_points     cascade;
drop table if exists public.stage_categories cascade;
drop table if exists public.stage_templates  cascade;

drop function if exists public.recalc_subpoint_progress() cascade;
drop function if exists public.can_access_stage(uuid)     cascade;

-- Pliki dowodowe
drop policy if exists "stage_files_read"   on storage.objects;
drop policy if exists "stage_files_write"  on storage.objects;
drop policy if exists "stage_files_delete" on storage.objects;
delete from storage.objects where bucket_id = 'stage-files';
delete from storage.buckets where id = 'stage-files';

-- ---------------------------------------------------------------------------
-- 2. Startupy (003, 004)
-- ---------------------------------------------------------------------------
-- Triggery ochronne trzeba zdjąć pierwsze — inaczej „nie można usunąć
-- ostatniego Foundera" zablokuje kasowanie członkostw.

drop trigger if exists startup_members_protect_founder    on public.startup_members;
drop trigger if exists startup_members_limit              on public.startup_members;
drop trigger if exists startup_categories_protect_general on public.startup_categories;
drop trigger if exists on_startup_created                 on public.startups;

drop table if exists public.startup_tags       cascade;
drop table if exists public.startup_categories cascade;
drop table if exists public.startup_members    cascade;
drop table if exists public.startups           cascade;

drop function if exists public.handle_new_startup()         cascade;
drop function if exists public.protect_last_founder()       cascade;
drop function if exists public.enforce_startup_limit()      cascade;
drop function if exists public.protect_general_category()   cascade;
drop function if exists public.is_startup_member(uuid)      cascade;
drop function if exists public.startup_role(uuid)           cascade;

-- ---------------------------------------------------------------------------
-- 3. Tagi z powrotem pod starą nazwą
-- ---------------------------------------------------------------------------

drop view if exists public.tags;

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'industry_tags'
               and table_type = 'BASE TABLE')
  then
    alter table public.industry_tags rename to tags;
  end if;
end;
$$;

drop policy if exists "industry_tags_select_all" on public.tags;
drop policy if exists "industry_tags_insert_own" on public.tags;

drop policy if exists "tags_select_all" on public.tags;
create policy "tags_select_all"
  on public.tags for select to authenticated using (true);

drop policy if exists "tags_insert_own_custom" on public.tags;
create policy "tags_insert_own_custom"
  on public.tags for insert to authenticated
  with check (auth.uid() = created_by and is_suggested = false);

-- Kategorie walidacyjne wracają do katalogu tagów, jak było przed 003.
update public.tags set is_suggested = true
where slug in ('b2b', 'saas');

-- ---------------------------------------------------------------------------
-- 4. Reguły onboardingu jak przed 003
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_onboarding_path_valid;
alter table public.profiles drop column     if exists onboarding_path;

alter table public.profiles drop constraint if exists profiles_onboarding_step_valid;
alter table public.profiles
  add constraint profiles_onboarding_step_valid check (
    onboarding_step in ('name', 'idea', 'tags', 'done')
  );

alter table public.profiles drop constraint if exists profiles_completed_requires_fields;
alter table public.profiles
  add constraint profiles_completed_requires_fields check (
    onboarding_completed_at is null
    or (
      onboarding_step = 'done'
      and full_name is not null
      and char_length(trim(full_name)) >= 2
      and idea_description is not null
      and char_length(trim(idea_description)) >= 3
    )
  );

-- Przywrócenie wymogu ≥1 tagu przy domknięciu onboardingu
create or replace function public.enforce_onboarding_complete()
returns trigger
language plpgsql
as $$
declare
  tag_count integer;
begin
  if new.onboarding_completed_at is not null
     and (
       tg_op = 'INSERT'
       or old.onboarding_completed_at is distinct from new.onboarding_completed_at
       or old.onboarding_step is distinct from new.onboarding_step
     )
  then
    select count(*)::integer into tag_count
    from public.profile_tags
    where profile_id = new.id;

    if tag_count < 1 then
      raise exception 'onboarding_requires_at_least_one_tag'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- Konta założone po nowemu mogą mieć kroki, których stary constraint nie zna.
update public.profiles
set onboarding_step = case
  when onboarding_step in ('path', 'categories') then 'name'
  else onboarding_step
end
where onboarding_step in ('path', 'categories');

-- ---------------------------------------------------------------------------
-- 5. Weryfikacja
-- ---------------------------------------------------------------------------

select
  (select count(*) from information_schema.tables
   where table_schema = 'public'
     and table_name in ('startups','startup_members','stage_templates'))
     as powinno_byc_0,
  (select count(*) from information_schema.tables
   where table_schema = 'public' and table_name = 'tags')
     as tags_powinno_byc_1;
