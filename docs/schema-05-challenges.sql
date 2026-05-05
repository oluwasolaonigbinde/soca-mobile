-- Slice 05 - Challenges + Leaderboards
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: profiles and videos tables exist.

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  month text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenges_time_window_check CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  admin_score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_submissions_challenge_user_key
  ON challenge_submissions (challenge_id, user_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS challenges_select ON challenges;
CREATE POLICY challenges_select ON challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS challenges_insert ON challenges;
CREATE POLICY challenges_insert ON challenges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_admin = auth.uid());

DROP POLICY IF EXISTS challenges_update ON challenges;
CREATE POLICY challenges_update ON challenges FOR UPDATE
  USING (auth.uid() = created_by_admin)
  WITH CHECK (auth.uid() = created_by_admin);

DROP POLICY IF EXISTS challenge_submissions_select ON challenge_submissions;
CREATE POLICY challenge_submissions_select ON challenge_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS challenge_submissions_insert ON challenge_submissions;
CREATE POLICY challenge_submissions_insert ON challenge_submissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
  );

DROP POLICY IF EXISTS challenge_submissions_update ON challenge_submissions;
CREATE POLICY challenge_submissions_update ON challenge_submissions FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
  );

COMMENT ON TABLE challenges IS 'Admin-created monthly challenges surfaced on Explore and challenge routes.';
COMMENT ON TABLE challenge_submissions IS 'One submission per player per challenge; leaderboard score is derived in-app from admin_score plus engagement.';
