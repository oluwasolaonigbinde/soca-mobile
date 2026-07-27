-- Discovery (profiles) + Featured items
-- Safe to run on fresh DB or after the previous discovery/featured migration.
-- Pre-requisite: profiles table exists with public SELECT policy.

-- 1. Discovery fields on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_year integer;

-- 2. Featured items table (create if not exists with correct definition)
CREATE TABLE IF NOT EXISTS featured_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  section text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_items_item_type_check CHECK (
    item_type IN ('profile', 'video', 'challenge', 'event')
  ),
  CONSTRAINT featured_items_time_window_check CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

COMMENT ON TABLE featured_items IS 'Admin-curated featured content. Writes via service role / SQL / future admin tooling; no RLS write for regular users.';

-- 3. Migrate existing table: if section was nullable, backfill and make NOT NULL
UPDATE featured_items SET section = '' WHERE section IS NULL;
ALTER TABLE featured_items ALTER COLUMN section SET DEFAULT '';
ALTER TABLE featured_items ALTER COLUMN section SET NOT NULL;
ALTER TABLE featured_items DROP CONSTRAINT IF EXISTS featured_items_time_window_check;
ALTER TABLE featured_items ADD CONSTRAINT featured_items_time_window_check
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at);

-- 4. Uniqueness: drop old expression-based index if present, then add raw-column unique index
DROP INDEX IF EXISTS featured_items_type_id_section_key;
CREATE UNIQUE INDEX IF NOT EXISTS featured_items_type_id_section_key
  ON featured_items (item_type, item_id, section);

CREATE INDEX IF NOT EXISTS featured_items_active_section_order
  ON featured_items (is_active, section, sort_order)
  WHERE is_active = true;

-- 5. RLS
ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS featured_items_select ON featured_items;
CREATE POLICY featured_items_select ON featured_items
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );
