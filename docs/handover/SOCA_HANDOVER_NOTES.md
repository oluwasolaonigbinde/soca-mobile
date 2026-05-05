# SOCA — Handover Notes

Concise summary of the stabilization pass run on 2026-05-05. Read this first;
[SOCA_HANDOVER_AUDIT.md](SOCA_HANDOVER_AUDIT.md) has the full detail and
[SOCA_CODE_ANALYSIS.md](SOCA_CODE_ANALYSIS.md) has the prior code-only review.

## TL;DR

**Status: READY WITH CAVEATS.** The repo is safe to hand over once the four
must-do dashboard / process actions below are completed.

## What was fixed in this pass

All fixes pass `npm run typecheck`, `npm run lint`, and `npm test` (17/17).

| # | Fix | File |
|---|---|---|
| 1 | Native session persistence — AsyncStorage wired into Supabase client; sessions now survive cold start on iOS/Android. | [src/lib/supabase.ts](../../src/lib/supabase.ts) |
| 2 | Auth listener subscription is now captured and disposed on unmount; `initialize()` is idempotent. | [src/store/auth.ts](../../src/store/auth.ts), [app/_layout.tsx](../../app/_layout.tsx) |
| 3 | Demo mode requires `__DEV__` in addition to the env var. Release builds cannot enter demo mode. | [src/lib/demo-mode.ts](../../src/lib/demo-mode.ts) |
| 4 | Dev Quick Login button requires `__DEV__` AND both env vars. Credentials cannot ship in release builds via this code path. | [app/auth/login.tsx](../../app/auth/login.tsx) |
| 5 | `.env.example` rewritten with explicit "do not set in handover builds" warnings for demo mode and dev signin. | [.env.example](../../.env.example) |
| 6 | Storage bucket lock script committed: `avatars` (2 MB), `post-images` (5 MB), `videos` (100 MB, mp4/mov/webm). | [docs/schema-storage-buckets.sql](../schema-storage-buckets.sql) |
| 7 | `/feed` no longer fakes a `'player'` role for non-player users; redirects to `/welcome` or `/onboarding/role` as appropriate. | [app/feed.tsx](../../app/feed.tsx) |
| 8 | Google sign-in now throws on cancel/dismiss/missing-tokens so the login screen can show feedback. | [src/store/auth.ts](../../src/store/auth.ts) |
| 9 | `PostCard` like-count clamped to ≥ 0 so optimistic / stale state can never render `-1 Likes`. | [src/components/feed/PostCard.tsx](../../src/components/feed/PostCard.tsx) |
| 10 | `useProfileById` in demo mode no longer falls through to live Supabase. | [src/hooks/useProfileById.ts](../../src/hooks/useProfileById.ts) |
| 11 | `recordVideoView` no-ops when no user is signed in. | [src/lib/videos.ts](../../src/lib/videos.ts) |
| 12 | `expo-image-picker` plugin block added to `app.json` so iOS dev/release builds get the photo permission string. | [app.json](../../app.json) |
| 13 | `docs/schema-profiles.sql` comment updated to reflect that profile creation is via trigger; client upsert is a defensive fallback. | [docs/schema-profiles.sql](../schema-profiles.sql) |

## Live Supabase changes already applied (2026-05-05, via MCP)

These three changes have been applied to the live project and verified.
They show up in `list_migrations` as the most recent three.

| Migration | What it does |
|---|---|
| `20260505193320_lock_storage_buckets_size_and_mime` | Sets size + MIME limits on `avatars` (2 MB), `post-images` (5 MB), and `videos` (100 MB / mp4-mov-webm). The `videos` row was previously unlimited. |
| `20260505193334_harden_function_search_paths` | `SET search_path = public, pg_catalog` on `handle_new_user`, `handle_updated_at`, `set_updated_at`, `enforce_immutable_role`. Closes the `function_search_path_mutable` lint. |
| `20260505193347_revoke_handle_new_user_rpc_exposure` | Revokes `EXECUTE` on `public.handle_new_user()` from `anon`, `authenticated`, `public`. The `on_auth_user_created` trigger continues to fire. Closes the two `*_security_definer_function_executable` lints. |

Security advisor delta: **9 lints → 3 lints**.

## Still requires a human action before handover

1. **Enable Leaked Password Protection** in the Supabase dashboard:
   Authentication → Sign In / Providers → Password → "Leaked password
   protection" toggle. Not exposed via SQL/MCP. Closes
   `auth_leaked_password_protection`.

2. **Commit and push the working tree** (described below in "Process actions").

3. **Remove `EXPO_PUBLIC_DEV_SIGNIN_*` from `.env.local`** before any handover
   build. The code now strips them in release builds, but Expo bakes
   `EXPO_PUBLIC_*` into dev-client / preview builds.

## Recommended (not blocking) Supabase changes — deferred pending smoke test

These can be applied from the agent later, but want a quick app-level check first.

4. **Tighten `profile_views` SELECT policy** to owner-only. Note the count query
   is currently run by the *viewer*, so a strict owner-only SELECT would also
   need a small `SECURITY DEFINER` RPC like `get_profile_view_count(uuid)` to
   keep the public counter working. Recommend wiring the RPC first, then
   applying the policy change.

5. **Drop the broad `avatars` listing policies** (`avatars_read_anon`,
   `avatars_read_authenticated`). Public buckets serve URLs directly without
   object listing — but verify the in-app `Avatar` component doesn't depend on
   listing before applying.

## Process actions before delivery

6. **Commit and push the working tree.** ~80 untracked files (slices 03–12) and
   ~50 modified files are sitting on the developer's laptop only; `origin/main`
   is still at the Slice 02 merge. From the repo root:
   ```bash
   git checkout -b release/handover
   git add -A
   git commit -m "feat: slices 03-12 + handover stabilization pass"
   git push -u origin release/handover
   ```
   Open a PR (does not need to be merged) so the work is reviewable and recoverable.

7. **Remove dev-only env vars** from `.env.local` before any handover build:
   ```
   EXPO_PUBLIC_DEV_SIGNIN_EMAIL=     # leave empty / remove
   EXPO_PUBLIC_DEV_SIGNIN_PASSWORD=  # leave empty / remove
   EXPO_PUBLIC_DEMO_MODE=false       # never `true` for client builds
   ```
   The code now strips these at build time, but Expo bakes `EXPO_PUBLIC_*`
   values into the bundle. Don't ship them.

## Caveats remaining for handover

These were already disclosed in `docs/handoff.md` and the audit report; not
fixed in this pass.

- **Email verification deep-link works on web only.** `window.location.origin`
  is `undefined` on native. Disable email confirmation on the demo project for
  the walkthrough.
- **`expo-av` deprecation warning.** Used by the video player; SDK 54 deprecates
  it in favour of `expo-video`. No runtime impact today.
- **92 Supabase performance advisor warnings** (RLS init-plan, multiple
  permissive policies, unused indexes, missing FK indexes). Perf only; data is
  currently empty.
- **Top-level routes outside role groups are not auth-gated** (`/explore`,
  `/discover`, `/upload/video`, `/messages*`, `/me*`, `/profile/[id]`,
  `/video/[id]`, `/report/new`, `/challenges`, `/events*`). Hitting these via
  deep-link while signed-out throws "Not authenticated". `/feed` is now safe.
- **Image / video uploads use `fetch().blob()`**, which can zero-byte on native.
  Test on a physical device before the demo recording; if files come back as 0
  bytes, switch to a base64 + `decode` pattern.
- **Demo state is module-level and resets on reload.** Documented in
  `SOCA_CODE_ANALYSIS.md` §3.6.
- **Google OAuth requires Supabase + Google Cloud Console wiring** before the
  button works (`docs/GOOGLE_OAUTH_SETUP.md`). Currently feature-flagged off
  via `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED`.
- **No `supabase/migrations/` folder.** The repo ships SQL run-scripts in
  `docs/schema-*.sql` for a fresh setup; the live project has 11 migrations
  already applied. New developers should connect to the existing project rather
  than provisioning from scratch.

## What must NOT be promised as included scope

The following are **out of scope** per `specs/scope.md` §14, §16:

- App Store / Google Play / TestFlight publishing or distribution.
- Hosting, infrastructure management, monitoring, ongoing operations.
- Push notifications.
- Stories / reels / live streaming.
- Media attachments in chat.
- Multi-role account switching.
- Event ticketing / RSVPs / monetization.
- Web platform.
- Payments, contracts, transfers, agent management.
- Advanced AI (computer-vision performance analysis, Scout Fit Score, AI player
  comparison, live match analysis).
- Advanced analytics dashboards.

The repo includes some Phase-2-adjacent additions (mixed text/image posts,
`profile_achievements`/winners, verification badges, JWT-based admin model)
that are present and working today; these are bonus but should not be presented
as a commitment.

## Verification

```
npm run typecheck   PASS
npm run lint        PASS
npm test            PASS  (17/17 across 7 suites)
```

The app was not run on a device/emulator in this pass. Recommend a quick smoke
test on a real device before the demo recording — particularly avatar and
video uploads (file-size check) and a sign-in / kill-app / reopen test on
native to confirm session persistence.
