# SOCA V1 (MVP) — Mobile App

SOCA V1 is a football-focused social platform enabling:
- Players to showcase talent (video highlights + profiles)
- Scouts and clubs to discover players (search/filter + ranked views)
- Platform interaction through follows, challenges, messaging, and events

## How this repo is organized
- `specs/` — product scope + non-negotiable decisions + acceptance criteria
- `slices/` — implementation increments (slice-by-slice plan)
- `.cursor/rules/` — persistent Cursor Agent rules (repo conventions)
- `.cursor/commands/` — reusable slash commands for audits/slices/verification

## The workflow
1. Run `/audit-soca` to map the current state to scope and choose the next slice.
2. Run `/slice-next` to implement exactly one slice.
3. Run `/verify` and review the report.
4. Do a quick manual check on device/emulator for the changed flow.

## Deliverables (per scope)
- Mobile source code in this repository
- A recorded walkthrough video demonstrating the core MVP functionality

See `specs/scope.md` for the full scope and exclusions.
