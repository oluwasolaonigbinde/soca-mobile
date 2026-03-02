# Slice 02 — Profiles + Social
Status: DONE

## Goal
Deliver MVP profile features and follow system:
- Public profile pages
- Profile photo + bio + metadata
- Follower/following
- Basic engagement metrics (profile views)

## User-visible behavior
- View any user profile publicly
- Follow/unfollow users
- See follower/following counts
- Profile view count increments (basic)

## Screens / routes
- `/profile/[id]` (or equivalent)
- `/me/edit-profile`
- `/me/followers`
- `/me/following`

## Data / backend (recommended)
Tables:
- `profiles` (extend fields)
- `follows`:
  - `follower_id`, `followee_id`, `created_at`
- `profile_views`:
  - `viewer_id` (nullable), `profile_id`, `created_at`
Counters:
- either computed or stored aggregate columns on `profiles`

RLS:
- public can read profiles
- write limited to owners (profiles) and authenticated users (follows/views)

## Acceptance checks
Manual:
- Edit my profile (bio/location/metadata)
- Visit another profile and follow/unfollow
- Counts update
Agent verify:
- `/verify`

## Out of scope
- Video feed ranking logic beyond basic display
