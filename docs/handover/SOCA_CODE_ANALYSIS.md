# SOCA Code Analysis Report

_No application code was modified for this audit. Findings are read-only and evidence-based._

## 1. Executive Summary

- **Overall code readiness:** READY WITH CAVEATS
- The app is structured well at the route/role level (Expo Router groups, TanStack Query, Zustand). Most user flows have a recognisable code path with reasonable empty / error states.
- However, several real correctness and resilience issues exist that will bite during a real (non-demo) handover and on native devices.

### Top 5 code risks

1. **Supabase session is not persisted on native.** `src/lib/supabase.ts:21` sets `persistSession: Platform.OS === 'web'` and there is no `@react-native-async-storage/async-storage` adapter wired in. Native users will be signed out every cold start, even though the dependency is installed.
2. **Auth listener registration leaks.** `useAuthStore.initialize()` (`src/store/auth.ts:65`) calls `supabase.auth.onAuthStateChange(...)` but never returns/unsubscribes the subscription. Multiple invocations (e.g. fast refresh, repeated tab mounting) stack handlers, each running `fetchProfile` and `set(...)` calls.
3. **Many top-level routes have no auth/role gate.** `/feed`, `/explore`, `/discover`, `/upload/video`, `/messages*`, `/challenges*`, `/events*`, `/profile/[id]`, `/video/[id]`, `/me*`, `/report/new`, `/admin/*` apart from `app/admin/_layout.tsx`. Only `(player|scout|club|org)/` and `/admin` are gated. An unauthenticated or incomplete-profile user can visit these directly and hit "Not authenticated" exceptions or render with `profileId=undefined`.
4. **Like-count math can render negative numbers.** `src/components/feed/PostCard.tsx:27` computes `post.like_count + (isLiked ? 1 : 0) - (post.is_liked ? 1 : 0)`. If a server-side liked post has `like_count == 0` (race / stale) and the user un-likes, the UI displays `-1 Likes`.
5. **Demo-mode and live-mode are decided at module load and not reconcilable at runtime.** `DEMO_MODE_ENABLED` (`src/lib/demo-mode.ts:13`) is captured into a module constant. Switching modes needs an app rebuild. In demo mode many hooks still hit real Supabase when the current user id is not a `demo-*` id (e.g. `useProfileById`), producing inconsistent results and confusing demo failures.

### Most fragile flows

- **Auth + onboarding state machine** (split across `app/index.tsx`, `app/_layout.tsx`, `RoleGate`, `AdminGate`, `useAuthStore.initialize/fetchProfile`). Logic is duplicated 3+ times; profile creation has retry but the listener can race the boot path.
- **Feed timeline** (`HomeScreen` -> `FeedTimeline` -> `usePosts` -> `listFeedPosts`). Heavy demo-mode branching, virtual-video synthesis, and broad `invalidateQueries(['posts'])` on every like.
- **Profile screen** (`ProfileScreenContent.tsx`, 705 lines). Handles public + tab modes, follow, message, recordProfileView, multiple data sources.
- **Messaging** (`messages.ts`, `[conversationId].tsx`). Manual `or(...)` filter for participant lookup, no realtime updates, demo + live IDs intermingle.

### Most confusing areas for the next developer

- `src/lib/demo-mode.ts` (1,397 lines) – mixes seeds, in-memory mutation state, and pure helpers; demo profile id detection (`isDemoProfileId`) is regex-based and fragile.
- Six `isMissingRelationError(...)` definitions in different files (`admin.ts`, `posts.ts`, `videos.ts`, `messages.ts`, `discovery.ts`, `challenges.ts`, `events.ts`).
- Widespread `as Href`, `as Profile`, `as RawRow` casts; the `Profile` type and `Database` row types are not auto-generated, so service code regularly bypasses TypeScript.

### Are code changes recommended before handover?

**Yes – but scoped.** Persisting native sessions, gating top-level routes, fixing like-count math, and de-duplicating the auth state machine are the minimum bar. Most other findings can be documented and deferred.

---

## 2. Critical and High Findings

| Severity | Area | Finding | File(s) | Trigger | Recommended action |
|---|---|---|---|---|---|
| Critical | Auth / persistence | Native sessions never persist; `persistSession: Platform.OS === 'web'`, no AsyncStorage adapter despite dep installed. | `src/lib/supabase.ts:19-25`, `package.json:18` | Cold start any iOS/Android build. | Configure Supabase with `AsyncStorage` and set `persistSession: true` everywhere. |
| Critical | Auth state | `onAuthStateChange` subscription never unsubscribed in `initialize`. Handler stacks on repeat calls; each handler kicks `fetchProfile` and `set(...)`. | `src/store/auth.ts:65-81`, `app/_layout.tsx:31-33` | Fast refresh, multiple `RootLayout` mounts, repeated `initialize()` invocation. | Capture `data.subscription` and dispose on unmount; guard `initialize` with an "already initialised" flag. |
| Critical | Routing / gating | Top-level routes are not behind a session/profile gate (only role-group routes and `/admin` are). Many actions throw "Not authenticated" when accessed cold. | `app/feed.tsx`, `app/explore.tsx`, `app/discover.tsx`, `app/upload/video.tsx`, `app/messages/*`, `app/challenges/*` (only `submit.tsx` gates), `app/events/*`, `app/profile/[id].tsx`, `app/video/[id].tsx`, `app/me/_layout.tsx`, `app/report/new.tsx` | Any direct deep link / browser refresh while signed-out or profile-incomplete. | Add a single `<AuthGate>`/`<ProfileCompleteGate>` at a shared layout boundary (e.g. group route under `(app)/`) and move these screens inside. |
| High | Routing fallback | `/feed` falls back to a `'player'` role when `profile?.role` is undefined. A scout/club/org with role missing renders the player home, including "upload highlight" CTA. | `app/feed.tsx:5-8` | Logged-in user without role visits `/feed` (e.g. via deep link). | Redirect to `/onboarding/role` instead of guessing a role. |
| High | UI correctness | Like-count can render negative; relies on the assumption `post.like_count >= 1` whenever `post.is_liked` is true. | `src/components/feed/PostCard.tsx:27` | Server returns `is_liked=true`, `like_count=0` (race or count not yet committed) and user unlikes. | Compute `Math.max(0, ...)` or derive purely from a single source of truth (server count + local optimistic delta). |
| High | Auth flow | Google sign-in silently does nothing when `WebBrowser.openAuthSessionAsync` returns `cancel`/`dismiss`/no tokens; no user feedback, login screen sits idle. | `src/store/auth.ts:232-266` | User cancels Google flow, or Supabase returns tokens via query rather than hash. | Surface non-success results as a thrown error so the caller can `setError`. |
| High | Mode mixing | In demo mode, `useProfileById` falls through to `fetchProfileWithCounts(profileId!)` (real Supabase) when `getDemoProfileById` returns null for the current user. | `src/hooks/useProfileById.ts:64-81` | Demo build with a real Supabase user id whose profile doesn't exist in demo seed. | When `DEMO_MODE_ENABLED`, never hit real Supabase – return a synthesised current-user profile. |
| High | Mode mixing | Demo-state Maps (`demoFollowState`, `demoLikeState`, `demoTextPosts`, etc.) are module-level and reset on reload. Demo data is also keyed by the live `auth.uid()`, so signing out / in invalidates state silently. | `src/lib/demo-mode.ts:446-451`, `posts.ts:16-18` | Demo run, user signs out and back in, or app reloads. | Make this explicit (label "session-only demo state") and consider persisting via AsyncStorage if demo is to survive reloads. |
| High | Cache freshness | Like-status query uses `initialData: initialLiked`. With `staleTime: 5min` (`src/lib/query.ts`), the query never refetches in background; UI relies on optimistic invalidation only. | `src/hooks/usePostLikeStatus.ts:9-14`, `src/lib/query.ts:7` | Multi-device / multi-tab usage; like state stale for up to 5 minutes. | Use `placeholderData` instead of `initialData`, or set `staleTime: 0` for like-status queries. |
| High | Auth gating | `app/me/_layout.tsx` is a bare `<Stack>` with `headerShown: true`. /me, /me/edit-profile, /me/followers, /me/following are not gated. Visiting unauthenticated leaves spinners forever (currentUserId undefined → `enabled: false`). | `app/me/_layout.tsx:1-6`, `app/me/index.tsx`, `app/me/edit-profile.tsx`, `app/me/followers.tsx`, `app/me/following.tsx` | Sign-out then deep-link `/me`. | Add an auth gate at the layout level. |
| High | Routing | `RoleGate` returns `null` (blank screen) while `profileStatus === 'loading'`; not all role homes show their own loader, so users see a flash of black. | `src/components/auth/RoleGate.tsx:22-24`, `src/components/auth/AdminGate.tsx:15-17` | Cold start on any role home page. | Render a small spinner placeholder in the gates. |
| High | Profile error path | `fetchProfile` retries upsert once via `profileCreationAttempted`; if upsert succeeds but the immediate refetch returns `PGRST116` (RLS race), state lands on `profileStatus: 'error'` with no automatic retry. | `src/store/auth.ts:148-207` | RLS lag after row creation. | Treat the post-upsert refetch miss as a transient state; retry once with backoff before surfacing the error screen. |
| High | Data correctness | `recordVideoView` inserts a row on every mount of `/video/[id]` while signed-out (RLS likely fails, but error is swallowed by `.catch(() => {})`). | `app/video/[id].tsx:21-27`, `src/lib/videos.ts:383-399` | Anonymous user opens a video. | Skip when no user or no permission, log non-RLS errors. |

---

## 3. Flow-by-Flow Review

### 3.1 Authentication & Onboarding
- **Status:** Working in demo, fragile in production.
- **Main files:** `src/store/auth.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/auth/{login,signup,callback}.tsx`, `app/onboarding/{role,profile-setup}.tsx`, `app/profile-error.tsx`, `RoleGate`, `AdminGate`.
- **Risks found:**
  - Native session persistence broken (Critical, see §2).
  - Listener leak in `initialize` (Critical, see §2).
  - Auth/profile gating is duplicated three times (`index.tsx`, `RoleGate`, `AdminGate`); divergent behaviour likely.
  - Email-verification path on signup: if Supabase requires email confirmation, `signUp` returns no session and the screen shows "Account created" but the user is left on the signup page – there's no clear "open email" CTA, and on web the redirect URL only resolves on the same origin.
  - `signInWithGoogle` parses tokens from URL hash only; web uses `auth/callback` separately, so the two paths can drift.
- **Recommended action:** Centralise the state machine in one component (e.g. `<AppRoutingGate>`) and call it from a single layout.

### 3.2 Role-based home routing
- **Status:** Works; thin role layouts call `<RoleGate><Stack/>` and `home/index.tsx` is `<HomeScreen role=... />`.
- **Risk:** `app/feed.tsx` provides a non-role-gated alias and falls back to `'player'`. (High, see §2.)
- **Recommended action:** Either remove `/feed` or redirect to the role-specific home.

### 3.3 Profile setup & editing
- **Status:** Mostly fine.
- **Files:** `app/onboarding/profile-setup.tsx`, `app/me/edit-profile.tsx`, `src/lib/profile-form.ts`, `src/store/auth.ts:updateProfile`, `src/lib/avatars.ts`.
- **Risks:** `getProfileFormDefaults(profile)` is called once at mount; a profile that finishes loading later won't repopulate the form (defaultValues are not reactive). Players who land on edit-profile before profile is hydrated will see empty defaults.
- **Recommended action:** Reset form via `useForm({...})` `reset()` once `profile` is available, or guard the screen until `profile` is loaded.

### 3.4 Feed / posts / highlights
- **Status:** Demo path works; live path is functional but coupling-heavy.
- **Files:** `app/(role)/home/index.tsx`, `src/components/home/HomeScreen.tsx`, `src/components/feed/{FeedTimeline,PostCard}.tsx`, `src/lib/posts.ts`, `src/lib/videos.ts`, `usePosts`, `usePostLikeStatus`.
- **Risks:**
  - Negative like-count math (High, see §2).
  - `usePosts` is broadly invalidated on follow/like/upload (`['posts']`, `['videos']`, `['discover']`, `['explore']`); refetches across screens are heavy.
  - `posts.ts` mixes demo state, virtual video posts, image uploads – over 580 lines in one module.
  - Image post uses `expo-image-picker` `MediaTypeOptions.Images` which is deprecated in Expo SDK 54 (see also `videos.ts:343`). Will produce a deprecation warning and may break in a future Expo upgrade.
- **Recommended action:** Split `posts.ts` into `posts.read.ts` / `posts.write.ts` / `posts.demo.ts`. Replace `MediaTypeOptions` with `MediaType`.

### 3.5 Likes / views / follows
- **Status:** Functional. Signal collection for feed ranking and discovery is implemented in `src/lib/ai-assist.ts`.
- **Risks:**
  - `recordVideoView` swallows all errors; metrics may be silently zero.
  - `usePostLikeStatus` initial-data caching keeps stale state for `staleTime` (High, see §2).
- **Recommended action:** Distinguish between optimistic UI delta and server count; only re-derive once on success.

### 3.6 Messaging
- **Status:** Demo path solid; live path missing realtime, manual normalization is verbose.
- **Files:** `src/lib/messages.ts`, `src/hooks/useMessages.ts`, `app/messages/{index,[conversationId]}.tsx`.
- **Risks:**
  - No realtime / pub-sub – users only see new messages on refetch.
  - `[conversationId].tsx` runs `markConversationRead` in an effect that only depends on `data?.unread_count`. If the unread count is 0 from the seed, but new unread arrives via refetch, the effect re-runs, fine; but rapid mounts can race.
  - `getOrCreateConversation` uses an `or(and(...),and(...))` filter – sensitive to PostgREST escaping changes.
  - Self-conversation prevention only via thrown error after request.
- **Recommended action:** Add a Supabase `channel('messages')` subscription, document realtime expectations, and validate sender id at insert time via RLS.

### 3.7 Discovery / Explore
- **Status:** Works. Heavy demo path, recommendation logic in `discovery.ts` + `ai-assist.ts`.
- **Risks:**
  - `listAllDiscoveryProfiles` paginates 200 rows at a time but loops indefinitely – without RLS or filters this could drag in tens of thousands of profiles for a "popular" or "recommended" sort.
  - `buildDiscoverySearchClause` escapes some characters but doesn't escape `*`, `&`, single quotes; PostgREST `or(...)` syntax can break on edge inputs.
- **Recommended action:** Cap the recommended/popular candidate pool (`MAX_CANDIDATES`) or use a server-side RPC.

### 3.8 Challenges / Leaderboards
- **Status:** Working. Submission flow is gated by `RoleGate` on player.
- **Files:** `app/challenges/index.tsx`, `app/challenges/[id]/{index,leaderboard,submit}.tsx`, `src/lib/challenges.ts`, `useChallenges`.
- **Risks:**
  - `app/challenges/index.tsx` is not auth-gated.
  - `submitChallengeVideo` checks role then refetches challenge for `is_open`; the demo path doesn't enforce open-window.
- **Recommended action:** Wrap `app/challenges/_layout` in auth gate.

### 3.9 Events
- **Status:** Working. `setEventInterested` handles duplicate-key error code 23505.
- **Risks:** Event detail/list screens are not auth-gated. Date parsing uses `Date.parse` with `event_date || date || starts_at` – inconsistent column naming across schema files.
- **Recommended action:** Settle on one event date column; document the legacy column fallback.

### 3.10 Reports / Moderation / Admin
- **Status:** Working. Admin layout uses `AdminGate` correctly.
- **Risks:**
  - `app/report/new.tsx` is not auth-gated; an unauthenticated user can land here from a deep link, type a reason, and submit – `createReport` will throw.
  - `isSessionAdmin` reads `app_metadata.is_admin`; flag must be set server-side. Documented in `admin.ts` but not in handover docs.
  - `getAdminOverview` mishandles the case where `featured_items`/`profile_achievements` exist but RLS denies SELECT (`code: 42501`). Only `42P01`/`42703` are treated as missing.
- **Recommended action:** Auth-gate `/report/new` and surface a "sign in to report" UI. Add the admin flag instructions to `docs/handoff.md`.

---

## 4. State Management & Data Fetching Review

### Zustand store (`src/store/auth.ts`)
- One large store handles both Supabase calls and UI state (`loading`, `pendingEmailVerification`).
- `initialize` mixes initial fetch and listener registration without cleanup (Critical, see §2).
- `signOut` does redundant set calls because the auth listener also clears state.
- `updateProfile` only sets columns that are passed; it manually constructs a `Record<string, unknown>` and bypasses the typed `Profile` shape.

### TanStack Query
- One global `QueryClient` (`src/lib/query.ts`) with 5-minute `staleTime`. There's no `gcTime` override and no error/retry configuration per-mutation.
- Invalidation is broad and inconsistent (e.g. `['posts']` vs `['posts', 'feed', limit]`). Some mutations invalidate `['discover']`, `['explore']`, `['videos']`, `['posts']`, `['profile']` in one go.
- `usePostLikeStatus` uses `initialData` (cache poison) instead of `placeholderData`.
- No optimistic update for follow/like/event-interest – every action waits for the refetch.

### Service / API call issues
- 7 redefinitions of `isMissingRelationError`.
- `auth.getUser()` is called inside many service functions; each call is a network hit. Could read from session in store directly (lower latency, fewer rate limits).
- `recordProfileView` is fire-and-forget and returns `void`, so failures are invisible.
- Error swallowing: `app/video/[id].tsx:24-26`, `posts.ts` like errors when relation missing, etc. Acceptable for "table not yet created" schema-staging, but masks production errors.

### Error handling gaps
- Several screens convert errors to `Alert.alert` / `window.alert` directly instead of using the in-app `StateCard`.
- `messages.ts` `getMissingSchemaError()` references SQL files in error text that ship to end users.

---

## 5. TypeScript & Data Model Issues

### Unsafe types
- `Record<string, unknown>` (`RawRow`) is used as the universal API row type; many `as Profile`, `as Video`, `as ChallengeSubmission[]` casts on the result of `supabase.from(...).select('*')`.
- `as Href` casts in routing – Expo Router supports typed routes; the cast is opt-out.
- `useProfileById` returns `ProfileWithCounts | null` but the consumer asserts `as ProfileWithCounts` (`ProfileScreenContent.tsx:172`).

### Mismatched models
- `Profile.created_at`/`updated_at` are typed as non-nullable strings, but `fetchProfile` upserts with manually generated ISO strings; no compile-time guarantee server returns those columns.
- `Video` has `playback_url` only on `VideoWithCounts`; some demo paths build `VideoWithCounts` shapes manually with optional fields (e.g. `thumbnail_url` cast in `getVideoThumbnailUri` callsites).

### Duplicated interfaces
- `PostOwnerProfile`/`ProfilePreview` overlap with `Pick<Profile, ...>`.
- Multiple `RawRow` types redeclared per file.
- `EventRecord` duplicates fields with `EventPreview` and `Event`.

### Risky assumptions
- `useChallengeVideos` calls `listChallengeVideosForCurrentUser` but the screen displays them under "YOUR HIGHLIGHTS" without verifying ownership match; in demo mode `listDemoChallengeVideos` simply lists demo profile videos.
- `Profile.role` is nullable but multiple consumers use `profile.role!` style narrowing only after a previous null check that may be stale.

---

## 6. Maintainability Review

### Dead / duplicated code
- 7× `isMissingRelationError` (see §4).
- `app/feed.tsx`, `app/explore.tsx`, `app/discover.tsx` are thin alias screens that risk drift – keep them or delete them, but document.
- `getCurrentUserId` redefined in `posts.ts`, `videos.ts`, `discovery.ts` etc.

### Overloaded files
- `src/lib/demo-mode.ts` – 1,397 lines.
- `src/components/profile/ProfileScreenContent.tsx` – 705 lines, mixes hero, tabs, follow/message actions, sign-out.
- `src/lib/admin.ts` – 687 lines covering challenges, events, reports, featured items, verification.
- `src/lib/posts.ts` – 581 lines.
- `src/lib/discovery.ts` – 817 lines.

### Naming issues
- `EventRecord` vs `Event` vs `EventPreview` – three near-identical shapes.
- `VideoWithCounts.thumbnail_url` referenced via a cast literal `(video as VideoWithCounts & { thumbnail_url?: string | null })` in two places; either add it to the type or remove.
- `StatAction`, `ConversationRow`, `ExploreProfileCard` are inline render helpers that would be easier to find as siblings.

### Suggested refactors
- Extract `isMissingRelationError` and the various schema-error helpers to a single `src/lib/db-errors.ts`.
- Extract a single `<AppGate>` (auth + profile + role) and apply it via a route group such as `app/(authed)/_layout.tsx`.
- Move demo state out of `demo-mode.ts` into `demo/state.ts`, seeds into `demo/seeds.ts`, and the public API into `demo/index.ts`.
- Extract `ProfileHero`, `ProfileTabs`, `SignOutCard` from `ProfileScreenContent`.
- Replace `process.env.EXPO_PUBLIC_*` checks scattered across files with a single `src/lib/env.ts` exporting typed flags.

---

## 7. Suggested Final Code Fix Pass

### Must fix before handover
1. Add Supabase AsyncStorage adapter and `persistSession: true` for native (`src/lib/supabase.ts`).
2. Capture and dispose of the `onAuthStateChange` subscription in `useAuthStore.initialize` (`src/store/auth.ts`).
3. Wrap top-level signed-in routes (`/feed`, `/explore`, `/discover`, `/upload`, `/messages`, `/me`, `/profile`, `/video`, `/report`, `/challenges`, `/events`) in a shared auth + complete-profile gate.
4. Fix the negative like-count math in `PostCard.tsx`.
5. Hard-stop demo mode from falling through to live Supabase in `useProfileById` and any other hook that mixes the two.

### Good to fix if time allows
- Replace `initialData` with `placeholderData` in `usePostLikeStatus`.
- Show error feedback when `signInWithGoogle` returns non-success.
- Skip `recordVideoView` for anonymous users; log non-RLS errors.
- Wrap `app/report/new.tsx` and `app/challenges/index.tsx` in auth gates.
- Replace deprecated `ImagePicker.MediaTypeOptions` usage.
- Consolidate `isMissingRelationError`, `getCurrentUserId`, schema-error helpers.

### Safe to defer
- Splitting large files (`demo-mode.ts`, `admin.ts`, `posts.ts`, `ProfileScreenContent.tsx`).
- Replacing `as Href` / `as RawRow` casts with typed routes / schema-derived types.
- Adding realtime subscriptions to messages.

### Just document
- That demo mode resets on reload and uses module-level Maps.
- That admin promotion is via Supabase `app_metadata.is_admin = true`.
- That dev quick-login is gated by `EXPO_PUBLIC_DEV_SIGNIN_*` env vars and must be unset in any production build.
- That email-verification path leaves the user on the signup screen with a `StateCard` and no auto-redirect.

---

## 8. Follow-up Agent Prompt

> You are a senior React Native / Expo engineer. Working in this repo (`soca-mobile`), implement only the Critical and High issues identified in `docs/handover/SOCA_CODE_ANALYSIS.md`. Do not refactor anything outside their scope. Do not split files. Do not change UI styling.
>
> Required fixes:
>
> 1. **Supabase native session persistence.** In `src/lib/supabase.ts`, configure `createClient` with `auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: Platform.OS === 'web' }` using `@react-native-async-storage/async-storage` (already installed). Verify with a typecheck.
>
> 2. **Auth listener cleanup in store.** In `src/store/auth.ts`, capture the subscription returned by `supabase.auth.onAuthStateChange(...)` and dispose it. Make `initialize` idempotent (no-op if already initialised) and expose a `dispose` action used during sign-out.
>
> 3. **Shared route gate.** Introduce a single layout that runs the same checks `RoleGate` runs (session, `profileStatus`, profile complete) and apply it to: `app/feed.tsx`, `app/explore.tsx`, `app/discover.tsx`, `app/upload/video.tsx`, `app/messages/_layout.tsx` (create if missing), `app/me/_layout.tsx`, `app/profile/[id].tsx`, `app/video/[id].tsx`, `app/report/new.tsx`, `app/challenges/_layout.tsx` (create), `app/events/_layout.tsx` (create). Reuse the existing logic from `RoleGate.tsx` – do not duplicate.
>
> 4. **`/feed` role fallback.** In `app/feed.tsx`, if `profile?.role` is missing, `<Redirect href="/onboarding/role" />` instead of defaulting to `'player'`.
>
> 5. **Negative like-count fix.** In `src/components/feed/PostCard.tsx`, clamp the rendered count to `>= 0` (or rebuild it from a single source of truth).
>
> 6. **Demo-mode strict isolation in `useProfileById`.** When `DEMO_MODE_ENABLED && profileId === currentUserId`, never call `fetchProfileWithCounts`. Synthesise a default ProfileWithCounts via `getDemoProfileById` (or a new `getDemoSelfProfile` helper) and return it.
>
> 7. **Google sign-in error surfacing.** In `src/store/auth.ts:signInWithGoogle`, throw if `result.type !== 'success'` or token parsing yields no tokens, so `app/auth/login.tsx` can `setError`.
>
> 8. **`recordVideoView` no-op when signed-out.** In `src/lib/videos.ts`, return early when `user` is null. Stop the `useEffect` in `app/video/[id].tsx` from firing when `currentUserId` is undefined.
>
> 9. **`like-status` cache freshness.** In `src/hooks/usePostLikeStatus.ts` and `useVideoLikeStatus.ts`, replace `initialData` with `placeholderData` and set `staleTime: 0` for these queries only.
>
> 10. **Loader in gates.** Have `RoleGate` and `AdminGate` render the same spinner used in `app/_layout.tsx` (small `<View><ActivityIndicator/></View>`) instead of `null` while loading.
>
> Do not implement Medium or Low findings. After each change run `npm run typecheck`. Commit per fix with a message such as `fix(auth): persist supabase session on native`. Report the diff summary at the end.

---

_End of report._
