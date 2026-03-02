# Slice 08 — Admin + Moderation
Status: TODO

## Goal
Admin capabilities:
- Manage challenges
- Feature content
- Moderate reported content
- Manual verification badges (optional)

## User-visible behavior
- Basic admin-only screens or admin actions exist
- Reported content can be reviewed and actioned
- Featured items appear in explore

## Screens / routes
- `/admin` (guarded)
- `/admin/challenges`
- `/admin/reports`
- `/admin/feature`
- `/admin/verification` (optional)

## Data / backend (recommended)
Tables:
- `reports`:
  - `id`, `reporter_id`, `content_type`, `content_id`, `reason`, `created_at`, `status`
- Featured:
  - `featured_items` or flags on `profiles`/`videos`
Verification:
  - `profiles.verified` boolean + `verified_at`

RLS:
- admin role required for writes

## Acceptance checks
Manual:
- Report a video/profile and see it appear for admin
- Feature a video/player and see it in explore
Agent verify:
- `/verify`

## Out of scope
- Complex moderation workflows (Phase 2)
