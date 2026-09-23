-- ============================================================================
-- 011 · Pominięci w Odkrywaj
-- ----------------------------------------------------------------------------
-- Discover pokazuje jedną osobę (albo jeden team) na ekran. Jeśli nie pasuje,
-- user ją pomija — i wtedy nie chce jej zobaczyć po raz drugi przy następnym
-- wejściu. Ta tabela trzyma właśnie takie decyzje.
--
-- Pominięcie jest prywatne i odwracalne: nikt nie dowiaduje się, że został
-- pominięty (polityka RLS wpuszcza wyłącznie właściciela wiersza), a user może
-- cofnąć ostatnią decyzję albo wyczyścić całą listę.
--
-- Odpal PO 010. Idempotentne.
-- ============================================================================

create table if not exists public.discovery_passes (
  id uuid primary key default gen_random_uuid(),
  actor_id          uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete cascade,
  target_startup_id uuid references public.startups (id) on delete cascade,
  created_at        timestamptz not null default now(),
  -- Dokładnie jeden cel na wiersz. Jedna tabela zamiast dwóch, bo cała
  -- mechanika (pomiń, cofnij, wyczyść) jest identyczna dla osób i teamów.
  constraint discovery_pass_one_target check (
    (target_profile_id is not null)::int + (target_startup_id is not null)::int = 1
  ),
  constraint discovery_pass_not_self check (
    target_profile_id is null or target_profile_id <> actor_id
  )
);

create unique index if not exists discovery_passes_person_uniq
  on public.discovery_passes (actor_id, target_profile_id)
  where target_profile_id is not null;

create unique index if not exists discovery_passes_team_uniq
  on public.discovery_passes (actor_id, target_startup_id)
  where target_startup_id is not null;

create index if not exists discovery_passes_actor_idx
  on public.discovery_passes (actor_id, created_at desc);

alter table public.discovery_passes enable row level security;

-- Tylko własne decyzje. Nikt nie sprawdzi, kto go pominął.
drop policy if exists "discovery_passes_own" on public.discovery_passes;
create policy "discovery_passes_own"
  on public.discovery_passes for all to authenticated
  using (actor_id = auth.uid())
  with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Weryfikacja
-- ---------------------------------------------------------------------------

select count(*) as ma_tabele
from information_schema.tables
where table_schema = 'public' and table_name = 'discovery_passes';
