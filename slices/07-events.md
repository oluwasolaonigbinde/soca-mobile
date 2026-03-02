# Slice 07 — Events
Status: TODO

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
