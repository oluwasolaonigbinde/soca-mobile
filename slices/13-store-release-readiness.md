# Slice 13 - Store Release Readiness
Status: DONE

## Goal
Prepare SOCA for client-owned App Store, TestFlight, and Google Play release workflows without taking ownership of store accounts, legal hosting, screenshots, or ongoing release operations.

## Acceptance checks
Manual:
- App config has iOS and Android identifiers suitable for EAS builds.
- Production EAS builds force demo mode off.
- Authenticated users can reach Profile -> Settings.
- Signed-in top-level routes redirect through the shared auth/profile-completion gate instead of throwing on cold unauthenticated deep links.
- Settings exposes privacy policy, terms, logout, and account deletion actions.
- Account deletion is implemented through a server-side Supabase Edge Function, not a service key in the mobile app.
- Handoff docs list store-owned requirements, build/submit commands, and review smoke checks.

Agent verify:
- `npm run preflight:store`

## Out of scope
- Creating or managing Apple Developer / Google Play Console accounts.
- Hosting the client's legal policy pages.
- Producing store screenshots, store copy, age ratings, or privacy questionnaire answers.
- Guaranteeing App Review / Play Review approval.
- Ongoing post-launch release management.

## Completion notes
- Added EAS build/submit configuration in `eas.json` with demo mode disabled for development, preview, and production profiles.
- Updated `app.json` with the SOCA display name, default iOS bundle identifier, Android package name, build numbers, and photo-library permission copy.
- Added `Profile -> Settings` with privacy/terms links, logout, and account deletion.
- Added shared auth/profile-completion layouts for signed-in route directories plus wrappers for `/feed`, `/discover`, and `/explore`.
- Replaced native `fetch(uri).blob()` upload bodies with an `expo-file-system` ArrayBuffer helper for avatar, image-post, and video uploads; zero-byte files now fail before storage upload.
- Updated Expo SDK 54 patch dependencies with `npx expo install` so Expo Doctor passes.
- Added `expo-system-ui` so native prebuild honors the configured automatic user interface style without warnings.
- Ran `npm audit fix` to clear high-severity production advisories without forcing a breaking Expo 56 migration.
- Added `npm run preflight:store` as the release-readiness check before EAS builds.
- Added `npm run preflight:store:submission` plus `scripts/validate-store-release.js` to fail on missing release env, placeholder legal URLs, demo mode, missing account-deletion function, and unsafe Android permission config.
- Added an iOS privacy manifest declaration for UserDefaults reason `CA92.1` and made `EXPO_PUBLIC_ACCOUNT_DELETION_URL` a required release env value for Google Play.
- Added `.env.production.example` as the copy-and-fill template for local submission validation and EAS production env setup.
- Added `docs/store-metadata.md` with draft App Store / Play Store listing, privacy, review-note, screenshot, and sign-off guidance.
- Added `docs/client-store-finish-line.md` with the client-facing checklist for required developer accounts, legal URLs, reviewer credentials, store assets, Supabase deployment, physical smoke tests, and sign-off before submission.
- Tightened Android blocked permissions for store review; local prebuild confirms `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, and `MODIFY_AUDIO_SETTINGS` are marked with `tools:node="remove"` in `android/app/src/main/AndroidManifest.xml`.
- Added `delete-account` Supabase Edge Function to validate the caller session, remove user-owned public rows and media from `avatars`, `videos`, and `post-images`, then soft-delete the Supabase Auth user using a server-side service key.
- Verified `npx supabase` is available at CLI 2.105.0 and supports the documented `functions deploy delete-account --project-ref hhwzcaxspfwtqmcvtswu` command.
- Added `docs/store-release.md` and updated handoff/scope docs for the changed client decision.
- `/verify` passes: typecheck OK, lint OK, tests OK (7/7 suites, 17/17 tests).
- `npx expo-doctor` passes: 18/18 checks.
- `npm audit --omit=dev --audit-level=high` passes; full audit still reports moderate Expo SDK tooling advisories that npm says require Expo 56.
- `npx expo export --platform android --output-dir .expo/store-export-android` passes and emits the Android Hermes bundle.
- GitHub Actions `Verify` workflow now also runs `npm run preflight:store`.


