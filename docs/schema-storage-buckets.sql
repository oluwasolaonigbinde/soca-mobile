-- SOCA Storage bucket configuration
--
-- Run this in the Supabase SQL Editor against the project's database. It is
-- safe to re-run; updates use ON CONFLICT and DROP POLICY IF EXISTS.
--
-- Reason: the live `videos` bucket was provisioned without size or MIME limits,
-- so any authenticated user could upload arbitrary file types up to whatever
-- the plan allows. The `avatars` and `post-images` buckets already have correct
-- limits configured live; this script makes the limits reproducible from repo
-- and locks the `videos` bucket to mp4/quicktime/webm at <= 100 MB.
--
-- Per-object write/update/delete RLS lives alongside the rest of the storage
-- policies in the live project (own-folder prefix on `auth.uid()`). This
-- script does NOT alter those policies; it only constrains what bytes the
-- bucket will accept in the first place.

-- 1) avatars: 2 MB cap, image-only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) post-images: 5 MB cap, image-only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5 * 1024 * 1024,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) videos: 100 MB cap, video-only
--    Note: the app implementation depends on `public = true` because playback
--    uses getPublicUrl(). Do not flip this to false without changing the app.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  100 * 1024 * 1024,
  ARRAY['video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
