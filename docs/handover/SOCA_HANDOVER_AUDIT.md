# SOCA V1 — Handover-Readiness Audit

> **Post-fix status (2026-05-05):** A focused stabilization pass has been run.
> Eight Critical/High items in this report have been fixed in the repo, three
> remain manual Supabase-dashboard / process actions, and three are documented
> caveats. See **§8 Post-Fix Status** at the bottom of this file and
> [docs/handover/SOCA_HANDOVER_NOTES.md](docs/handover/SOCA_HANDOVER_NOTES.md)
> for the concise handover summary.

**Audit date:** 2026-05-05
**Repo audited:** `C:\Sola Files\Sola Old\soca-mobile` (working tree, including uncommitted changes)
**Live Supabase project audited:** `hhwzcaxspfwtqmcvtswu` (`onigbinde31@gmail.com's Project`, eu-central-1)
**Scope reference:** `specs/scope.md`, `specs/decisions.md`, `slices/00..12`, `docs/MVP-SCOPE.md`
**Cross-reference:** an earlier code-only review exists at [docs/handover/SOCA_CODE_ANALYSIS.md](docs/handover/SOCA_CODE_ANALYSIS.md). This document supersedes it for handover purposes and adds the Supabase-server-side picture.

> **Important repo state warning.** At audit time the local working tree had **52 modified tracked files and ~80 untracked files** (slices 03–12 plus all schemas, components, hooks, and admin/upload/messages/events routes are uncommitted). Branch `main` on origin is still at `413de65 Merge pull request #1` (Slice 02). The bulk of MVP work has not been committed, and PR #1 only covers slices 0–2. Anything sent to the client today is on the developer's laptop, not in GitHub.

---

## 1. Executive Summary

### Overall status: **READY WITH CAVEATS — but only after the Must-Fix list and after committing the work**

What's actually built (verified in working tree + live DB): all 11 MVP scope items in `docs/MVP-SCOPE.md` have a code path — auth + onboarding, profiles + follows + views, videos with likes/views, mixed posts (text + image + video), discovery + explore, challenges + leaderboards + winners, 1-to-1 messaging with read receipts, events + interest, admin (challenges, events, featured items, reports, verification, achievements), assistive ranking signals, and visual polish. RLS is enabled on every public table. Storage buckets and policies match the code. Eleven Supabase migrations are present.

What blocks a clean handover: (a) the work is not committed/pushed; (b) native session persistence is broken; (c) "Demo mode" replaces real Supabase across 8 service modules and the env file ships with the env-var present (currently `false`, but a single character flips the whole app to in-memory fakes); (d) `Dev Quick Login` button ships in `app/auth/login.tsx` and lights up automatically when both `EXPO_PUBLIC_DEV_SIGNIN_*` env vars are set; (e) several Supabase advisor warnings (mutable function search_path, public bucket lists, leaked-password protection off); (f) the videos storage bucket has no size or MIME limits.

### Top 5 risks before handover

1. **Uncommitted work risk.** ~80 untracked files including all of slices 03–12. If the laptop dies, the MVP dies. Commit + push to a branch and open a PR before delivery, even if the PR isn't merged.
2. **Native session persistence is broken.** [src/lib/supabase.ts:21](src/lib/supabase.ts:21) sets `persistSession: Platform.OS === 'web'` and never wires `@react-native-async-storage/async-storage` (which IS in `package.json`). On iOS/Android, every cold start logs the user out — directly contradicts `specs/decisions.md` ("Persist session locally") and the Slice 01 acceptance check.
3. **Demo mode is a global switch with no enforcement.** Setting `EXPO_PUBLIC_DEMO_MODE=true` in `.env.local` causes 8 service modules (videos, posts, follows, messages, challenges, discovery, events, plus profiles in some paths) to return seeded fakes from `src/lib/demo-mode.ts`. There is no production-build guard preventing this from being shipped accidentally. `.env.example` documents the var; `.env.local` currently has `EXPO_PUBLIC_DEMO_MODE=false`.
4. **`Dev Quick Login` button is shipped.** `app/auth/login.tsx:157-164` renders a "Dev Quick Login" button whenever `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` and `EXPO_PUBLIC_DEV_SIGNIN_PASSWORD` are both set. Those vars are currently set in `.env.local`. Shipping a build that includes them would expose the password as a baked-in literal in the JS bundle (Expo `EXPO_PUBLIC_*` vars are inlined at build time and trivially extractable).
5. **`videos` storage bucket has no size or MIME limit.** Live bucket inspection: `videos` is `public=true`, `file_size_limit=null`, `allowed_mime_types=null`. Any authenticated user can upload anything (executables, ZIPs) up to whatever Supabase plan allows, into their own folder, served as a public URL. The `avatars` and `post-images` buckets are properly limited (2 MB / 5 MB, image-only).

### What must be fixed before sending to client

- Commit and push the working tree (or stash + branch) so the deliverable exists in git, not on a laptop.
- Wire AsyncStorage into the Supabase client and set `persistSession: true` for native.
- Make `Dev Quick Login` only render when `__DEV__ === true` (not just when env vars exist) and remove `EXPO_PUBLIC_DEV_SIGNIN_*` from any handover env file. Document that those vars must NOT be set for client builds.
- Lock the `videos` storage bucket: set `file_size_limit` (e.g. 100 MB) and `allowed_mime_types` (`['video/mp4','video/quicktime','video/webm']`).
- Add the `is_admin` setup steps to `docs/handoff.md` (currently mentioned but not actionable — no SQL or dashboard steps).
- Address Supabase security advisors that take 2 minutes each: set `SET search_path = public` on the four PL/pgSQL functions; tighten the avatars `SELECT` policy to `to authenticated, anon` with a per-object check (or accept the lint as known); enable Auth → Settings → Leaked password protection.
- Decide demo-mode policy: either ship it disabled and document, or strip the demo-mode branches before handover. Either is fine; "ambiguously present" is not.

### What can be disclosed as caveats (not fixed)

- Google OAuth needs Supabase + Google Cloud Console wiring before the button works (`docs/GOOGLE_OAUTH_SETUP.md`).
- 92 Supabase performance advisor warnings (43 RLS init-plan, 18 multiple permissive policies, 18 unused indexes, 13 unindexed FKs). All are perf, not security; data is currently empty. Will become noticeable after a few thousand rows.
- Email verification deep-link only works on web (`window.location.origin` in `src/store/auth.ts > signUp`). On native, recommend disabling email confirmation on the demo project.
- Handful of code-quality items already enumerated in [docs/handover/SOCA_CODE_ANALYSIS.md](docs/handover/SOCA_CODE_ANALYSIS.md) (auth listener leak, like-count clamp, gates on `/feed` `/explore` etc.). They have not been fixed since that doc was written.
- `expo-av` is deprecated in SDK 54 — used by the video player. Will need replacement with `expo-video` in a future Expo upgrade. Documented in `docs/handoff.md`.

### What should be deferred to future scope

- Phase-2 items per `specs/scope.md`: stories/reels, live streaming, push notifications, media in chat, multi-role switching, event ticketing.
- App Store / Play Store / TestFlight publishing and ongoing hosting/ops — explicitly out of scope.

---

## 2. Critical / High Findings

| Sev | Area | Finding | File(s) | Concrete trigger | Recommended action |
|-----|------|---------|---------|------------------|--------------------|
| Critical | Handover process | 80+ files including all of slices 03–12 are untracked / uncommitted on local `main`. `origin/main` is still at the Slice 02 merge. | `git status` in repo root | Lose the laptop, lose the MVP. Hand the client a GitHub URL — they only see slices 0–2. | `git checkout -b release/handover && git add -A && git commit -m "..." && git push -u origin release/handover`. Open a PR (do not have to merge) so the work is reviewable and recoverable. |
| Critical | Auth / Session | Native session persistence disabled. `persistSession: Platform.OS === 'web'` and no AsyncStorage adapter wired, despite `@react-native-async-storage/async-storage 2.2.0` being installed. | [src/lib/supabase.ts:19-25](src/lib/supabase.ts:19), [package.json:18](package.json:18) | iOS/Android cold start after login → user lands on `/welcome` instead of role home. | Configure `createClient(url, key, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: Platform.OS === 'web' } })`. |
| Critical | Demo / Scope risk | Demo mode hijacks 8 service modules and produces fake feed/profiles/messages/challenges/events when the env flag is `true`. There is no production-build guard. | [src/lib/demo-mode.ts:13](src/lib/demo-mode.ts:13), and `if (DEMO_MODE_ENABLED)` branches in [videos.ts](src/lib/videos.ts), [posts.ts](src/lib/posts.ts), [follows.ts](src/lib/follows.ts), [messages.ts](src/lib/messages.ts), [challenges.ts](src/lib/challenges.ts), [discovery.ts](src/lib/discovery.ts), [events.ts](src/lib/events.ts) (counts via `grep -c DEMO_MODE_ENABLED`). | A misconfigured `.env` ships demo behaviour to the client, who then thinks they have a working backend. Or a future dev forgets to set the var and gets an "empty" app and panics. | Either (a) gate every `if (DEMO_MODE_ENABLED)` behind `if (__DEV__ && DEMO_MODE_ENABLED)`, or (b) extract demo data to a separate "preview" build target. At minimum, document loudly in `docs/handoff.md` that `EXPO_PUBLIC_DEMO_MODE` MUST be `false` (or unset) for any client-facing build. |
| Critical | Auth / Security | `Dev Quick Login` button renders whenever `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` + `EXPO_PUBLIC_DEV_SIGNIN_PASSWORD` are set. Currently both are set in `.env.local`. `EXPO_PUBLIC_*` env vars are inlined into the JS bundle and trivially extractable from any released build. | [app/auth/login.tsx:20-22, 52-61, 157-164](app/auth/login.tsx:20) | Building the app with these vars set would publish the demo password. | Wrap with `if (__DEV__)` so it can never appear in a release build, and require the env vars to be unset in handover/`.env` examples. Update `.env.example` to comment more strongly. |
| Critical | Storage | `videos` bucket has `file_size_limit=null` and `allowed_mime_types=null`. RLS limits to own folder, but a single user can upload arbitrarily large or arbitrarily-typed files served as public URLs. | Live bucket query (`storage.buckets`) | Authenticated user uploads a 5 GB ISO via the Supabase JS SDK to `<their_uuid>/x.iso`. Plan storage burns; non-video file is served from `/videos/...`. | Set `file_size_limit = 104857600` (100 MB) and `allowed_mime_types = ['video/mp4','video/quicktime','video/webm']` on the bucket via Supabase dashboard or `update storage.buckets ...`. Already done on `avatars` (2 MB) and `post-images` (5 MB). |
| High | Auth / Security | `handle_new_user()` is `SECURITY DEFINER` in `public` schema and exposed via PostgREST RPC. Both `anon` and `authenticated` can call `POST /rest/v1/rpc/handle_new_user`. Function takes no args and references trigger `NEW`, so it'll error in the RPC invocation — but exposing it is still an attack surface and the advisor flags it as `WARN`. | Live functions / `pg_proc.prosecdef = true` for `handle_new_user`; advisor lints `0028`/`0029` | An attacker probes `/rest/v1/rpc/handle_new_user` looking for misuse. | Move the function to a private schema (e.g. `auth_extensions`) or `REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM anon, authenticated, public;`. Re-grant only to the role that runs the trigger (typically `supabase_auth_admin` or `postgres`). |
| High | Supabase / Security | Four PL/pgSQL functions have a mutable `search_path`: `handle_new_user`, `handle_updated_at`, `set_updated_at`, `enforce_immutable_role`. This is a textbook search-path injection vector for `SECURITY DEFINER` functions. Only `handle_new_user` is `DEFINER`, but the advisor recommends fixing all four. | Live `pg_proc` + advisor lint `0011`. | Crafted DDL or temp table in a writable schema can shadow `public.profiles` and intercept inserts. | Append `SET search_path = public` to each function definition (or `SET search_path = pg_catalog, public`). One-line ALTER each. |
| High | Storage / Privacy | `avatars` bucket has two broad SELECT policies (`avatars_read_anon`, `avatars_read_authenticated`) that allow listing every object via `storage.objects` SELECT. Bucket is public, so listing is not needed for fetching by URL. | Live storage policies; advisor lint `0025`. | Anyone calls `from('avatars').list('')` and enumerates every uploaded user avatar (and their UUID-prefixed paths, leaking user ids). | Drop the broad SELECT policies. Public buckets serve URLs without an `objects` SELECT. Or replace with a per-object SELECT that returns only the file the caller is allowed to see. |
| High | Auth | Email-verification redirect uses `window.location.origin`, which is `undefined` on native. Native users who trigger email confirmation cannot return to the app. | [src/store/auth.ts:87-89](src/store/auth.ts:87) | iOS user signs up → email verification link opens in mobile browser → no deep link back. | (a) Disable email confirmation in the demo Supabase project, (b) use `socamobile://auth/callback` as `emailRedirectTo` on native and add a deep-link handler, or (c) document the limitation. |
| High | Auth / Security | Auth → Settings → Leaked password protection is **off**. Advisor lint `auth_leaked_password_protection`. | Supabase dashboard, advisor result. | A user signs up with a known-leaked password and is silently accepted. | Enable in Supabase dashboard → Auth → Password security. One toggle. |
| High | Routing / Auth | Top-level routes outside role groups have **no auth gate**: `/feed`, `/explore`, `/discover`, `/upload/video`, `/messages*`, `/me*`, `/profile/[id]`, `/video/[id]`, `/report/new`, `/challenges` (only `submit.tsx` gates), `/events*`. An unauthenticated deep-link triggers "Not authenticated" exceptions. | Multiple files; documented in [SOCA_CODE_ANALYSIS.md §2](docs/handover/SOCA_CODE_ANALYSIS.md). | Sign out, deep-link `/messages` → blank screen / spinner / thrown error. | Add a single `(authed)/_layout.tsx` group with the auth+complete-profile gate and move screens inside, OR wrap each top-level layout in `<RoleGate>` (admin-style). |
| High | Auth / State | `onAuthStateChange` subscription registered in `useAuthStore.initialize` is never disposed. On fast refresh / re-mount, handlers stack and each fires `fetchProfile`. | [src/store/auth.ts:64-77](src/store/auth.ts:64) | Dev mode reload, or any double-mount of `RootLayout`. | Capture `data.subscription.unsubscribe()` on the response and dispose; guard `initialize` with an "already initialised" flag. |
| High | UI correctness | `PostCard` like-count math can render negative numbers when `like_count==0` and `is_liked==true` and the user un-likes. | [src/components/feed/PostCard.tsx:27](src/components/feed/PostCard.tsx:27) | Demo race / stale count / multi-tab. | Wrap in `Math.max(0, ...)` or derive count from a single source. |
| High | Demo / Mode mixing | When demo is enabled, `useProfileById` falls through to live Supabase if the demo seed misses. Inconsistent results across screens during a demo. | [src/hooks/useProfileById.ts](src/hooks/useProfileById.ts) | Demo build, real Supabase user id whose profile isn't in the demo seed. | Hard-stop demo branches from calling the live SDK. |
| Medium | Performance / RLS | 92 Supabase performance advisor warnings: 43 `auth_rls_initplan` (RLS calls `auth.uid()` per row instead of using `SELECT auth.uid()`), 18 `multiple_permissive_policies`, 18 `unused_index`, 13 `unindexed_foreign_keys`. | Advisor result; `mcp__supabase__get_advisors performance`. | At current row counts (most tables `rows: 0`), no impact. After ~10k–100k rows, query plans get measurably worse. | Replace `auth.uid()` with `(SELECT auth.uid())` in policy bodies (one of the migrations already does this for `posts/post_likes` — apply the same to older policies). Drop the duplicate "Profiles are viewable by everyone" / `profiles_select_own` overlap. Add covering indexes for the 13 unindexed FKs. None are launch-blockers. |
| Medium | Privacy | `profile_views.SELECT` is `USING (true)` — anyone can read viewer→profile pairs. Same finding I had against the worktree audit; confirmed live. | Live policy on `public.profile_views`. | Authenticated user runs `select * from profile_views` and reads who viewed whom. | Replace SELECT policy with `USING (auth.uid() = profile_id)` so only the owner sees viewer rows. The UI only ever needs the count, which can be served by an aggregate or a counter column. |
| Medium | Code quality | `uploadAvatar` and `uploadVideo` use `await fetch(uri).then(r => r.blob())` then upload the blob. On React Native this is known to produce zero-byte uploads on some Hermes/RN versions. The `avatars` bucket has a 2 MB limit so a 0-byte upload would store an empty file. | [src/lib/avatars.ts:41-49](src/lib/avatars.ts:41), [src/lib/videos.ts:358-364](src/lib/videos.ts:358) | Pick image on physical iOS/Android device → upload "succeeds" → file is 0 bytes. | Use `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })` + `decode` from `'base64-arraybuffer'`. Test on a real device. |
| Medium | Code quality | `expo-image-picker` not declared in `app.json > expo.plugins`. Without it, iOS dev builds lack `NSPhotoLibraryUsageDescription`. | [app.json:32-34](app.json:32) | iOS dev/release build → permission request crashes / is auto-denied. | Add `["expo-image-picker", { "photosPermission": "..." }]` to plugins. |
| Medium | Stale documentation | `docs/schema-profiles.sql` says "Client-side upsert is mandatory; do not rely on triggers." Live DB has the `on_auth_user_created` trigger calling `handle_new_user()`, so profile creation IS via trigger. The client `fetchProfile` upsert path is now redundant fallback, not the primary creation path. | [docs/schema-profiles.sql:2](docs/schema-profiles.sql:2), [src/store/auth.ts:170-200](src/store/auth.ts:170), live triggers. | New developer reads the comment and removes the trigger ("not needed"), then signups silently lose profile rows. | Update the comment to: "Profiles are created automatically on signup via the `on_auth_user_created` trigger; client-side upsert is a defensive fallback for legacy users only." |

---

## 3. Supabase Security Review

### Live tables (public schema, all RLS-enabled)

`profiles`, `follows`, `profile_views`, `videos`, `video_likes`, `video_views`, `posts`, `post_likes`, `featured_items`, `challenges`, `challenge_submissions`, `conversations`, `messages`, `events`, `event_interest`, `reports`, `profile_achievements`. All have `rls_enabled: true` and `rows: 0` at audit time.

### RLS summary (verified against live `pg_policies`)

| Table | Read | Write rules | Notes |
|---|---|---|---|
| `profiles` | public SELECT (`true`) + duplicate `profiles_select_own` for authenticated | Owner INSERT/UPDATE; admin UPDATE via `app_metadata.is_admin` | Duplicate SELECT policies cause `multiple_permissive_policies` perf warnings. Functionally fine. **Role is immutable** (verified: `enforce_immutable_role` trigger raises on role change). |
| `follows` | public | Owner-only INSERT/DELETE. CHECK prevents self-follow. PK prevents duplicates. | OK. |
| `profile_views` | public ⚠ | Authenticated INSERT, `viewer_id = auth.uid()` | **Public SELECT leaks viewer identity** (Medium). |
| `videos` | public | Owner-only INSERT/UPDATE/DELETE | OK. |
| `video_likes`, `video_views` | public | Authenticated INSERT only; `video_likes` has `auth.uid() = user_id`; `video_views` allows anon (viewer_id NULL). | OK. |
| `posts`, `post_likes` | public | Owner only. `posts` insert checks owned video and own image-path prefix. Uses `(SELECT auth.uid())` (init-plan optimised). | Best-written policies in the schema. |
| `featured_items` | filtered public (active + within window) + admin-all | Admin INSERT/UPDATE/DELETE | Two-policy SELECT triggers `multiple_permissive_policies` warning. Functionally correct. |
| `challenges` | public | Admin-only INSERT/UPDATE/DELETE; INSERT also enforces `created_by_admin = auth.uid()` | OK. |
| `challenge_submissions` | public | Owner INSERT/UPDATE; admin UPDATE (for scoring) | OK. Two UPDATE policies → `multiple_permissive_policies`. |
| `conversations`, `messages` | participants only | Sender-only INSERT (with conversation membership check); recipient-only UPDATE (read receipts) | Strong policy. |
| `events`, `event_interest` | public | Admin-only writes for events; user-only writes for own interest | OK. |
| `reports` | reporter-only OR admin | Authenticated INSERT (reporter_id=auth.uid()); admin UPDATE | OK. Reporter can't see other reports. |
| `profile_achievements` | public | Admin-only writes (created_by_admin=auth.uid()) | OK. |

### Storage buckets (live)

| Bucket | Public | Size limit | MIME limit | Issues |
|---|---|---|---|---|
| `avatars` | yes | 2 MB | 5 image types | Listing exposed (advisor `0025`). Path-prefixed write/update/delete. |
| `post-images` | yes | 5 MB | 5 image types | Properly tightened in migration `tighten_post_images_storage_listing`. No SELECT policy on `objects` (listing disabled). Path-prefixed write. |
| `videos` | yes | **null** | **null** | **No size cap, no MIME cap.** Path-prefixed insert/delete only. UPDATE not allowed. (Critical-listed.) |

### Admin model

- Implemented via `auth.users.raw_app_meta_data.is_admin = true`. JWT-claim-based; cannot be forged client-side.
- 1 admin currently exists (`SELECT count(*) FROM auth.users WHERE app_meta_data...` = 1 of 7 users).
- App reads via `isSessionAdmin(session)` ([src/lib/admin.ts:155-161](src/lib/admin.ts:155)) and gates routes via `<AdminGate>` ([src/components/auth/AdminGate.tsx](src/components/auth/AdminGate.tsx)). Server-side enforced via RLS on `reports`, `featured_items`, `challenges`, `events`, `profile_achievements`, and `profiles_admin_update`.
- ⚠️ The admin promotion procedure is **not documented**. `docs/handoff.md` mentions `app_metadata.is_admin = true` but doesn't show the SQL/CLI to set it. Add to docs:
  ```sql
  UPDATE auth.users
     SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{is_admin}', 'true')
   WHERE email = 'admin@example.com';
  ```
  (User must sign out + back in to refresh JWT after this.)

### Client-side privilege exposure check

- ✅ Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are referenced in code.
- ✅ No service-role key, JWT secret, or DB password in repo (`grep` clean).
- ✅ `.env.local` is git-ignored.
- ⚠️ `.env.local` currently contains `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` + `EXPO_PUBLIC_DEV_SIGNIN_PASSWORD` (values redacted from this report). If a build is produced from this `.env.local`, the password ships in the JS bundle. (See Critical row 4.)
- ⚠️ All security ultimately depends on RLS. Live RLS is good (table-by-table review above) with the Medium privacy issue on `profile_views`.

### Migrations

11 migrations applied, all named consistently:
`20260308…slice_03_videos`, `20260308…featured_items_section_not_null_unique_index`, `20260309…schema_05_challenges`, `20260309…schema_06_messaging`, `20260309…create_events_and_event_interest_tables`, `20260310…schema_08_admin`, `20260426…client_mixed_posts`, `20260426…client_mixed_posts_rls_initplan_fix`, `20260428…final_non_admin_image_posts_and_post_likes`, `20260428…tighten_post_images_storage_listing`, `20260428…admin_achievements_events_winners`.

⚠️ The repo `docs/schema-*.sql` files are **manual run-scripts**, not version-tracked migrations. The "first developer setup" path requires running them in order. There is no `supabase/migrations/` folder reflecting the live migration history. New developers cannot reproduce the live DB from the repo alone — they must connect to the existing project. Consider exporting the live migrations to `supabase/migrations/` for reproducibility.

---

## 4. Feature Readiness Matrix

| Feature (per `docs/MVP-SCOPE.md`) | Status | Evidence | Risk | Handover note |
|---|---|---|---|---|
| Email/password sign-up + sign-in | Implemented & safe | [app/auth/login.tsx](app/auth/login.tsx), [app/auth/signup.tsx](app/auth/signup.tsx), [src/store/auth.ts](src/store/auth.ts) | Email-verify deep link broken on native (High) | Disable email confirm on demo project. |
| Google sign-in | Implemented but un-configured | [src/store/auth.ts:229-264](src/store/auth.ts:229), now also gated by `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED` flag | Requires Supabase + Google Cloud Console setup | Disclose. |
| Role selection (4 roles) | Implemented & enforced | [app/onboarding/role.tsx](app/onboarding/role.tsx); `enforce_immutable_role` trigger live | None | OK. **Earlier audit was wrong** — role IS server-side immutable. |
| Profile setup + edit | Implemented & safe | [app/onboarding/profile-setup.tsx](app/onboarding/profile-setup.tsx), [app/me/edit-profile.tsx](app/me/edit-profile.tsx) | None major | OK. |
| Public profile pages | Implemented & safe | [app/profile/[id].tsx](app/profile/[id].tsx) and `src/components/profile/ProfileScreenContent.tsx` | Auth gate missing on `/profile/[id]` (High routing) | Add gate. |
| Avatars + photo posts | Implemented; demo-mode aware | [src/lib/avatars.ts](src/lib/avatars.ts), [src/lib/posts.ts](src/lib/posts.ts) | Blob upload may zero-byte on native (Medium); image-picker plugin missing (Medium) | Switch to base64 path; add plugin block. |
| Follow / unfollow + counts | Implemented & safe | [src/lib/follows.ts](src/lib/follows.ts), [src/hooks/useFollowStatus.ts](src/hooks/useFollowStatus.ts) | None major | OK. |
| Followers / Following lists | Implemented (own user only by design) | [app/me/followers.tsx](app/me/followers.tsx), [app/me/following.tsx](app/me/following.tsx); decision in [specs/decisions.md:118](specs/decisions.md:118) | Other users' follower lists not viewable. | Disclose if client expected otherwise. |
| Profile views counter | Implemented | [src/lib/profile-views.ts](src/lib/profile-views.ts), [app/profile/[id].tsx](app/profile/[id].tsx) | viewer_id publicly readable (Medium privacy) | Tighten policy or accept disclosure. |
| Video upload + playback | Implemented | [src/lib/videos.ts](src/lib/videos.ts), `app/upload/video.tsx`, `app/video/[id].tsx`. Uses `expo-av` (deprecated in SDK 54). | Bucket has no size/MIME cap (Critical); `expo-av` deprecation warning | Lock bucket; plan `expo-video` migration. |
| Video likes / views | Implemented | [src/lib/videos.ts](src/lib/videos.ts), `useVideoLikeStatus.ts`. Public read; authenticated like; anon view allowed. | Like-count math negative possible (High) | Clamp to 0 in UI. |
| Mixed posts (text + image + video) | Implemented | [src/lib/posts.ts](src/lib/posts.ts), `posts` + `post_likes` tables, `post-images` bucket | None major | New beyond scope; documented in `docs/handoff.md`. |
| Public feed | Implemented (network-aware ranking) | [src/lib/videos.ts:175-281](src/lib/videos.ts:175), [src/lib/ai-assist.ts](src/lib/ai-assist.ts) | `/feed` not auth-gated; falls back to `'player'` role (High) | Add gate. |
| Discovery (search/filter) | Implemented | [src/lib/discovery.ts](src/lib/discovery.ts), `app/discover.tsx` | `listAllDiscoveryProfiles` paginates without cap (perf risk per [SOCA_CODE_ANALYSIS.md §3.7](docs/handover/SOCA_CODE_ANALYSIS.md)) | Cap candidate pool. |
| Explore (featured / trending / events / challenges) | Implemented | [app/explore.tsx](app/explore.tsx), `featured_items` table | Same `multiple_permissive_policies` perf warning | OK for V1. |
| Challenges + submissions + leaderboards | Implemented | [src/lib/challenges.ts](src/lib/challenges.ts), `app/challenges/...` | `app/challenges/index.tsx` not auth-gated | Add gate. |
| Challenge admin scoring + winners | Implemented | [src/lib/admin.ts:303-353](src/lib/admin.ts:303), `profile_achievements` table + admin-only writes | None major | OK. |
| 1-to-1 messaging | Implemented | [src/lib/messages.ts](src/lib/messages.ts), `app/messages/...`, `conversations` + `messages` tables; participant-only RLS | No realtime; `markConversationRead` can race; `or(...)` filter fragile to PostgREST escaping | Document realtime limitation. |
| Events + interested | Implemented | [src/lib/events.ts](src/lib/events.ts), `app/events/...` | Inconsistent date column naming (`event_date` vs `date`) | Document. |
| Reports / moderation | Implemented | [src/lib/admin.ts:371-491](src/lib/admin.ts:371), `app/admin/reports.tsx`, `app/report/new.tsx` | `/report/new` not auth-gated (High) | Add gate. |
| Featured content management | Implemented | [src/lib/admin.ts:493-613](src/lib/admin.ts:493), `app/admin/feature.tsx` | None major | OK. |
| Verification badges | Implemented | [src/lib/admin.ts:615-642](src/lib/admin.ts:615), `app/admin/verification.tsx`, `profiles.verified` column | None major | OK. |
| AI assist (rule-based ranking) | Implemented | [src/lib/ai-assist.ts](src/lib/ai-assist.ts), used in `videos.ts` and `discovery.ts` | None major; tested in `__tests__/ai-assist.test.ts` | OK. Matches the "rule-based + behavior-driven" decision. |
| Admin layout / `/admin/*` | Implemented & guarded | [app/admin/_layout.tsx](app/admin/_layout.tsx) wraps with `<AdminGate>` | None | OK — single best-protected area. |

---

## 5. Handover Documentation Gaps

`docs/handoff.md` is genuinely useful (env vars, run commands, walkthrough path, caveats). Gaps:

- **Admin promotion**: mentions `app_metadata.is_admin = true` but doesn't include the SQL or dashboard steps. New developer cannot make themselves admin without guessing.
- **Demo mode**: `EXPO_PUBLIC_DEMO_MODE=false` line is given, but the consequences of `true` are not. Add: "If `true`, the app shows seeded fake data from `src/lib/demo-mode.ts`. Never set this to `true` in a build for the client."
- **Dev quick login**: not mentioned. Should be: "Set `EXPO_PUBLIC_DEV_SIGNIN_*` only in your local `.env.local`; never commit them or include in any client build."
- **Storage buckets**: handoff mentions `avatars` and `videos` but not `post-images`, and doesn't specify the size/MIME limits each one needs. Add a table.
- **Database setup for a new developer**: there are no `supabase/migrations/` files, only `docs/schema-*.sql` run scripts. A new developer has to either connect to the existing project or run those SQLs in order. Document the order: `schema-profiles.sql` (slice 01), `schema-02-profiles-social.sql`, `schema-03-video-feed.sql`, `schema-discovery-featured.sql`, `schema-05-challenges.sql`, `schema-06-messaging.sql`, `schema-07-events.sql`, `schema-08-admin.sql`, `schema-13-posts.sql`. (The naming "schema-13" is a leftover from a feature ID, not slice 13.)
- **`is_admin` flag cache**: after promoting a user, they must sign out and back in to refresh the JWT. Document this — easy to miss.
- **Email confirmation**: is it on or off in the demo Supabase project? Document the chosen setting.
- **Google OAuth**: existing `docs/GOOGLE_OAUTH_SETUP.md` is good but doesn't cover the new `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED` flag in [app/auth/login.tsx:23](app/auth/login.tsx:23). When this is `false` (default), the Google button shows an inline error. Document.
- **Demo seed report**: `docs/demo-seed-report.md` exists but I did not read it during this audit — verify it's current.
- **Out-of-scope statement**: handoff has a "Known Caveats" section but doesn't restate the Phase 2/3 list. Add a one-paragraph "Not implemented" pointer to `specs/scope.md` §16.

---

## 6. Recommended Final Fix Pass

### Must fix now (before client handover)

1. **Commit + push everything to a release branch** so the deliverable is reproducible from git.
2. **Native session persistence** — wire AsyncStorage in [src/lib/supabase.ts](src/lib/supabase.ts).
3. **Guard `Dev Quick Login`** behind `__DEV__` and remove `EXPO_PUBLIC_DEV_SIGNIN_*` from any handover env file.
4. **Lock the `videos` bucket**: set 100 MB and `video/*` MIME types.
5. **Document admin promotion** SQL in `docs/handoff.md`.
6. **Add a strong demo-mode warning** in `docs/handoff.md` and/or guard demo branches behind `__DEV__`.
7. **Tighten the four PL/pgSQL functions**: `ALTER FUNCTION ... SET search_path = public;`.
8. **Revoke EXECUTE on `handle_new_user`** from anon/authenticated, or move it out of `public`.
9. **Enable Auth → Leaked password protection** in Supabase dashboard.
10. **Tighten `profile_views` SELECT** to owner-only OR replace with a count column / RPC.

### Nice to fix (still high-value, per [SOCA_CODE_ANALYSIS.md](docs/handover/SOCA_CODE_ANALYSIS.md))

11. Auth listener cleanup in `useAuthStore.initialize`.
12. Top-level routes wrapped in a single `<AppGate>` (auth + complete-profile).
13. `PostCard` like-count clamped to 0.
14. `useProfileById` strict demo isolation.
15. `Math.max`-clamp for negative counts in any other count derivations.
16. Replace `expo-image-picker` `MediaTypeOptions` (deprecated) with `MediaType`.
17. `avatars` bucket: drop the broad SELECT policies (advisor `0025`).
18. Replace blob-fetch upload pattern with base64 (avatar + video).
19. Add `expo-image-picker` to `app.json > expo.plugins`.

### Disclose only (no code change)

20. Slices 03–12 are uncommitted — disclose state of work.
21. Email-verify deep link works on web only.
22. Google OAuth needs dashboard setup before button works.
23. `expo-av` deprecation warning during web export.
24. Demo mode is a hidden switch, currently `false`.
25. 92 Supabase performance warnings — none are launch-blockers at current data volume.

### Future phase (out of MVP)

26. Realtime messages, push notifications, App Store / Play Store publishing, hosting/ops, payments, advanced AI, computer-vision analysis — explicitly Phase 2/3 per `specs/scope.md` §16.

---

## 7. Exact Prompts for Follow-up Agents

### Prompt 1 — Fix only Critical/High security & handover-blocking issues

> You are working in the SOCA mobile repo (`C:\Sola Files\Sola Old\soca-mobile`). Implement only the items below. Do not add features, do not refactor.
>
> 1. **Commit hygiene**: from a clean shell, run `git status`. Create branch `release/handover`, `git add -A`, and commit in logical chunks (one commit per slice grouping if practical, otherwise one commit). Push to origin. Do not merge into main.
> 2. **Native session persistence**: in [src/lib/supabase.ts](src/lib/supabase.ts), import `AsyncStorage` from `@react-native-async-storage/async-storage` (already installed) and pass it as `auth.storage` for native. Set `persistSession: true` and `autoRefreshToken: true` for both web and native. Keep `detectSessionInUrl: Platform.OS === 'web'`. Verify `npm run typecheck`.
> 3. **Dev Quick Login behind `__DEV__`**: in [app/auth/login.tsx:22](app/auth/login.tsx:22), change `const hasDevCredentials = Boolean(devEmail && devPassword);` to also require `__DEV__`. Remove `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` and `EXPO_PUBLIC_DEV_SIGNIN_PASSWORD` from `.env.local` before producing any handover build. Update `.env.example` to add a strong "DO NOT SET IN PRODUCTION" comment.
> 4. **Demo mode hardening**: in [src/lib/demo-mode.ts:13](src/lib/demo-mode.ts:13), change the export to `DEMO_MODE_ENABLED = __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE === 'true'`. Also add a top-of-file comment stating release builds will always have demo disabled. Run typecheck.
> 5. **Lock `videos` bucket**: using the Supabase MCP or dashboard, update bucket `videos` to `file_size_limit = 104857600` and `allowed_mime_types = ['video/mp4','video/quicktime','video/webm']`. Document in `docs/handoff.md`.
> 6. **Function search_path**: in Supabase SQL Editor, run `ALTER FUNCTION public.handle_new_user() SET search_path = public; ALTER FUNCTION public.handle_updated_at() SET search_path = public; ALTER FUNCTION public.set_updated_at() SET search_path = public; ALTER FUNCTION public.enforce_immutable_role() SET search_path = public;`. Re-run `mcp__supabase__get_advisors security` to confirm the four `function_search_path_mutable` lints are gone.
> 7. **Revoke RPC on `handle_new_user`**: `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;`. Re-run security advisor.
> 8. **Tighten `profile_views` SELECT**: `DROP POLICY IF EXISTS profile_views_select ON profile_views; CREATE POLICY profile_views_select ON profile_views FOR SELECT USING (auth.uid() = profile_id);`. Verify the profile screen still shows the view count (it computes via `count(*)` which the policy still permits when called by the owner; if used elsewhere, switch to a counter column or RPC).
> 9. **Leaked password protection**: enable in Supabase dashboard → Auth → Password Security. Note this in handoff docs.
> 10. **Document admin promotion**: append a section to `docs/handoff.md` with the SQL `UPDATE auth.users SET raw_app_meta_data = jsonb_set(...) WHERE email = ...;` and the note that the user must sign out + back in.
> 11. After all fixes, run `npm run verify` (`typecheck && lint && test`) and report any failures. Commit each fix as a separate commit on `release/handover`.

### Prompt 2 — Improve handover docs / setup docs

> Improve `docs/handoff.md` and create `docs/handover/SETUP.md` to make the project handoverable to a new developer with zero prior context. Do not change application code.
>
> 1. Rewrite `docs/handoff.md` so the order is: TL;DR status → Setup → Run → Verify → Supabase setup → Admin promotion → Storage buckets → Demo mode policy → Known caveats → Out-of-scope.
> 2. In **Supabase setup**, add a sequenced list of `docs/schema-*.sql` files to run in order for a fresh project: `schema-profiles.sql`, `schema-02-profiles-social.sql`, `schema-03-video-feed.sql`, `schema-discovery-featured.sql`, `schema-05-challenges.sql`, `schema-06-messaging.sql`, `schema-07-events.sql`, `schema-08-admin.sql`, `schema-13-posts.sql`. Note that the live project already has these applied as migrations.
> 3. Add a **Storage buckets** table: bucket name, public flag, size limit, allowed MIME types, key policies. Include the recommended `videos` bucket lock from Prompt 1.
> 4. Add an **Admin promotion** code block with the `UPDATE auth.users SET raw_app_meta_data = jsonb_set(...)` SQL and the sign-out/sign-in JWT-refresh note.
> 5. Add a **Demo mode** section: explain the env var, what it does, list the 8 service modules that branch on it, and state explicitly that `EXPO_PUBLIC_DEMO_MODE` MUST be unset (or `false`) in any client build.
> 6. Add a **Dev quick login** warning: `EXPO_PUBLIC_DEV_SIGNIN_*` are inlined into the JS bundle by Expo and must never be set in handover builds.
> 7. Add a **Known issues** subsection that pulls every Critical/High row from this audit and the prior `SOCA_CODE_ANALYSIS.md`.
> 8. Create `docs/handover/SETUP.md` with a fresh-machine walkthrough: clone, `npm install`, copy `.env.example` to `.env.local`, point at a Supabase project, run schema SQLs, promote yourself to admin, run `npm start`, smoke-test the walkthrough path from `docs/handoff.md`.
> 9. Do not invent state. If a step depends on a value the developer must look up (project URL, anon key), say so explicitly.

### Prompt 3 — Verify demo walkthrough readiness

> Verify the SOCA mobile demo end-to-end on a clean clone. Do not change code.
>
> 1. From a different directory, `git clone <release/handover branch>` and follow `docs/handover/SETUP.md` start-to-finish. If any step is unclear, write it down — that's the deliverable for this prompt.
> 2. `npm install`, set up `.env.local` (`EXPO_PUBLIC_DEMO_MODE=false`, `EXPO_PUBLIC_DEV_SIGNIN_*` UNSET), `npm run verify`, then `npm start`.
> 3. Walk the path from `docs/handoff.md > Client Walkthrough Path` step by step. Record pass/fail per step on web (`w`) and on a native dev build (`a` or `i`). Pay special attention to:
>    - Step "Restart app" — confirm session persists on native after Prompt-1 fix #2.
>    - Step "Open Admin" — confirm admin promotion works after promoting yourself in step 1.
>    - Step "Sign in with Google" — either configure dashboard or skip and note "not configured".
> 4. Verify avatar upload writes a non-zero file (download from Supabase storage and confirm size > 0).
> 5. Verify video upload writes a non-zero file and plays back.
> 6. Produce `docs/handover/DEMO_VERIFICATION_REPORT.md`: environment, pass/fail rows, recommendation (SHIP / SHIP WITH CAVEATS / DO NOT SHIP).

---

## Audit notes — what I verified vs. what I did not

**Verified live (via Supabase MCP):**
- All 17 `public` tables exist with RLS enabled.
- Every committed RLS policy was read back and reviewed.
- All 11 migrations are applied.
- All four PL/pgSQL functions and the four triggers were dumped and read.
- All three storage buckets and their 10 policies were read.
- 7 auth users; 1 admin via `app_metadata.is_admin`; 6 confirmed.
- Security advisors: 9 lints (4 mutable search-path, 1 extension-in-public, 1 public-bucket-listing, 2 SECURITY DEFINER exposure, 1 leaked-password protection off).
- Performance advisors: 92 lints (perf, not security).

**Verified in repo (working tree, including uncommitted files):**
- All code referenced by file paths in this report was read at audit time.
- `.env.example` (committed) and `.env.local` (gitignored) were read; sensitive values redacted from this report.
- 13 slice files (00–12) all marked `Status: DONE`.

**Not verified:**
- I did not run the app locally on a device or emulator. No physical test of native session persistence, avatar/video byte counts, or Google OAuth flow.
- I did not run `npm run typecheck`, `npm run lint`, or `npm test`.
- I did not query `auth.audit_log_entries` or other auth-side data; not necessary for this audit but available if needed.
- The earlier `docs/handover/SOCA_CODE_ANALYSIS.md` claims (auth listener leak, like-count math, route gating gaps) were spot-checked against current code but not exhaustively re-verified; flagging them inherits its accuracy.

If anything in this report should be confirmed by re-reading specific code or rerunning a Supabase query, ask and I'll re-verify.

---

## 8. Post-Fix Status (2026-05-05)

A focused stabilization pass has been applied to the repo. Verification: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓ (17/17). No app code has been deleted; no RLS policies have been weakened; no new features added.

### 8.1 Fixed in this repo

| # | Severity | Finding | What was changed | Files |
|---|---|---|---|---|
| 1 | Critical | Native session persistence broken | Wired `@react-native-async-storage/async-storage` as the auth `storage` adapter on native. Set `persistSession: true` and `autoRefreshToken: true` on both platforms; `detectSessionInUrl` remains web-only. | [src/lib/supabase.ts](src/lib/supabase.ts) |
| 2 | High | `onAuthStateChange` subscription leak | Captured the subscription, added a `dispose()` action on the auth store, and called it from `RootLayout`'s effect cleanup. `initialize()` is now idempotent (guarded by a module-level flag). | [src/store/auth.ts](src/store/auth.ts), [app/_layout.tsx](app/_layout.tsx) |
| 3 | Critical | Demo mode is a global ungated switch | `DEMO_MODE_ENABLED` now also requires `__DEV__`. Release builds ignore the env var. Top-of-file comment explains the gate and its intent. | [src/lib/demo-mode.ts](src/lib/demo-mode.ts) |
| 4 | Critical | `Dev Quick Login` button shipped credentials in any build | Double-gated: `__DEV__` AND both env vars must be set. In release builds the env reads return `undefined` and the button cannot render. `.env.example` rewritten with strong "do not set in handover builds" warnings. | [app/auth/login.tsx](app/auth/login.tsx), [.env.example](.env.example) |
| 5 | Critical | `videos` bucket has no size/MIME limit | Added `docs/schema-storage-buckets.sql` — an idempotent script that sets size + MIME limits for `avatars` (2 MB), `post-images` (5 MB), and `videos` (100 MB, mp4/mov/webm). **Must be run in Supabase SQL Editor against the live project** to take effect — see §8.2. | [docs/schema-storage-buckets.sql](docs/schema-storage-buckets.sql) (new) |
| 6 | High | `/feed` falls back to `'player'` role for any non-player user | Now redirects to `/welcome` when signed-out and to `/onboarding/role` when role is missing, instead of silently rendering the player home. | [app/feed.tsx](app/feed.tsx) |
| 7 | High | `signInWithGoogle` silently does nothing on cancel / non-success | Throws on missing tokens and non-success result types (cancel/dismiss return cleanly without error). Login screen already calls `setError` on throw. | [src/store/auth.ts](src/store/auth.ts) |
| 8 | High | Negative like-count possible in `PostCard` | Clamped with `Math.max(0, ...)`. Comment explains why. | [src/components/feed/PostCard.tsx](src/components/feed/PostCard.tsx) |
| 9 | High | Demo `useProfileById` falls through to live Supabase | When demo mode is on AND profileId matches the current user OR a `demo-*` id, the hook now returns the demo seed (or null) and never calls live Supabase for that branch. | [src/hooks/useProfileById.ts](src/hooks/useProfileById.ts) |
| 10 | Medium | `recordVideoView` records anonymous views | Now early-returns when no user is signed in. Still anonymous-permitted by RLS, but the app no longer triggers it. | [src/lib/videos.ts](src/lib/videos.ts) |
| 11 | Medium | `expo-image-picker` not declared in `app.json > plugins` | Added the plugin block with `photosPermission` so iOS dev/release builds get `NSPhotoLibraryUsageDescription`. | [app.json](app.json) |
| 12 | Medium | Stale "do not rely on triggers" comment in `schema-profiles.sql` | Comment updated to reflect that profile creation IS via the live `on_auth_user_created` trigger; client upsert is a defensive fallback. | [docs/schema-profiles.sql](docs/schema-profiles.sql) |

### 8.2 Live Supabase actions

Items A–C have been **applied via Supabase MCP** (`mcp__…apply_migration`) and verified. Items D–H still require a human action (dashboard toggle, smoke-tested SQL, or process work).

| # | Severity | Action | Status |
|---|---|---|---|
| A | Critical | Lock storage bucket size/MIME limits (`videos` → 100 MB / mp4-mov-webm). | **APPLIED 2026-05-05** as migration `20260505193320_lock_storage_buckets_size_and_mime`. Verified live: `videos` bucket now `file_size_limit=104857600`, `allowed_mime_types={video/mp4,video/quicktime,video/webm}`. |
| B | High | `ALTER FUNCTION ... SET search_path = public, pg_catalog;` on `handle_new_user`, `handle_updated_at`, `set_updated_at`, `enforce_immutable_role`. | **APPLIED 2026-05-05** as migration `20260505193334_harden_function_search_paths`. Verified live: all four functions have `proconfig = ['search_path=public, pg_catalog']`. Security advisor confirms the four `function_search_path_mutable` lints are gone. |
| C | High | `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;` | **APPLIED 2026-05-05** as migration `20260505193347_revoke_handle_new_user_rpc_exposure`. Verified live: `has_function_privilege('anon'/'authenticated', oid, 'execute') = false`. Security advisor confirms both `*_security_definer_function_executable` lints are gone. The trigger continues to fire normally. |
| D | High | **Enable Auth → Settings → Leaked password protection** in the Supabase dashboard. One toggle. Closes the `auth_leaked_password_protection` lint. | **MANUAL — not exposed via SQL/MCP.** Supabase does not expose password-policy settings via the API; this is a dashboard-only setting under Authentication → Sign In / Providers → Password. |
| E | Medium | Tighten `profile_views` SELECT + expose a count RPC. | **APPLIED 2026-05-05** in two migrations:<br>• `profile_views_owner_only_with_count_rpc` — created `public.get_profile_view_count(uuid)` (SECURITY DEFINER, STABLE, bounded search_path), EXECUTE → anon+authenticated. Replaced the broad SELECT policy with `USING (auth.uid() = profile_id)`.<br>• `profile_views_self_history_and_batch_count_rpc` — added a second permissive SELECT policy `USING (viewer_id = auth.uid())` so users can still see their OWN viewer history (used by [src/lib/discovery.ts](src/lib/discovery.ts) recommendation signals). Added batch RPC `public.get_profile_view_counts(uuid[])` so Discover popularity ranking can compute per-profile counts in one round-trip. Updated [src/hooks/useProfileById.ts](src/hooks/useProfileById.ts) and [src/lib/discovery.ts](src/lib/discovery.ts) to call the RPCs. **Note:** the two RPCs trip `*_security_definer_function_executable` advisor lints — accepted by design (see §8.6). |
| F | Medium | Drop broad `avatars_read_anon` / `avatars_read_authenticated` policies on `storage.objects`. | **APPLIED 2026-05-05** as migration `20260505*_drop_avatars_broad_listing_policies`. Avatar URLs are still served via `getPublicUrl()` (public bucket); listing is no longer possible. Closes the `public_bucket_allows_listing` advisor lint. |
| G | Critical (process) | Commit and push the working tree. | **DONE LOCALLY 2026-05-05.** All 144 changes (slices 03–12 + the stabilization pass + new docs) committed on branch `release/handover` as `feat: slices 03-12 + handover stabilization pass`. Branch is ahead of `main` by one commit. **Push to remote (`git push -u origin release/handover`) is the next manual step** — it requires your credentials. |
| H | Manual | Remove `EXPO_PUBLIC_DEV_SIGNIN_EMAIL` / `_PASSWORD` from `.env.local`. | **DONE 2026-05-05.** Both lines commented out with a "DISABLED FOR HANDOVER" warning. `EXPO_PUBLIC_DEMO_MODE=false` retained with the same warning. Verified: `expo lint` now exports only the live `EXPO_PUBLIC_*` vars. |

### 8.3 Remaining caveats (not blocking handover)

- Email-verification redirect uses `window.location.origin` which is `undefined` on native. Disable email confirmation on the demo Supabase project for the walkthrough, or build a deep-link handler later. (Mentioned in `docs/handoff.md`.)
- 92 Supabase performance advisor warnings (43 RLS init-plan, 18 multiple permissive policies, 18 unused indexes, 13 unindexed FKs). Perf only; data is currently empty.
- `expo-av` is deprecated in SDK 54 and is still used for video playback. Will need replacement with `expo-video` in a future Expo upgrade. (Already disclosed in `docs/handoff.md`.)
- Top-level routes outside role groups (`/explore`, `/discover`, `/upload/video`, `/messages*`, `/me*`, `/profile/[id]`, `/video/[id]`, `/report/new`, `/challenges`, `/events*`) are still not behind a single auth gate. `/feed` is now safe; the rest were not modified to keep this pass minimal. They throw "Not authenticated" on direct deep-link while signed-out — disclose, or add gates in a future pass.
- Image / video uploads still use `fetch().blob()`, which can produce zero-byte uploads on native. Recommend testing on a physical device before the demo; if files are zero-byte, switch to a base64+`decode` pattern.
- `auth.user.id`–derived demo "self" follower/like state is module-level and resets on reload. Documented in `SOCA_CODE_ANALYSIS.md`. Still a caveat.

### 8.4 Verification

```
npm run typecheck   ✓
npm run lint        ✓
npm test            ✓ (17/17 across 7 suites)
```

I did not run `expo start` or build a native app; that requires a device/emulator and is out of scope for this pass.

### 8.5 Readiness verdict after this pass

**READY WITH CAVEATS.** All seven SQL/code items (A, B, C, E, F, plus the stabilization fixes and code/doc work) have been **applied to the live Supabase project and committed locally**. Two items remain as a human checklist:

1. **Push `release/handover` to GitHub** so the client URL reflects the work: `git push -u origin release/handover`.
2. **Enable Auth → Leaked password protection** in the Supabase dashboard (item D — not exposed via SQL/MCP).

Security advisor delta: **9 lints → 4 lints**. Closed permanently: 4× `function_search_path_mutable`, 1× `public_bucket_allows_listing` (avatars). The `handle_new_user` RPC-exposure pair was closed; an equivalent pair now fires on the new `get_profile_view_count` RPC and is accepted by design (see §8.6).

### 8.6 Accepted advisor lints (intentional, documented)

| Lint | Detail | Why accepted |
|---|---|---|
| `extension_in_public` | `citext` extension lives in `public` | Moving requires recreating the `username` column with the relocated type. Low risk; no exploit known. |
| `anon_security_definer_function_executable` (`get_profile_view_count`, `get_profile_view_counts`) | RPCs callable by anon | Required: profile pages and Discover must surface view counts without exposing `viewer_id`. Both RPCs return only counts; no PII leak. |
| `authenticated_security_definer_function_executable` (same) | Same for authenticated | Same reason. |
| `auth_leaked_password_protection` | Disabled | Dashboard toggle (item D) — not exposed via SQL. |

