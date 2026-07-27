# Slice 07 — Events
Status: DONE

## Goal
Implement event listings + detail pages + Interested interaction.

## User-visible behavior
- Browse events list (also appears on explore/home cards)
- View event detail
- Mark Interested

## Screens / routes
- `/events`
- `/events/[id]`

## Data / backend (recommended)
Tables:
- `events`:
  - `id`, `title`, `date`, `location`, `description`, `organizer_id?`, `created_at`
- `event_interest`:
  - `event_id`, `user_id`, `created_at`

RLS:
- public read events
- authenticated write interest

## Acceptance checks
Manual:
- View events list + details
- Toggle Interested
Agent verify:
- `/verify`

## Out of scope
- Ticketing/RSVP monetization (Phase 2)

## Notes
- Implemented `/events` and `/events/[id]` with list, detail, and Interested toggle behavior.
- Explore event cards now link into event details, and each role home screen shows an upcoming-events preview card plus an Events shortcut.
- Added `docs/schema-07-events.sql` with the database-level dedupe fix for `event_interest (event_id, user_id)` plus the core events/event_interest schema and RLS policies.
