# Slice 04 — Discovery + Explore
Status: TODO

## Goal
Implement player discovery + explore page:
- Search/filter by position, age, location, role
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
- query `profiles` with filters (position/age/location/role)
Featured:
- `profiles.featured` boolean OR `featured_items` table
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
