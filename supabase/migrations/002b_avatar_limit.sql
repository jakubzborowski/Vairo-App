-- ============================================================================
-- 002b · Większy limit zdjęcia profilowego
-- ----------------------------------------------------------------------------
-- W warstwie Social profile przegląda się jeden po drugim, a zdjęcie decyduje
-- o tym, czy ktoś się w ogóle zatrzyma. 5 MB zmuszało do kompresowania fotki
-- z telefonu, zanim dało się ją wgrać.
--
-- Limit w bazie MUSI zgadzać się z tym w kodzie:
--   src/app/app/settings/profile/actions.ts → AVATAR_MAX_BYTES
--   src/components/app/profile-editor.tsx   → AVATAR_MAX_MB
--
-- Odpal PO 002. Idempotentne.
-- ============================================================================

update storage.buckets
set
  file_size_limit = 15728640,   -- 15 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

select
  id,
  file_size_limit / 1024 / 1024 as limit_mb,
  allowed_mime_types
from storage.buckets
where id = 'avatars';
