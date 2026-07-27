# Decisions — SOCA V1

This file prevents re-deciding. If an implementation choice changes, update this file.

---

## Day-0 Decisions (Defaults for V1)

### Product boundaries
- We ship **mobile app source code + demo video**.
- Store release-readiness is now included as a client-requested hardening track. Client-owned developer accounts, legal URLs, screenshots, final store metadata, reviewer communication, production ops, and ongoing support remain out of scope.

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
  - `videos` (highlight uploads and challenge submissions; public in the current playback implementation)

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
- "Featured" is admin/manual curation in V1 via `featured_items`.

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
- `featured_items` (admin-curated; item_type + item_id + section; ordering/scheduling; RLS read-only for app, writes via service role / admin)

### Out of scope (explicit)
- Store account ownership, final store metadata, reviewer communication, and ongoing release operations
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
- **Discovery foundation** (pre–Slice 04): `profiles` has nullable `position`, `birth_year` (no mutable `age`). Discovery uses `featured_items` table (item_type, item_id, section, sort_order, starts_at/ends_at, is_active). RLS: public read of active+in-window rows only; no INSERT/UPDATE/DELETE for anon or authenticated—writes via service role, SQL Editor, or future admin tooling.
- **Slice 03** video playback opens a public Supabase Storage URL in the system browser from `/video/[id]` instead of embedding a native player dependency; the `videos` bucket is public in the current implementation, feed ordering is latest-first, like/view counts are computed via COUNT queries, and `video_views` permits anonymous inserts with `viewer_id = null` or authenticated inserts with `viewer_id = auth.uid()`.
- **Slice 04** discovery filters query `profiles` directly, derive age from `birth_year`, compute popularity from follower counts plus profile views, and use `featured_items` for featured profile ordering. Explore challenge/event sections render available rows when those tables exist and otherwise stay empty until later slices add those flows.
- **Slice 05** leaderboard score is derived live as `admin_score + (likes * 3) + views`, and each player has a single submission per challenge; resubmitting replaces the linked video and resets `admin_score` to `null` until re-reviewed.
- **Slice 06** uses a materialized `conversations` table for one-to-one pairs with app-side sorted participant ids (`user_a`, `user_b`) to avoid duplicate threads, computes unread counts from `messages.read_at IS NULL`, and marks inbound messages as read when the thread opens.
- **Hardening** Player profile completion now requires `position` and `birth_year` in addition to `role`, `display_name`, and `location`; non-player roles still require the lighter public profile only.
- **Hardening** Player-only flows are enforced in both routing and mutations: only `player` profiles can upload highlight videos or submit challenge videos.
- **Slice 07** event listings normalize the schedule field from `date`, `event_date`, or `starts_at`, sort upcoming events by soonest date first, resolve organizer names from event rows or `profiles`, and enforce one `event_interest` row per `(event_id, user_id)` with a database unique index; the app also treats duplicate-key insert races as no-ops.
- **Slice 08** admin access is an additional capability, not a fifth platform role: the app gates `/admin/*` routes from `auth.users.app_metadata.is_admin = true`; moderation reports cover profile/video content; manual verification uses `profiles.verified` + `profiles.verified_at`; and Explore now supports a featured videos rail sourced from `featured_items`.
- **Challenge scoring override (2026-03-10)** public challenge leaderboards are community-driven: rank by engagement score only, using `(likes * 3) + views`; `challenge_submissions.admin_score` may remain stored for future internal use but does not affect public ordering.
- **Slice 09 (AI Assist)** feed is network-first: content from people you follow + engage with (likes, views, messages); pad with public latest when sparse; same for all roles. Discover gets a "Recommended" sort tab for suggested players you don't follow yet; Explore has no recommended section. Use existing tables only (`follows`, `video_likes`, `video_views`, `messages`, `profile_views`); no shortlists or engagement_signals.
- **Slice 09 implementation detail** feed owner priority is weighted deterministically as follows > messages > liked videos > viewed videos, then sorted by recency within each signal strength. Discover Recommended is player-focused in the UI, excludes already-followed profiles, and ranks direct interaction signals ahead of shared position/location affinity, with popularity as fallback fill.
- **Slice 11** visual polish is styling-only: shared blue/teal demo branding, stronger card elevation, hero gradients via `expo-linear-gradient`, larger highlight thumbnails, and refined typography/spacing were applied without changing routes, component entrypoints, hooks, or backend behavior.
- **Slice 12 (2026-03-16)** authenticated UX refinement stays frontend-only: routes/navigation remain unchanged, player home is upload-first with no intro hero above the primary action, profile positions use a presentational abbreviation layer (`Striker -> ST`, `Goalkeeper -> GK`, etc.), highlight cards must render a real thumbnail when available or a deterministic football-themed fallback image, and challenge discovery/listing is open-first with optional submission counts derived from existing `challenge_submissions` rows when available.
- **Client mixed posts update (2026-04-26)** `posts` is an additive umbrella feed layer for text posts and optional video attachments; `videos`, `video_likes`, `video_views`, challenge submissions, featured videos, and `/video/[id]` remain the source of truth for highlight playback and engagement. Existing videos without a linked `posts` row are rendered by the app as virtual video posts for backward compatibility.
- **Final non-admin pass (2026-04-28)** Image/photo posts use additive `posts.image_path` plus a public `post-images` storage bucket with per-user folder write policies. Non-video text/image posts use `post_likes`; video posts continue to use `video_likes` so highlight engagement and challenge scoring remain unchanged.
- **Admin handoff pass (2026-04-28)** Admin access remains an `is_admin` auth metadata capability. Admin entry now lives in authenticated navigation instead of the player profile hero; event creation uses admin-only `events` write policies; challenge winners are recorded as public-read `profile_achievements` and shown on player profiles. Event winner assignment remains deferred until events have submissions/participants beyond Interested.
- **Store release-readiness (2026-06-07)** Client requested App Store and Play Store readiness after initial MVP handoff scope excluded distribution. The app now carries default bundle/package identifiers, EAS build profiles, in-app account deletion via a Supabase Edge Function, and settings links for privacy/terms. Client-owned developer accounts, legal URLs, screenshots, final metadata, and review outcomes remain external handoff requirements.
