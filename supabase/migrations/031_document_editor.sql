-- =============================================================================
-- 031 — Dokumenty: kto zmieniał ostatnio
--
-- Odpal PO 030. Idempotentna.
--
-- Kartka dokumentu (Claude Design, 17b) mówi „kto pisze" — czyli kto zmieniał
-- dokument ostatnio, nie kto go założył. 026 zna tylko `created_by`.
-- Ustawia to baza (trigger), żeby nikt nie mógł podpisać zmiany cudzym
-- imieniem. Bez tej migracji aplikacja pokazuje autora.
-- =============================================================================

alter table public.startup_documents
  add column if not exists updated_by uuid references public.profiles (id) on delete set null;

create or replace function public.startup_documents_track_editor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists startup_documents_track_editor on public.startup_documents;
create trigger startup_documents_track_editor
  before insert or update on public.startup_documents
  for each row execute function public.startup_documents_track_editor();

update public.startup_documents
set updated_by = created_by
where updated_by is null;
