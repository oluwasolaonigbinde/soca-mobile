# Slice 08 — Admin + Moderation
Status: DONE

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
  - `featured_items` table (item_type: profile, video, challenge, event); writes via service role / SQL / future admin tooling
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

## Notes
- Added guarded `/admin`, `/admin/challenges`, `/admin/reports`, `/admin/feature`, and `/admin/verification` routes behind an admin gate.
- Added `/report/new` plus report CTAs on profile and video detail screens so users can submit moderation reports for those content types.
- Explore now renders a Featured Videos section backed by `featured_items`, and profile pages show a public verification badge when `profiles.verified = true`.
- Added `docs/schema-08-admin.sql` for admin claim-based RLS, reports, verification columns, and tighter challenge/featured-item write policies.
- Final admin handoff pass adds admin navigation, event creation, challenge submission review, internal admin scoring updates, and challenge winner achievements rendered on profiles.
- TODO: event winner assignment remains deferred until events have participation/submission rows beyond `event_interest`.
