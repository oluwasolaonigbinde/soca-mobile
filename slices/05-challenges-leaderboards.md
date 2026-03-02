# Slice 05 — Challenges + Leaderboards
Status: TODO

## Goal
Implement monthly admin challenges, submissions, scoring, and leaderboard.

## User-visible behavior
- Users can view challenge list + details
- Player can submit a video to a challenge
- Leaderboard ranks submissions
- Scores reflect admin score + engagement signals

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
- computed score = `admin_score` + weight*(likes/views)

## Acceptance checks
Manual:
- Create/view a challenge (admin path may be minimal)
- Submit a video and see it in leaderboard
Agent verify:
- `/verify`

## Out of scope
- Fully featured admin dashboard UX
