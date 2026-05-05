-- Client update - Posts as umbrella content
-- Run manually in Supabase SQL Editor.
-- Pre-requisites: profiles and videos tables exist.
-- This keeps the existing videos table intact and adds posts as a generic feed layer.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT posts_body_or_video_check CHECK (
    NULLIF(btrim(COALESCE(body, '')), '') IS NOT NULL
    OR video_id IS NOT NULL
    OR image_path IS NOT NULL
  )
);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_path text;

ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_body_or_video_check;

ALTER TABLE posts
  ADD CONSTRAINT posts_body_or_media_check CHECK (
    NULLIF(btrim(COALESCE(body, '')), '') IS NOT NULL
    OR video_id IS NOT NULL
    OR image_path IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_owner_id_created_at_idx ON posts (owner_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS posts_video_id_unique_idx
  ON posts (video_id)
  WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_image_path_idx
  ON posts (image_path)
  WHERE image_path IS NOT NULL;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_user_id_created_at_idx
  ON post_likes (user_id, created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_select ON posts;
CREATE POLICY posts_select ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS posts_insert ON posts;
CREATE POLICY posts_insert ON posts FOR INSERT
  WITH CHECK (
    (select auth.uid()) = owner_id
    AND (
      video_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM videos
        WHERE videos.id = video_id
          AND videos.owner_id = (select auth.uid())
      )
    )
    AND (
      image_path IS NULL
      OR image_path LIKE ((select auth.uid())::text || '/%')
    )
  );

DROP POLICY IF EXISTS posts_update ON posts;
CREATE POLICY posts_update ON posts FOR UPDATE
  USING ((select auth.uid()) = owner_id)
  WITH CHECK (
    (select auth.uid()) = owner_id
    AND (
      video_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM videos
        WHERE videos.id = video_id
          AND videos.owner_id = (select auth.uid())
      )
    )
    AND (
      image_path IS NULL
      OR image_path LIKE ((select auth.uid())::text || '/%')
    )
  );

DROP POLICY IF EXISTS posts_delete ON posts;
CREATE POLICY posts_delete ON posts FOR DELETE USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS post_likes_select ON post_likes;
CREATE POLICY post_likes_select ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS post_likes_insert ON post_likes;
CREATE POLICY post_likes_insert ON post_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS post_likes_delete ON post_likes;
CREATE POLICY post_likes_delete ON post_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Public buckets serve object URLs without broad SELECT policies; keep listing closed.
DROP POLICY IF EXISTS post_images_read_anon ON storage.objects;
DROP POLICY IF EXISTS post_images_read_authenticated ON storage.objects;

DROP POLICY IF EXISTS post_images_insert_own_path ON storage.objects;
CREATE POLICY post_images_insert_own_path ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND name LIKE ((select auth.uid())::text || '/%')
  );

DROP POLICY IF EXISTS post_images_update_own_path ON storage.objects;
CREATE POLICY post_images_update_own_path ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND name LIKE ((select auth.uid())::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND name LIKE ((select auth.uid())::text || '/%')
  );

DROP POLICY IF EXISTS post_images_delete_own_path ON storage.objects;
CREATE POLICY post_images_delete_own_path ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND name LIKE ((select auth.uid())::text || '/%')
  );

COMMENT ON TABLE posts IS 'Generic social posts. Text-only posts live here; video posts link to existing videos rows so highlight upload/playback remains unchanged.';
COMMENT ON COLUMN posts.body IS 'Text content or caption for the post. For video posts this may duplicate the videos.caption value for feed display.';
COMMENT ON COLUMN posts.video_id IS 'Optional attachment to an existing videos row. Existing videos without a post are rendered by the app as virtual video posts.';
COMMENT ON COLUMN posts.image_path IS 'Optional path in the public post-images bucket for photo posts.';
COMMENT ON TABLE post_likes IS 'Likes for non-video posts such as text and image/photo posts. Video posts continue to use video_likes.';

-- Backfill post wrappers for existing videos. Safe to re-run because of the unique partial index.
INSERT INTO posts (owner_id, body, video_id, created_at)
SELECT owner_id, caption, id, created_at
FROM videos
WHERE NOT EXISTS (
  SELECT 1
  FROM posts
  WHERE posts.video_id = videos.id
);

-- Optional demo text posts for projects that already have demo profiles.
-- The app also includes local demo-mode text posts, so these inserts are best-effort.
INSERT INTO posts (owner_id, body, created_at)
SELECT
  profiles.id,
  'Proud to share a new chapter: I have joined an academy showcase group and will be posting updates from the trial window.',
  now() - interval '2 hours'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1
  FROM posts
  WHERE posts.owner_id = profiles.id
    AND posts.body = 'Proud to share a new chapter: I have joined an academy showcase group and will be posting updates from the trial window.'
)
ORDER BY created_at
LIMIT 1;

INSERT INTO posts (owner_id, body, created_at)
SELECT
  profiles.id,
  'Matchday note: focused on sharper first touches, quicker scanning, and cleaner final-third decisions this week.',
  now() - interval '1 day'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1
  FROM posts
  WHERE posts.owner_id = profiles.id
    AND posts.body = 'Matchday note: focused on sharper first touches, quicker scanning, and cleaner final-third decisions this week.'
)
ORDER BY created_at DESC
LIMIT 1;
