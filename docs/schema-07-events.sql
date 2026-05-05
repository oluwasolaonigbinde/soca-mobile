-- Slice 07 - Events
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: auth and profiles tables exist.

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz,
  location text,
  description text,
  organizer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_interest (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clean up any duplicate interest rows before enforcing uniqueness.
DELETE FROM event_interest duplicate_row
USING event_interest kept_row
WHERE duplicate_row.ctid < kept_row.ctid
  AND duplicate_row.event_id = kept_row.event_id
  AND duplicate_row.user_id = kept_row.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS event_interest_event_user_key
  ON event_interest (event_id, user_id);

CREATE INDEX IF NOT EXISTS events_date_idx
  ON events (date ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS event_interest_user_id_idx
  ON event_interest (user_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS event_interest_select ON event_interest;
CREATE POLICY event_interest_select ON event_interest FOR SELECT USING (true);

DROP POLICY IF EXISTS event_interest_insert ON event_interest;
CREATE POLICY event_interest_insert ON event_interest FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS event_interest_delete ON event_interest;
CREATE POLICY event_interest_delete ON event_interest FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE events IS 'Public event listings for trials, showcases, and scouting activity.';
COMMENT ON TABLE event_interest IS 'Basic Interested interaction for event listings. One row per user per event.';
