-- Slice 02 — Profiles + Social
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: profiles has public SELECT policy "Profiles are viewable by everyone".

-- follows: follower_id, followee_id, created_at
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

-- profile_views: viewer_id (nullable), profile_id, created_at
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS (per slice: public read profiles; writes limited to owners + authenticated for follows/views)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- follows: public read (discovery); authenticated insert/delete own only
DROP POLICY IF EXISTS follows_select ON follows;
CREATE POLICY follows_select ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS follows_insert ON follows;
CREATE POLICY follows_insert ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS follows_delete ON follows;
CREATE POLICY follows_delete ON follows FOR DELETE USING (auth.uid() = follower_id);

-- profile_views: authenticated insert only; enforce viewer_id = auth.uid() to prevent spoofing
DROP POLICY IF EXISTS profile_views_insert ON profile_views;
CREATE POLICY profile_views_insert ON profile_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND viewer_id = auth.uid());
DROP POLICY IF EXISTS profile_views_select ON profile_views;
CREATE POLICY profile_views_select ON profile_views FOR SELECT USING (true);
