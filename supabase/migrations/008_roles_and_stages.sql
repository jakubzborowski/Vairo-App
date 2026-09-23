-- ============================================================================
-- 008 · Role, uprawnienia i rejestr pięciu etapów
-- ----------------------------------------------------------------------------
-- 1. Egzekwowanie ról po stronie bazy: Member czyta workspace, ale nie edytuje
--    treści etapów. Widoczność przycisku nie jest zabezpieczeniem — liczy się
--    polityka RLS, bo tylko ona działa niezależnie od tego, co wyśle klient.
--
-- 2. Rejestr wszystkich pięciu etapów programu:
--    Ambition → Idea → Preparation → Execution → MVP
--    Trzy ostatnie wjeżdżają jako szkielet (bez treści), żeby pasek etapów
--    na dashboardzie i bramki dostępu opierały się na danych, a nie na
--    liście zaszytej w kodzie.
--
-- Odpal PO 007. Idempotentne.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: czy user może edytować zawartość workspace'u
-- ---------------------------------------------------------------------------
-- Jedno miejsce, do którego odwołują się wszystkie polityki zapisu. Zmiana
-- reguły w przyszłości to zmiana jednej funkcji, a nie dziesięciu polityk.

create or replace function public.can_edit_startup(p_startup_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.startup_members
    where startup_id = p_startup_id
      and profile_id = auth.uid()
      and role in ('founder', 'admin')
  );
$$;

revoke all on function public.can_edit_startup(uuid) from public;
grant execute on function public.can_edit_startup(uuid) to authenticated;

-- Wariant dla tabel, które wiążą się ze startupem przez `startup_stages`.
create or replace function public.can_edit_stage(p_startup_stage_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.startup_stages ss
    join public.startup_members m on m.startup_id = ss.startup_id
    where ss.id = p_startup_stage_id
      and m.profile_id = auth.uid()
      and m.role in ('founder', 'admin')
  );
$$;

revoke all on function public.can_edit_stage(uuid) from public;
grant execute on function public.can_edit_stage(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Odpowiedzi w etapach: Member czyta, Founder i Admin edytują
-- ---------------------------------------------------------------------------
-- Rozbijamy dotychczasową politykę `for all` na osobne SELECT i zapis.
-- Bez tego zwykły członek zespołu mógłby nadpisać walidację pomysłu.

drop policy if exists "stage_answers_rw" on public.stage_answers;

drop policy if exists "stage_answers_select" on public.stage_answers;
create policy "stage_answers_select"
  on public.stage_answers for select to authenticated
  using (public.can_access_stage(startup_stage_id));

drop policy if exists "stage_answers_insert" on public.stage_answers;
create policy "stage_answers_insert"
  on public.stage_answers for insert to authenticated
  with check (public.can_edit_stage(startup_stage_id));

drop policy if exists "stage_answers_update" on public.stage_answers;
create policy "stage_answers_update"
  on public.stage_answers for update to authenticated
  using (public.can_edit_stage(startup_stage_id))
  with check (public.can_edit_stage(startup_stage_id));

drop policy if exists "stage_answers_delete" on public.stage_answers;
create policy "stage_answers_delete"
  on public.stage_answers for delete to authenticated
  using (public.can_edit_stage(startup_stage_id));

-- ---------------------------------------------------------------------------
-- 3. Domknięcie i ponowne otwarcie etapu — tylko Founder i Admin
-- ---------------------------------------------------------------------------

drop policy if exists "startup_stages_rw" on public.startup_stages;

drop policy if exists "startup_stages_select" on public.startup_stages;
create policy "startup_stages_select"
  on public.startup_stages for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_stages_insert" on public.startup_stages;
create policy "startup_stages_insert"
  on public.startup_stages for insert to authenticated
  with check (public.can_edit_startup(startup_id));

drop policy if exists "startup_stages_update" on public.startup_stages;
create policy "startup_stages_update"
  on public.startup_stages for update to authenticated
  using (public.can_edit_startup(startup_id))
  with check (public.can_edit_startup(startup_id));

-- ---------------------------------------------------------------------------
-- 4. Ustawienia startupu, kategorie i tagi — tylko Founder i Admin
-- ---------------------------------------------------------------------------
-- Zmiana kategorii przelicza zakres wymagań całego etapu, więc nie może
-- być w rękach zwykłego członka.

drop policy if exists "startup_categories_rw" on public.startup_categories;

drop policy if exists "startup_categories_select" on public.startup_categories;
create policy "startup_categories_select"
  on public.startup_categories for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_categories_write" on public.startup_categories;
create policy "startup_categories_write"
  on public.startup_categories for all to authenticated
  using (public.can_edit_startup(startup_id))
  with check (public.can_edit_startup(startup_id));

drop policy if exists "startup_tags_rw" on public.startup_tags;

drop policy if exists "startup_tags_select" on public.startup_tags;
create policy "startup_tags_select"
  on public.startup_tags for select to authenticated
  using (public.is_startup_member(startup_id));

drop policy if exists "startup_tags_write" on public.startup_tags;
create policy "startup_tags_write"
  on public.startup_tags for all to authenticated
  using (public.can_edit_startup(startup_id))
  with check (public.can_edit_startup(startup_id));

-- Postęp podpunktów zapisuje trigger; user go nie edytuje ręcznie.
drop policy if exists "stage_progress_write" on public.stage_subpoint_progress;
create policy "stage_progress_write"
  on public.stage_subpoint_progress for all to authenticated
  using (public.can_edit_stage(startup_stage_id))
  with check (public.can_edit_stage(startup_stage_id));

-- Pliki dowodowe: czyta cały zespół, wgrywa i kasuje tylko Founder/Admin.
drop policy if exists "stage_files_write" on storage.objects;
create policy "stage_files_write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stage-files'
    and public.can_edit_stage(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "stage_files_delete" on storage.objects;
create policy "stage_files_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stage-files'
    and public.can_edit_stage(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 5. Rejestr pięciu etapów programu
-- ---------------------------------------------------------------------------
-- Ambition i Idea mają treść (migracje 006 i 007). Pozostałe trzy wjeżdżają
-- jako szkielet: `published_at = null` znaczy „struktura jest, treści jeszcze
-- nie ma". Dzięki temu pasek etapów i bramki czytają dane, a nie listę w kodzie.

insert into public.stage_templates (key, version, title, subtitle, intro, position, finish_label, published_at)
values
  ('preparation', 1, 'Preparation',
   'Przygotuj się do budowy',
   'Zbierasz zasoby, ludzi i plan potrzebny do zbudowania pierwszej wersji. Domknięcie tego etapu odblokowuje tracker celów i zadań.',
   3, 'Zaczynam budowę', null),
  ('execution', 1, 'Execution',
   'Zbuduj pierwszą wersję',
   'Prowadzisz budowę: przypisujesz pracę, ustalasz terminy, zapisujesz przeszkody i dodajesz wyniki. Milestones wskazują wymagane rezultaty.',
   4, 'Przechodzę do MVP', null),
  ('mvp', 1, 'MVP Stage',
   'Wypuść i sprawdź',
   'Udostępniasz produkt odbiorcom, sprawdzasz wyniki i pracujesz nad poprawkami. Wszystkie narzędzia odblokowane wcześniej zostają dostępne.',
   5, 'Kończę program', null)
on conflict (key, version) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    intro = excluded.intro,
    position = excluded.position,
    finish_label = excluded.finish_label;
    -- published_at celowo NIE jest nadpisywane: gdy treść wjedzie migracją
    -- z `content:build`, ten skrypt nie może jej cofnąć do stanu „brak treści".

-- Ambition i Idea mogły powstać przed wprowadzeniem stałej kolejności.
update public.stage_templates set position = 1 where key = 'ambition';
update public.stage_templates set position = 2 where key = 'idea';

-- ---------------------------------------------------------------------------
-- 6. Weryfikacja
-- ---------------------------------------------------------------------------

select
  t.key,
  t.position,
  t.title,
  (t.published_at is not null) as ma_tresc,
  (select count(*) from public.stage_categories c where c.template_id = t.id) as kategorii
from public.stage_templates t
order by t.position;
