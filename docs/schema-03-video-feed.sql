-- Slice 03 - Video Upload + Feed
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: profiles table exists.
-- Note: the current app implementation uses getPublicUrl() and opens playback in the system browser,
-- so the `videos` storage bucket must be public for playback to work as implemented.

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  duration integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_likes (
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);

CREATE TABLE IF NOT EXISTS video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS videos_select ON videos;
CREATE POLICY videos_select ON videos FOR SELECT USING (true);
DROP POLICY IF EXISTS videos_insert ON videos;
CREATE POLICY videos_insert ON videos FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
  );
DROP POLICY IF EXISTS videos_update ON videos;
CREATE POLICY videos_update ON videos FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS videos_delete ON videos;
CREATE POLICY videos_delete ON videos FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS video_likes_select ON video_likes;
CREATE POLICY video_likes_select ON video_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS video_likes_insert ON video_likes;
CREATE POLICY video_likes_insert ON video_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
DROP POLICY IF EXISTS video_likes_delete ON video_likes;
CREATE POLICY video_likes_delete ON video_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS video_views_select ON video_views;
CREATE POLICY video_views_select ON video_views FOR SELECT USING (true);
DROP POLICY IF EXISTS video_views_insert ON video_views;
CREATE POLICY video_views_insert ON video_views FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND viewer_id IS NULL)
    OR (auth.uid() IS NOT NULL AND viewer_id = auth.uid())
  );
