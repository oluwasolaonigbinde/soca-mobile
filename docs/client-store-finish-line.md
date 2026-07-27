# SOCA Store Finish-Line Checklist For Client

This document lists what the client must create, provide, approve, or grant access to before SOCA can be submitted to the Apple App Store and Google Play Store.

The app source is prepared for store builds, but final submission cannot be completed from the codebase alone. Apple, Google, legal, branding, and production-account items are client-owned.

## Current App Details

- App name: `SOCA`
- iOS bundle identifier: `com.soca.mobile`
- Android package name: `com.soca.mobile`
- Expo slug: `soca-mobile`
- Supabase project ref: `hhwzcaxspfwtqmcvtswu`

Confirm these identifiers are approved before the first production build. Changing them later can create review, signing, and store-record rework.

## What Is Already Prepared

- EAS build and submit configuration exists in `eas.json`.
- Store release validation exists through `npm run preflight:store` and `npm run preflight:store:submission`.
- App Store and Google Play identifiers are set in `app.json`.
- Demo mode is forced off for release profiles.
- Apple privacy manifest includes the UserDefaults required-reason declaration currently needed by the app.
- Android release config blocks unused sensitive permissions: microphone recording, system alert window, and audio modification.
- In-app Settings exposes Privacy Policy, Terms of Use, Account Deletion Help, Log Out, and Delete Account.
- Supabase Edge Function source exists for account deletion at `supabase/functions/delete-account/index.ts`.
- Draft store metadata is available in `docs/store-metadata.md`.
- Developer runbook is available in `docs/store-release.md`.

## Client Must Create Or Provide

### Apple

- Active Apple Developer Program membership.
- App Store Connect access for the release team.
- App Store Connect app record using bundle ID `com.soca.mobile`.
- App privacy questionnaire answers.
- Age rating questionnaire answers.
- Support URL and support email.
- Marketing URL, if the client wants one shown.
- Privacy policy URL.
- Terms of Use or EULA URL.
- Review contact details.
- Demo review credentials if Apple cannot freely create and verify a test account.

In-app account deletion is available from Settings. Test it against production before submission.

### Google Play

- Active Google Play Console developer account.
- Play Console app record using package name com.soca.mobile.
- Google Play App Signing enabled during setup.
- Data Safety form answers.
- App access instructions and review/demo credentials.
- Content rating questionnaire answers.
- Target audience and content declarations.
- Privacy policy URL.
- Public account deletion URL for the Play Console Data deletion form.
- Support email.
- Store listing text, category, contact details, and screenshots.

Google Play requires a public account/data deletion page when the app supports account creation.

### Legal And Web Pages

The client needs public HTTPS pages for:

- Privacy Policy.
- Terms of Use or EULA.
- Account/Data Deletion.
- Support page or support email for store listings.

Legal wording should be approved by the client or counsel before submission.

### Production Environment

Set these production values locally or in EAS:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_PRIVACY_POLICY_URL
- EXPO_PUBLIC_TERMS_URL
- EXPO_PUBLIC_ACCOUNT_DELETION_URL
- EXPO_PUBLIC_DEMO_MODE=false

Do not put Supabase service-role keys, passwords, or private signing credentials in Expo public environment variables.

### Supabase

- Confirm production Supabase project ownership and billing.
- Confirm the public anon key to use for production builds.
- Deploy the delete-account Edge Function.
- Confirm Edge Function secrets are available.
- Confirm Storage buckets exist: avatars, videos, post-images.

Deployment command:

```bash
npx supabase functions deploy delete-account --project-ref hhwzcaxspfwtqmcvtswu --use-api
```

### Authentication Providers

- Confirm email/password auth behavior for production.
- Confirm Google OAuth native redirect setup in Supabase and Google Cloud Console before review.
- Provide required Google OAuth client IDs or console access.

### Demo And Review Accounts

Provide reviewer credentials for:

- Player account.
- Scout account.
- Club account.
- Organization account.
- Admin-capable account if moderation needs review.

Store passwords in a secure client handoff channel or password manager, not in git.

### Store Assets

The client must approve or provide:

- App icon and adaptive icon final art.
- Splash screen final art.
- iPhone screenshots for required App Store device classes.
- iPad screenshots if tablet support remains enabled.
- Android phone screenshots.
- Android tablet screenshots if required by Play Console.
- Short app description.
- Full app description.
- Keywords or tags.
- Category selection.
- Promotional text or release notes.

Screenshots should show the real app, SOCA branding, and production-safe sample content.

## What The Dev Team Runs After Client Items Are Ready

1. Fill .env.production or EAS production environment variables.
2. Deploy the Supabase deletion function.
3. Run local release checks:

```bash
npm run preflight:store
npm run preflight:store:submission
```

4. Build store artifacts:

```bash
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

5. Smoke-test the production builds on physical iOS and Android devices.
6. Submit:

```bash
npx eas submit --platform ios --profile production
npx eas submit --platform android --profile production
```

## Required Physical Device Smoke Tests

Before submission, test on at least one real iPhone and one real Android phone:

- New user can sign up and complete onboarding.
- Existing user can sign in and sign out.
- Signed-out protected routes redirect safely.
- Player can upload avatar and video.
- Video playback works.
- Discover and profile pages load production data.
- Scout, club, or organization can view a player and send a message.
- User can report profile or video content.
- Admin-capable user can review reports.
- User can open Privacy Policy, Terms of Use, and Account Deletion Help links.
- User can delete their account from Settings.
- Deleted account can no longer sign in.
- Deleted user profile rows and owned media are removed or retained only where legally required.

## Remaining Risks Before Submission

- Store approval is not guaranteed; Apple and Google can request wording, metadata, privacy, or behavior changes.
- Uploads have been hardened in code, but media uploads must still be tested on physical devices.
- expo-av currently works but is deprecated by Expo; migrate video playback to expo-video later.
- Full npm audit still reports moderate Expo SDK tooling advisories that require a later Expo migration.
- If the client changes app name, legal entity, identifiers, domain, or launch countries, metadata and legal answers need another review.

## Sign-Off Checklist

- [ ] Client confirms app name and identifiers.
- [ ] Apple Developer account is active.
- [ ] Google Play Console account is active.
- [ ] App Store Connect app record exists.
- [ ] Play Console app record exists.
- [ ] Privacy Policy URL is live.
- [ ] Terms URL is live.
- [ ] Account Deletion URL is live.
- [ ] Support contact is live.
- [ ] Production Supabase anon key is provided.
- [ ] Account deletion Edge Function is deployed and tested.
- [ ] Google OAuth production setup is confirmed or disabled for review.
- [ ] Store screenshots are approved.
- [ ] Store descriptions are approved.
- [ ] Age rating, App Privacy, and Data Safety forms are completed.
- [ ] Demo reviewer credentials are provided securely.
- [ ] Physical iOS smoke test passes.
- [ ] Physical Android smoke test passes.
- [ ] npm run preflight:store:submission passes with real production values.

## Policy References

- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Google Play account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Expo app store submission docs: https://docs.expo.dev/deploy/submit-to-app-stores/
