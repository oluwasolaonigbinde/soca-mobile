# Slice 01 — Auth + Onboarding
Status: DONE

## Goal
Implement authentication and role onboarding as defined in scope:
- Email/password sign-up
- Google sign-in
- Role selection
- Role-specific profile setup (minimum fields)

## User-visible behavior
- A user can create an account and sign in
- A user selects a role once during onboarding
- User completes a minimal profile and lands on role home

## Screens / routes
- `/auth/login`
- `/auth/signup`
- `/onboarding/role`
- `/onboarding/profile-setup` (or role-specific setup screens)
- `/(role)/home`

## Data / backend (recommended)
Tables:
- `profiles`:
  - `id` (uuid, = auth user id)
  - `role` (text)
  - `display_name`
  - `bio`
  - `location`
  - role fields (nullable): position, age, club_name, scout_org, etc.
RLS:
- user can update own profile
- public can read public profile fields

## Acceptance checks
Manual:
- Sign up via email/password
- Sign in via Google
- Role selection is saved
- Minimal profile is saved and persists after restart
Agent verify:
- `/verify` report includes typecheck passing

## Deviations / TODOs
- Google OAuth: App-side wiring complete; dashboard config (Supabase + Google Cloud Console) remains TODO. See `docs/GOOGLE_OAUTH_SETUP.md`. Mark as partial if untestable without dev build.

## Out of scope
- Full follower system
- Video uploads
