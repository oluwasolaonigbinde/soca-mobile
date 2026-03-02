# Slice 09 — AI Assist (Assistive Intelligence)
Status: TODO

## Goal
Implement the MVP "assistive intelligence" layer as deterministic ranking/recommendations.

## User-visible behavior
- Scout feed adapts based on interactions
- Player feed highlights challenges/exposure opportunities
- Discovery lists have "recommended" sections

## Implementation approach (V1)
- Rule-based scoring:
  - recency
  - likes/views
  - scout interactions (messages/shortlists if implemented)
  - challenge performance
- Store signals in tables; compute ranked lists server-side or client-side deterministically

## Data / backend (recommended)
Tables (optional but useful):
- `engagement_signals` (or multiple tables already exist)
- `shortlists` (if you add it as a scout action)

## Acceptance checks
Manual:
- Verify "recommended" changes after a few interactions (basic)
- Ensure ranking is explainable in code/logs
Agent verify:
- `/verify`

## Out of scope
- ML training, computer vision, "fit score" learning (Phase 3)
