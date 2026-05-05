-- Slice 08 - Admin + Moderation
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: profiles, challenges, challenge_submissions, events, featured_items, and videos exist.
-- Admin access in the app uses auth.users app_metadata.is_admin = true.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_content_type_check CHECK (content_type IN ('profile', 'video')),
  CONSTRAINT reports_status_check CHECK (
    status IN ('open', 'reviewing', 'resolved', 'dismissed')
  )
);

CREATE INDEX IF NOT EXISTS reports_status_created_at_idx
  ON reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_reporter_id_idx
  ON reports (reporter_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = reporter_id
  );

DROP POLICY IF EXISTS reports_select_self ON reports;
CREATE POLICY reports_select_self ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS reports_admin_select ON reports;
CREATE POLICY reports_admin_select ON reports
  FOR SELECT
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS reports_admin_update ON reports;
CREATE POLICY reports_admin_update ON reports
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS profiles_admin_update ON profiles;
CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS featured_items_admin_select ON featured_items;
CREATE POLICY featured_items_admin_select ON featured_items
  FOR SELECT
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS featured_items_insert ON featured_items;
CREATE POLICY featured_items_insert ON featured_items
  FOR INSERT
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS featured_items_update ON featured_items;
CREATE POLICY featured_items_update ON featured_items
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS featured_items_delete ON featured_items;
CREATE POLICY featured_items_delete ON featured_items
  FOR DELETE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS challenges_insert ON challenges;
CREATE POLICY challenges_insert ON challenges
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by_admin = auth.uid()
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

DROP POLICY IF EXISTS challenges_update ON challenges;
CREATE POLICY challenges_update ON challenges
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (
    created_by_admin = auth.uid()
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

DROP POLICY IF EXISTS challenges_delete ON challenges;
CREATE POLICY challenges_delete ON challenges
  FOR DELETE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS challenge_submissions_admin_update ON challenge_submissions;
CREATE POLICY challenge_submissions_admin_update ON challenge_submissions
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

CREATE TABLE IF NOT EXISTS profile_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_achievements_source_check CHECK (
    challenge_id IS NOT NULL OR event_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS profile_achievements_challenge_profile_key
  ON profile_achievements (challenge_id, profile_id)
  WHERE challenge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS profile_achievements_profile_awarded_idx
  ON profile_achievements (profile_id, awarded_at DESC);

ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_achievements_select ON profile_achievements;
CREATE POLICY profile_achievements_select ON profile_achievements
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS profile_achievements_admin_insert ON profile_achievements;
CREATE POLICY profile_achievements_admin_insert ON profile_achievements
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by_admin = auth.uid()
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

DROP POLICY IF EXISTS profile_achievements_admin_update ON profile_achievements;
CREATE POLICY profile_achievements_admin_update ON profile_achievements
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS profile_achievements_admin_delete ON profile_achievements;
CREATE POLICY profile_achievements_admin_delete ON profile_achievements
  FOR DELETE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS events_admin_insert ON events;
CREATE POLICY events_admin_insert ON events
  FOR INSERT
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS events_admin_update ON events;
CREATE POLICY events_admin_update ON events
  FOR UPDATE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS events_admin_delete ON events;
CREATE POLICY events_admin_delete ON events
  FOR DELETE
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

COMMENT ON TABLE reports IS 'User-submitted moderation reports for profile and video content.';
COMMENT ON TABLE profile_achievements IS 'Admin-awarded profile achievements/results, currently used for challenge winners.';
COMMENT ON COLUMN profiles.verified IS 'Manual verification badge controlled by admins.';
COMMENT ON COLUMN profiles.verified_at IS 'Timestamp when the verification badge was last granted.';
