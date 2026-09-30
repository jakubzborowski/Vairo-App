-- ============================================================================
-- Backup danych bez pg_dump i bez hasła do bazy
-- ----------------------------------------------------------------------------
-- Supabase → SQL Editor → wklej → Run → przycisk „Download CSV" nad wynikiem.
--
-- Zwraca jeden wiersz z całą zawartością w JSON-ie. Przy kilku testowych
-- kontach to w zupełności wystarczy — pełny pg_dump ma sens dopiero przy
-- realnych danych produkcyjnych.
--
-- Wersja PRZED migracjami 002–007 (istnieją tylko profiles, tags, profile_tags).
-- Po migracjach odkomentuj dolną sekcję.
-- ============================================================================

select json_build_object(
  'exported_at', now(),

  -- Konta. Bez haseł i tokenów — te i tak są zahaszowane i nieprzenośne.
  'auth_users', (
    select coalesce(json_agg(json_build_object(
      'id', u.id,
      'email', u.email,
      'created_at', u.created_at,
      'raw_user_meta_data', u.raw_user_meta_data
    ) order by u.created_at), '[]'::json)
    from auth.users u
  ),

  'profiles', (
    select coalesce(json_agg(to_jsonb(p) order by p.created_at), '[]'::json)
    from public.profiles p
  ),

  'tags', (
    select coalesce(json_agg(to_jsonb(t) order by t.created_at), '[]'::json)
    from public.tags t
  ),

  'profile_tags', (
    select coalesce(json_agg(to_jsonb(pt)), '[]'::json)
    from public.profile_tags pt
  )

  -- ── PO MIGRACJACH 002–007 dopisz przecinek wyżej i odkomentuj: ──────────
  -- ,'skills', (select coalesce(json_agg(to_jsonb(s)), '[]'::json)
  --             from public.skills s)
  -- ,'profile_skills', (select coalesce(json_agg(to_jsonb(ps)), '[]'::json)
  --                     from public.profile_skills ps)
  -- ,'startups', (select coalesce(json_agg(to_jsonb(st)), '[]'::json)
  --               from public.startups st)
  -- ,'startup_members', (select coalesce(json_agg(to_jsonb(sm)), '[]'::json)
  --                      from public.startup_members sm)
  -- ,'startup_categories', (select coalesce(json_agg(to_jsonb(sc)), '[]'::json)
  --                         from public.startup_categories sc)
  -- ,'startup_tags', (select coalesce(json_agg(to_jsonb(stg)), '[]'::json)
  --                   from public.startup_tags stg)
  -- ,'startup_stages', (select coalesce(json_agg(to_jsonb(ss)), '[]'::json)
  --                     from public.startup_stages ss)
  -- ,'stage_answers', (select coalesce(json_agg(to_jsonb(sa)), '[]'::json)
  --                    from public.stage_answers sa)
  -- ─────────────────────────────────────────────────────────────────────────

)::text as backup;
