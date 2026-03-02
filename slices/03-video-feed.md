# Slice 03 — Video Upload + Feed
Status: TODO

## Goal
Implement highlight videos and public feed visibility:
- Upload video highlight
- Secure streamed playback
- Like + view tracking
- Basic feed (latest) and profile highlights tab

## User-visible behavior
- Player uploads a video
- Video plays back reliably
- Users can like videos
- Views are tracked (basic)
- Feed shows latest videos

## Screens / routes
- `/upload/video`
- `/feed`
- `/video/[id]`
- `/profile/[id]` (highlights section)

## Data / backend (recommended)
Storage:
- bucket `videos` (per decisions)
Tables:
- `videos`:
  - `id`, `owner_id`, `storage_path`, `duration`, `created_at`, `caption?`
- `video_likes`:
  - `video_id`, `user_id`, `created_at`
- `video_views`:
  - `video_id`, `viewer_id` (nullable), `created_at`

RLS:
- public read videos
- only owner can create/update/delete own video
- likes/views: authenticated write, public read aggregates

## Acceptance checks
Manual:
- Upload video and see it in feed + profile
- Like a video and see count increment
- Video plays without crashing
Agent verify:
- `/verify`

## Out of scope
- Advanced ranking (AI) beyond "latest/trending placeholder"
