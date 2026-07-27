# SOCA V1 — Role Capabilities

This document defines what each role can do within SOCA V1. Use it to guide permission checks, UI visibility, and feature gating.

---

## Role Model Principles

- One primary role per account in V1.
- Role affects onboarding, profile metadata, discovery behavior, and feed relevance.
- Multi-role switching is out of scope.

---

## Player

**Platform intent**  
Create football identity, gain exposure, and appear in discovery surfaces. Receive engagement and messages from scouts and clubs.

**Onboarding / profile expectations**

- Create account via email/password or Google sign-in
- Select Player role during onboarding
- Complete role-specific profile setup (bio, location, football metadata)
- Maintain public player profile optimized for discovery and evaluation

**What they can view / discover**

- Search and filter other players
- Browse Explore (featured players, trending videos, challenges, events)
- View player profiles and videos

**What they can publish / submit**

- Upload highlight videos
- Submit videos to challenges
- Create and edit own profile

**Messaging permissions**

- Send and receive 1-to-1 messages
- View conversation list with unread indicators

**Engagement permissions**

- Like and view videos
- Follow other users
- Receive engagement (follows, likes, views) and messages

---

## Scout

**Platform intent**  
Discover players, evaluate talent through profiles and videos, and interact with players. Contribute interaction signals that may affect recommendations.

**Onboarding / profile expectations**

- Create account via email/password or Google sign-in
- Select Scout role during onboarding
- Complete role-specific profile setup
- Maintain public profile for credibility

**What they can view / discover**

- Search players with filters (position, age, location, role)
- Sort discovery by latest, popular, featured
- View player profiles and videos
- Evaluate players through videos and profiles

**What they can publish / submit**

- No video upload or challenge submission

**Messaging permissions**

- Message players
- Send and receive 1-to-1 messages
- View conversation list with unread indicators

**Engagement permissions**

- Follow players
- Like videos
- View videos
- Interactions (follows, views, messaging interest) may inform ranking/recommendations

---

## Club

**Platform intent**  
Discover talent, view player profiles and videos, and message players. Participate as a talent-discovery actor within the same unified network.

**Onboarding / profile expectations**

- Create account via email/password or Google sign-in
- Select Club role during onboarding
- Complete role-specific profile setup
- Maintain club presence on platform

**What they can view / discover**

- Discover players
- Search and filter players
- View player profiles and videos

**What they can publish / submit**

- Create events
- No video upload or challenge submission

**Messaging permissions**

- Message players
- Send and receive 1-to-1 messages
- View conversation list with unread indicators

**Engagement permissions**

- Follow players
- Like videos
- View videos

---

## Organization

**Platform intent**  
Maintain presence and participate in ecosystem visibility. Be visible within the unified platform (federations, leagues, media, governing bodies).

**Onboarding / profile expectations**

- Create account via email/password or Google sign-in
- Select Organization role during onboarding
- Complete role-specific profile setup
- Maintain presence profile

**What they can view / discover**

- Search players with filters (position, age, location, role)
- Sort discovery by latest, popular, featured
- Browse Explore
- View player profiles and videos
- Participate in ecosystem visibility

**What they can publish / submit**

- Create events
- No video upload or challenge submission

**Messaging permissions**

- Send and receive 1-to-1 messages
- View conversation list with unread indicators

**Engagement permissions**

- Follow users
- Like videos
- View videos

---

## Admin

**Platform intent**  
Manage challenges, moderate content, feature content, and optionally assign verification badges.

**Onboarding / profile expectations**

- Admin accounts are provisioned separately (not self-service)
- Admin-specific dashboard/interface
- No public profile required for moderation tasks

**What they can view / discover**

- Full visibility into platform content and users
- Access moderation queues and reports

**What they can publish / submit**

- Create and manage challenges
- Feature content (players, videos, challenges, events)
- Moderate reported content
- Optionally assign verification badges manually
- Score challenge submissions (admin scoring)

**Messaging permissions**

- Not primary use case; may have access for moderation

**Engagement permissions**

- N/A (moderation focus)
