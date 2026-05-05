-- Add profile fields for Slice 01 (Auth + Onboarding)
-- Run manually in Supabase SQL Editor.
--
-- Note: profile rows are created automatically by the on_auth_user_created
-- trigger calling public.handle_new_user(). The client-side upsert in
-- src/store/auth.ts > fetchProfile() is a defensive fallback for legacy users
-- whose profile row never landed; it should not be removed.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
