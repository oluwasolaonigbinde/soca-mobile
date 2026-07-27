# SOCA MVP Handoff Runbook

## Setup

```bash
npm install
```

## Environment

Create `.env.local` from `.env.example` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://hhwzcaxspfwtqmcvtswu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_DEMO_MODE=false
```

Optional local-only helpers:

```bash
EXPO_PUBLIC_DEV_SIGNIN_EMAIL=your-demo-email
EXPO_PUBLIC_DEV_SIGNIN_PASSWORD=your-demo-password
```

Do not commit real passwords or private service keys.

## Run

```bash
npm run start
```

For web preview:

```bash
npm run web
```

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web --output-dir .expo-audit-export
```

Remove `.expo-audit-export` after local verification if it is not needed.

## Store Release

See `docs/store-release.md` for App Store, TestFlight, Google Play, and EAS build/submit steps. See `docs/client-store-finish-line.md` for the client-facing checklist of everything the client must create, provide, or approve. Store submission is now a release-hardening track with required client-owned assets:

- Apple Developer and Google Play Console access.
- Public privacy policy and terms URLs.
- Support URL/email, age rating answers, screenshots, and review demo credentials.
- Deployed Supabase `delete-account` Edge Function for in-app account deletion.

## Supabase

- Project ref: `hhwzcaxspfwtqmcvtswu`
- Required public tables are already present for profiles, follows, videos, discovery, challenges, messaging, events, and moderation.
- Required Storage buckets:
  - `avatars`
  - `videos`
- Demo video records currently point at real MP4 objects in the `videos` bucket under the `phase1-demo` folder.

## Admin Module

- Admin access is controlled by `auth.users.raw_app_meta_data.is_admin = true`; it is an admin capability, not a fifth SOCA role.
- Admin-capable users see an **Admin** entry in app navigation. Non-admin users do not see the entry and `/admin/*` routes are guarded by `AdminGate`.
- Admin screens support creating events and challenges, reviewing challenge submissions, saving internal `admin_score` values, assigning challenge winners, managing featured items, resolving/dismissing reports, and verifying/unverifying profiles.
- Challenge winner assignment writes to `profile_achievements`; those achievements are public-read and render on the winning profile's About tab.
- Event winner assignment is not exposed in V1 because events currently have only `event_interest`, not submissions/participants or scoring.

## Mixed Posts Update

- Home/feed now presents social content as **Posts** instead of only **Highlights**.
- Posts support text-only updates and video posts with optional captions.
- Existing highlight videos still use the `videos` table, `videos` storage bucket, `/video/[id]` playback route, `video_likes`, and `video_views`.
- The additive `posts` table in `docs/schema-13-posts.sql` links optional `video_id` values to existing videos; old video rows still appear as virtual video posts if no linked post exists.
- Profile pages now show a mixed **Posts** timeline plus a video-only **Highlights** grid, while preserving avatar, bio, role, location, follow/message/report/admin actions, and profile stats.
- Image/photo posting is intentionally deferred; no image upload UI is faked in this handoff.

## Demo Accounts

Demo users exist for:

- Player
- Scout
- Club
- Organization
- Admin capability via `auth.users.raw_app_meta_data.is_admin = true`

Keep actual demo passwords in the client handoff channel or password manager, not in this repository.

## Client Walkthrough Path

1. Sign in with the agreed demo account.
2. Open Home and verify mixed post cards load.
3. Open a video detail and verify playback starts.
4. Open Explore and verify featured players, trending highlights, challenges, and events appear.
5. Open Challenges and verify active challenges are current.
6. Open Events and verify upcoming event details and Interested counts.
7. Open Messages and verify the demo conversation thread.
8. Sign in as an admin-capable account and open Admin from the app navigation.

## Known Caveats

- Google OAuth still needs provider-side confirmation in Supabase and Google Cloud Console before it should be demonstrated.
- Event winner assignment is deferred until event participation/scoring exists; challenge winners are implemented and visible on profiles.
- Store publishing is now documented in `docs/store-release.md`; actual submission still requires client-owned developer accounts, legal URLs, screenshots, and review metadata.
- `expo-av` is used for video playback and currently emits an SDK deprecation warning during export.

