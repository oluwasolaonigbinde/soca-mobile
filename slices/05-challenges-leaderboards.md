# Slice 05 — Challenges + Leaderboards
Status: DONE

## Goal
Implement monthly admin challenges, submissions, scoring, and leaderboard.

## User-visible behavior
- Users can view challenge list + details
- Player can submit a video to a challenge
- Leaderboard ranks submissions
- Scores reflect community engagement signals

## Screens / routes
- `/challenges`
- `/challenges/[id]`
- `/challenges/[id]/submit`
- `/challenges/[id]/leaderboard`

## Data / backend (recommended)
Tables:
- `challenges`:
  - `id`, `title`, `description`, `month`, `starts_at`, `ends_at`, `created_by_admin`
- `challenge_submissions`:
  - `id`, `challenge_id`, `user_id`, `video_id`, `admin_score`, `created_at`
Leaderboard:
- computed public score = `(likes * 3) + views`

## Acceptance checks
Manual:
- Create/view a challenge (admin path may be minimal)
- Submit a video and see it in leaderboard
Agent verify:
- `/verify`

## Out of scope
- Fully featured admin dashboard UX

## Notes
- Added routes for challenge list, detail, submission, and leaderboard.
- Player submissions reuse existing uploaded highlight videos instead of adding a second upload path here.
- Minimal admin creation remains SQL-first via `docs/schema-05-challenges.sql`; a dedicated admin UX is deferred to a later slice.
- Public leaderboard ranking now ignores `admin_score`; the column remains stored but does not affect player-facing ordering.
