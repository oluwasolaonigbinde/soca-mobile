# Slice 12 - Authenticated UX Refinement
Status: DONE

## Goal
Refine the authenticated SOCA shell and key player-facing screens so the app feels cleaner, more compact, more premium, and more consistent while preserving routes, product intent, and core behavior.

## Acceptance checks
Manual:
- Player home shows the highlight upload action as the first visible interaction.
- Profile uses compact inline stats and header-level actions, with no Follow action on self-profile.
- Explore shows lightweight discovery controls (`search`, `position`, `location`, sort) and thumbnail-led highlight cards.
- Challenges list is open-first and challenge detail presents a compact submission window + action layout.
- Highlight/video cards do not render as blank placeholders; they show real imagery when available or deterministic football-themed fallback thumbnails.

Agent verify:
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test`

## Out of scope
- Backend or schema changes
- Route or navigation changes
- New non-MVP features or unrelated module redesigns

## Completion notes
- Refined the shared shell and UI primitives with a more cohesive charcoal sports palette, tighter typography, smaller buttons/inputs, improved tabs, and a new `SOCA` wordmark using a football icon in the brand treatment.
- Added presentation helpers for abbreviated football position labels and deterministic highlight thumbnail fallback imagery without changing the backend data model.
- Reworked player home, profile, explore, challenges list, and challenge detail around smaller task-oriented UI, stronger thumbnails, lighter stats/actions, and clearer open challenge emphasis.
- Derived optional challenge submission counts from existing `challenge_submissions` rows when available and exposed them only as UI metadata.
- `/verify` passes: typecheck OK, lint OK, tests OK (7/7 suites, 17/17 tests).
- Interactive visual smoke testing still needs a local Expo run across mobile and desktop breakpoints; this environment can validate code/tests but not the final rendered UI.
