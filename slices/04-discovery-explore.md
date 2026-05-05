# Slice 04 — Discovery + Explore
Status: DONE

## Goal
Implement player discovery + explore page:
- Search/filter by position, derived age, location, role
- Sorted views: latest, featured, popular
- Explore sections: featured players, trending videos, challenges, events

## User-visible behavior
- Scouts/clubs can search and filter players
- Explore shows curated sections (even if simple ranking)

## Screens / routes
- `/discover`
- `/explore`

## Data / backend (recommended)
Search:
- query `profiles` with filters (position, birth_year/age, location, role); age derived from `birth_year`
Featured:
- use `featured_items` table (profiles, videos, challenges, events); ordering via `sort_order`; optional scheduling
Popular/trending:
- based on likes/views counters on videos/profiles

## Acceptance checks
Manual:
- Apply filters and see results change
- Switch sort tabs (latest/featured/popular)
Agent verify:
- `/verify`

## Out of scope
- Complex recommendation ML

## Notes
- Implemented `/discover` with search, position/location filters, derived age filters, and latest/featured/popular sorting.
- Implemented `/explore` with featured players, trending videos, and challenge/event sections that render available data when those tables exist.
- TODO: Add challenge detail navigation once Slice 05 routes exist.
- TODO: Add event detail and interested actions once Slice 07 routes exist.
