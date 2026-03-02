-- Add profile fields for Slice 01 (Auth + Onboarding)
-- Run manually in Supabase SQL Editor. Client-side upsert is mandatory; do not rely on triggers.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
