# SOCA Store Metadata Packet

Use this as the starting packet for App Store Connect and Google Play Console. The client must review every answer against the final legal policy and production configuration before submission.

## Listing Basics

- App name: `SOCA`
- Subtitle / short description: `Football discovery, highlights, challenges, and scouting connections.`
- Category: Sports / Social Networking
- Content rating expectation: Teen-oriented social sports app; final age rating must be answered in App Store Connect and Play Console.
- Support URL: TODO client-hosted URL
- Marketing URL: TODO optional client-hosted URL
- Privacy policy URL: TODO client-hosted URL
- Terms / EULA URL: TODO client-hosted URL
- Account deletion URL: TODO client-hosted URL for Google Play Data deletion

## Suggested App Description

SOCA is a football-focused social platform where players showcase talent through profiles, posts, and highlight videos, while scouts, clubs, and organizations discover players, follow updates, message users, browse challenges, and view events.

Players can build a public football profile, upload highlights, join monthly challenges, and grow visibility through engagement. Scouts, clubs, and organizations can discover players by role, position, location, popularity, and recommendations, then view profiles, watch highlights, message players, and follow relevant events.

SOCA includes reporting and admin moderation workflows for profile and video content.

## Review Notes

Suggested review note:

SOCA requires an account to access the main football social platform. Testers may create an email/password account or use the provided demo credentials. Account deletion is available after login under Profile -> Settings -> Delete Account. Users can report profile and video content from profile/video detail screens. Admin moderation is available only to accounts marked with `auth.users.raw_app_meta_data.is_admin = true`.

Required before submission:

- Provide a reviewer demo account for each role if sign-up/email verification may slow review.
- Provide one admin-capable reviewer account if Apple/Google asks to verify moderation.
- Confirm account deletion Edge Function is deployed and tested.
- Confirm the public account deletion web page is live, references SOCA, and gives users a way to request deletion without reinstalling the app.

## Data Collection Draft

Likely collected data types:

- Contact info: email address for authentication.
- User content: profile details, bio, avatar, posts, image posts, highlight videos, challenge submissions, messages, reports.
- Identifiers: Supabase user ID and related row IDs.
- Usage data / interactions: follows, likes, views, event interest, message read state, challenge leaderboard activity.
- Approximate location: user-entered profile/event location text only, not device GPS location.

Likely purposes:

- App functionality.
- User account management.
- User-generated content display.
- Messaging and social interactions.
- Moderation, safety, and abuse reporting.
- Basic discovery/recommendation ranking from in-app activity.

Likely not used, unless client adds tools later:

- Third-party advertising.
- Cross-app tracking.
- Sale of personal data.
- Precise location.
- Device contacts.
- Health/fitness data.
- Financial/payment data.

## Apple App Privacy Draft

Answer conservatively from the final privacy policy:

- Data linked to the user: email, user ID, profile information, user content, messages, in-app interactions.
- Data used to track users across apps/websites: No, unless the client adds tracking SDKs or advertising tools.
- Data shared with third parties: Supabase stores and processes backend data as a service provider. Any other sharing must match the client's privacy policy.

## Google Play Data Safety Draft

Answer conservatively from the final privacy policy:

- Data collected: personal info, photos/videos/user content, messages, app activity, user IDs.
- Data shared: No sale/sharing for advertising by default; disclose Supabase/service providers as processing if required by the form.
- Data encrypted in transit: Yes, via HTTPS/Supabase APIs.
- Users can request/delete data: Yes, in-app account deletion exists at Profile -> Settings -> Delete Account.
- Data deletion path: in-app deletion invokes the `delete-account` Supabase Edge Function.
- External data deletion web resource: TODO client-hosted URL, required for Google Play.

## Screenshots Needed

Minimum screenshot set should show:

- Welcome / login.
- Player home/feed.
- Player profile with highlight content.
- Discover/explore player search.
- Challenge list/detail.
- Event list/detail.
- Messaging thread.
- Settings with Delete Account visible.
- Report content flow or moderation note if requested by review.

## Final Client Sign-Off Checklist

- Legal policy URLs are live and match app behavior.
- Account deletion URL is live, visible, and entered in Play Console's Data deletion form.
- Store listing text does not promise unimplemented features.
- Demo accounts work and are not in demo mode.
- Admin review account is configured if supplied.
- App identifiers are available and owned by the client.
- Screenshots are from the production build or an equivalent release candidate.
