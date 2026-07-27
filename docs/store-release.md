# SOCA Store Release Runbook

This repo is now structured for App Store, TestFlight, Google Play, and internal Android release builds. Store accounts, certificates, privacy URLs, screenshots, and legal copy are still client-owned assets.

Use `docs/client-store-finish-line.md` as the client-facing checklist of every account, URL, credential, store asset, and sign-off item still needed to take the app to submission.

## App Identifiers

Current defaults:

- iOS bundle identifier: `com.soca.mobile`
- Android package: `com.soca.mobile`
- Expo slug: `soca-mobile`
- Display name: `SOCA`

Confirm these identifiers are available in Apple Developer and Google Play Console before the first production build. If the client owns a different legal namespace, update `app.json` before building.

## Required Environment

Production builds must set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://hhwzcaxspfwtqmcvtswu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<client anon key>
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://<client-domain>/privacy
EXPO_PUBLIC_TERMS_URL=https://<client-domain>/terms
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://<client-domain>/account-deletion
EXPO_PUBLIC_DEMO_MODE=false
```

For local validation, copy `.env.production.example` to `.env.production` and replace every placeholder. Real env files remain ignored by git.

Do not set dev quick-login credentials in EAS or store builds.

## Supabase Account Deletion

Apple requires apps with account creation to offer account deletion in-app. SOCA exposes this at `Profile -> Settings -> Delete Account`.

Deploy the function before store review:

```bash
npx supabase functions deploy delete-account --project-ref hhwzcaxspfwtqmcvtswu
```

If the Supabase CLI is not installed globally, use the project-local CLI invocation:

```bash
npx supabase functions deploy delete-account --project-ref hhwzcaxspfwtqmcvtswu --use-api
```

The function uses Supabase-hosted secrets by default. If this project still uses legacy keys, confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to Edge Functions. The service key must never be placed in Expo public environment variables.

The function removes user-owned rows from public SOCA tables, removes user-owned media from `avatars`, `videos`, and `post-images`, then soft-deletes the Supabase Auth user. It clears admin/organizer references on shared rows such as events, challenges, reports, and achievements instead of deleting shared platform records created during admin activity.

Manual smoke:

1. Create a test account.
2. Complete onboarding.
3. Upload an avatar and highlight video.
4. Open `Profile -> Settings`.
5. Delete the account.
6. Confirm the app returns to Welcome.
7. Confirm the auth user is soft-deleted, the public profile/user-owned rows are gone, and user-owned media under `avatars/<userId>`, `videos/<userId>`, and `post-images/<userId>` is removed.

## Legal And Review Metadata

Use `docs/store-metadata.md` as the draft metadata/privacy packet.

Before submission, the client must provide:

- Public privacy policy URL.
- Public terms / EULA URL.
- Public account deletion URL for Google Play's Data deletion form. This web page must let users request account/data deletion without reinstalling the app and must reference SOCA or the developer name.
- Support URL and support email.
- Age rating answers.
- Data Safety answers for Google Play.
- App Privacy answers for Apple.
- Screenshots for every required device class.
- Demo account credentials for Apple review if production sign-up is restricted or email verification blocks review.

UGC review notes:

- Users can report profile and video content from the app.
- Admin-capable accounts can review and resolve reports under `Admin -> Reports`.
- Admin access is controlled through `auth.users.raw_app_meta_data.is_admin = true`.

## Build And Submit

Install and authenticate EAS:

```bash
npx eas login
npx eas whoami
```

Run the store preflight:

```bash
npm run preflight:store
```

Validate final submission environment values after `.env.production` or EAS production environment variables are set:

```bash
npm run preflight:store:submission
```

For local dry-runs before the client has legal URLs, this command shows external placeholders as warnings:

```bash
node scripts/validate-store-release.js --allow-external-placeholders --env=.env.example
```

Build for review:

```bash
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

Submit after build artifacts pass smoke checks:

```bash
npx eas submit --platform ios --profile production
npx eas submit --platform android --profile production
```

## Release Smoke Checklist

- `npm run preflight:store` passes. This runs `/verify`, Expo Doctor, and `npm audit --omit=dev --audit-level=high`. As of this pass, `npm audit` without an audit level still reports moderate Expo SDK tooling advisories that npm only resolves by force-upgrading to Expo 56; do not apply that breaking upgrade during the SDK 54 release track without a separate migration pass.
- `npx expo export --platform android --output-dir .expo/store-export-android` passes. This local export has been run successfully and produced the Android Hermes bundle under `.expo/store-export-android`.
- `npx expo config --type public` shows `ios.bundleIdentifier`, `android.package`, production app name, and `android.blockedPermissions` for `android.permission.RECORD_AUDIO`, `android.permission.SYSTEM_ALERT_WINDOW`, and `android.permission.MODIFY_AUDIO_SETTINGS`.
- `npx expo config --type public` includes `ios.privacyManifests.NSPrivacyAccessedAPITypes` with `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`.
- Android prebuild has been locally inspected: `android/app/src/main/AndroidManifest.xml` marks `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, and `MODIFY_AUDIO_SETTINGS` with `tools:node="remove"`. After the first EAS build, inspect the generated Android artifact or Play Console permission view to confirm those permissions are absent from the merged release manifest.
- Google OAuth native redirect URLs are configured in Supabase and Google Cloud Console.
- Email/password sign-up, login, logout, and account deletion pass on a physical iPhone and Android device.
- Player can upload a non-zero-byte avatar and video; playback works from the public URL. Native upload bodies use `expo-file-system` ArrayBuffer reads and reject zero-byte files before storage upload.
- Scout/club/org can discover a player, view profile, message, and mark event Interested.
- Reports submit from profile/video screens and appear for an admin account.
- `EXPO_PUBLIC_DEMO_MODE` is absent or `false` in every EAS profile and secret.
- Signed-out deep links to `/feed`, `/explore`, `/discover`, `/messages`, `/me`, `/profile/<id>`, `/video/<id>`, `/report/new`, `/challenges`, `/events`, and `/upload/video` redirect to Welcome or onboarding instead of throwing.

## Known Launch Hardening Still Recommended

- Uploads now use native ArrayBuffer reads and zero-byte checks, but they still need physical iOS/Android smoke tests before review because device media providers vary.
- `expo-av` emits an SDK deprecation warning; migrate video playback to `expo-video` in a later hardening pass.
- Full `npm audit` has remaining moderate Expo tooling advisories that require a breaking Expo 56 migration per npm. The practical SDK 54 release gate is `npm audit --omit=dev --audit-level=high`.


