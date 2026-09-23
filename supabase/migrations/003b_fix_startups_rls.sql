-- ============================================================================
-- 003b · Poprawka RLS: „new row violates row-level security policy for startups"
-- ----------------------------------------------------------------------------
-- PROBLEM
--   Zakładanie startupu kończyło się błędem RLS. Powód: `.insert().select()`
--   w kodzie tłumaczy się na `INSERT ... RETURNING`, a Postgres sprawdza przy
--   RETURNING nie tylko WITH CHECK polityki INSERT, ale też USING polityki
--   SELECT — wiersz musi być widoczny dla autora.
--
--   Polityka SELECT wymagała członkostwa w startupie:
--       using (public.is_startup_member(id))
--
--   Członkostwo zakłada trigger `on_startup_created`, który jest AFTER INSERT
--   i odpala się dopiero na końcu instrukcji. W momencie RETURNING wiersza
--   w `startup_members` jeszcze nie ma → autor nie widzi własnego startupu
--   → błąd.
--
-- ROZWIĄZANIE
--   Autor zawsze widzi swój startup, niezależnie od członkostwa. To poprawne
--   także merytorycznie: `created_by` nie znika przy opuszczeniu teamu, a sam
--   warunek nie rozszerza dostępu nikomu innemu.
--
-- Odpal PO 003 (albo po całym komplecie — kolejność nie ma znaczenia).
-- Idempotentne.
-- ============================================================================

drop policy if exists "startups_select_member" on public.startups;
create policy "startups_select_member"
  on public.startups for select to authenticated
  using (
    created_by = auth.uid()
    or public.is_startup_member(id)
  );

-- To samo dotyczy członkostw: `handle_new_startup` wstawia wiersz foundera
-- z poziomu triggera, ale gdy kod czyta go zaraz po utworzeniu, musi go widzieć.
drop policy if exists "startup_members_select" on public.startup_members;
create policy "startup_members_select"
  on public.startup_members for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_startup_member(startup_id)
    or exists (
      select 1 from public.startups s
      where s.id = startup_members.startup_id and s.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Weryfikacja: obie polityki powinny zawierać `auth.uid()` w klauzuli USING
-- ---------------------------------------------------------------------------

select
  tablename,
  policyname,
  cmd,
  qual as using_expr
from pg_policies
where schemaname = 'public'
  and tablename in ('startups', 'startup_members')
  and cmd = 'SELECT'
order by tablename;
