# Decisions — SOCA V1

This file prevents re-deciding. If an implementation choice changes, update this file.

---

## Day-0 Decisions (Defaults for V1)

### Product boundaries
- We ship **mobile app source code + demo video**.
- We do **not** ship store deployment, production ops, or ongoing support (out of scope).

### Roles
- Roles are: Player, Scout, Club, Organization.
- Role affects onboarding fields and default home feed emphasis (not separate apps).

### Navigation (Expo Router)
- Use Expo Router file-based routes.
- Use role route groups:
  - `app/(player)/...`
  - `app/(scout)/...`
  - `app/(club)/...`
  - `app/(org)/...`
- Auth/onboarding routes live outside role groups:
  - `app/welcome`, `app/auth/*`, `app/onboarding/*`

### Auth (Supabase)
- Use Supabase Auth:
  - Email/password
  - Google sign-in
- Persist session locally; gate role routes behind session.
- On first login, user must have:
  - `role` selected
  - role-specific profile completed (minimum required fields)

### Data (Supabase Postgres + Storage)
- RLS is enabled on all tables that contain user content.
- Storage buckets:
  - `avatars` (profile images)
  - `videos` (highlight uploads and challenge submissions)

### Visibility
- Profiles are public pages (basic public info + highlights).
- Feed content is public by default (as per MVP scope).
- Messaging is private between participants.

### Engagement counters
- Track:
  - Views (for profiles + videos)
  - Likes (for videos)
- Default approach: write events to tables + maintain aggregate counters for ranking.

### Discovery ranking (V1)
- V1 ranking is **rule-based** and deterministic:
  - Recency (upload date)
  - Engagement signals (likes, views)
  - Role-aware weighting (scout interactions matter more for "exposure" signals)
- "Featured" is an admin/manual flag in V1.

### AI Assist (V1 = Assistive Intelligence)
- V1 is NOT ML training.
- V1 uses:
  - simple rules
  - behavior signals aggregation
- Output:
  - ranked lists + "recommended" sections
- Must be explainable by stored signals.

### Challenges (V1)
- Challenges are admin-created, monthly.
- Player can submit video to a challenge.
- Scoring is a combination of:
  - admin input (score)
  - engagement (likes/views)
- Leaderboard is public and ranked.

### Events (V1)
- Events are listed and viewable.
- Users can mark "Interested" (basic interaction).

### Admin/moderation (V1)
- Admin can:
  - create/manage challenges
  - feature content
  - view/act on reported content
  - optionally assign verification badges

### Minimal schema (recommended starting point)
These are recommended names; adjust to existing schema if repo already has one.

Tables:
- `profiles` (user profile data; one row per user)
- `follows` (follower/following)
- `videos` (highlight posts)
- `video_likes`
- `video_views`
- `profile_views`
- `challenges`
- `challenge_submissions`
- `events`
- `event_interest`
- `conversations` (optional; or derive from messages)
- `messages`
- `reports` (reported content)
- `featured_items` (optional; or flags on videos/profiles)

### Out of scope (explicit)
- Store publishing / TestFlight / Play Store
- Web platform
- Payments / contracts / transfers / agent management
- Live streaming
- Reels/stories
- Push notifications (unless trivially added later; not required for MVP)

---

## Decision log (append-only)
- **Slice 02** Counts (follower/following/profile_views) computed via COUNT, not stored on profiles. `/me/followers` and `/me/following` = current user only. `profile_views`: authenticated inserts only; RLS enforces `viewer_id = auth.uid()` to prevent spoofing.
- **Slice 01 guard** uses profileStatus state machine (loading/missing/error/ready); no redirects during loading.
- If profile missing, perform one idempotent upsert keyed by profiles.id = auth.user.id, then refetch; if still missing → error (no loop).
- Redirect authority: app/index.tsx only (no redirect logic in _layout.tsx).
- Profile complete requires: role + display_name + location. Bio optional.
