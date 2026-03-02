# Slice 00 — Foundation
Status: DONE

## Goal
Create a stable base that makes all other slices predictable:
- Clean routing skeleton, auth gate points, and role route groups
- Supabase client wiring and env conventions
- Shared UI primitives (minimal, not a design system)

## User-visible behavior
- App boots to `welcome`
- Auth routes exist and are reachable
- After login, user is routed to role onboarding or role home

## Screens / routes
- `/welcome`
- `/auth/login`
- `/auth/signup`
- `/onboarding/role`
- `/(player)/home`
- `/(scout)/home`
- `/(club)/home`
- `/(org)/home`

## Data / backend
- Supabase project connection works (client + env keys)
- No schema required yet (but placeholders allowed)

## Acceptance checks
Manual:
- App boots with no crash
- Navigate welcome → login/signup
- After login, you can reach onboarding role screen
Agent verify:
- `/verify` passes or reports what is missing

## Out of scope
- Full UI polish
- Real feeds/profiles
