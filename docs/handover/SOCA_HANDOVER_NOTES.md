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

| Migration | What it does |
|---|---|
| `lock_storage_buckets_size_and_mime` | Sets size + MIME limits on `avatars` (2 MB), `post-images` (5 MB), and `videos` (100 MB / mp4-mov-webm). |
| `harden_function_search_paths` | `SET search_path = public, pg_catalog` on `handle_new_user`, `handle_updated_at`, `set_updated_at`, `enforce_immutable_role`. |
| `revoke_handle_new_user_rpc_exposure` | Revokes `EXECUTE` on `public.handle_new_user()` from `anon`, `authenticated`, `public`. Trigger continues to fire. |
| `profile_views_owner_only_with_count_rpc` | `get_profile_view_count(uuid)` RPC; `profile_views.SELECT` tightened to owner-only. |
| `profile_views_self_history_and_batch_count_rpc` | Second SELECT policy for `viewer_id = auth.uid()` (so users still see their own viewer history); batch `get_profile_view_counts(uuid[])` RPC for Discover popularity. Fixes a regression where the first policy change zeroed out Discover's popularity signal and the recommendation viewer-history. |
| `drop_avatars_broad_listing_policies` | Drops `avatars_read_anon` / `avatars_read_authenticated`. Public URLs still serve via `getPublicUrl`; listing is closed. |

Security advisor delta: **9 lints → 4 lints**. The four remaining are:
- `extension_in_public` (citext) — low risk; column-type relocate is the only fix.
- 2× `*_security_definer_function_executable` on **the new** `get_profile_view_count` — **accepted by design**: the RPC must be callable by anon/authenticated to keep the public profile-view counter visible without exposing `viewer_id`.
- `auth_leaked_password_protection` — dashboard toggle (below).

## Done locally (not pushed)

- `.env.local` — `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` and `EXPO_PUBLIC_DEV_SIGNIN_PASSWORD` are now commented out with a "DISABLED FOR HANDOVER" warning. `EXPO_PUBLIC_DEMO_MODE=false` is retained with the same warning.
- Branch `release/handover` was created from `main` and the full working tree (slices 03–12 + the stabilization pass + new docs) was committed as `ac49b67 feat: slices 03-12 + handover stabilization pass`. **The branch has not been pushed yet** — pushing requires your credentials.

## Two items still need a human action before handover

1. **Push the branch:**
   ```bash
   git push -u origin release/handover
   ```
   Open a PR if the client expects to see one; otherwise the URL `https://github.com/<org>/<repo>/tree/release/handover` is the deliverable.

2. **Enable Leaked Password Protection** in the Supabase dashboard:
   Authentication → Sign In / Providers → Password → "Leaked password
   protection" toggle. Not exposed via SQL/MCP. Closes the last
   `auth_leaked_password_protection` lint.


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

Store release-readiness was added after the original MVP handoff. See `docs/store-release.md` for App Store, TestFlight, Google Play, and EAS build/submit steps. The following remain **out of scope** per the current `specs/scope.md` and release runbook:

- Client-owned Apple Developer / Google Play Console account setup, legal policy hosting, final screenshots, reviewer communication, review outcomes, and ongoing release operations.
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
