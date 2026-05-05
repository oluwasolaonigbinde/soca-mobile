# SOCA V1 — Domain Model

This document defines the core system entities for SOCA V1. Use it to guide data modeling and implementation decisions. Relationships reflect the unified-platform model: all roles share one network, not separate apps per role.

---

## User

**Purpose**  
Authenticated account holder. The root entity for authentication, role assignment, and ownership of profiles and content.

**Owner**  
System (no owner).

**Key Fields**

- id
- email
- role (Player | Scout | Club | Organization)
- created_at
- auth_provider (email | google)

**Relationships**

- has_one Profile
- has_many Videos (if Player)
- has_many Follows (as follower and as followed)
- has_many Likes
- has_many Views
- has_many ChallengeSubmissions (if Player)
- participates in Conversations
- receives Notifications

**Visibility rules**  
User identity is private; Profile is the public-facing entity.

---

## Profile

**Purpose**  
Public-facing identity and metadata for a user. Tied to a User. Optimized for discovery and evaluation (especially for players).

**Owner**  
User.

**Key Fields**

- id
- user_id
- profile_image_url
- bio
- location
- football_metadata (position, birth_year, etc.)
- engagement_metrics (views_count, likes_count, followers_count)
- created_at
- updated_at

**Relationships**

- belongs_to User
- has_many Videos (via User if Player)
- referenced by Follows
- appears in discovery and feeds

**Visibility rules**  
Profile is public-facing. Other platform users can view profiles.

---

## Video

**Purpose**  
Core discovery asset. Player highlight content used for discovery and proof of ability. Usually owned by a Player-linked user/profile.

**Owner**  
User (player role).

**Key Fields**

- id
- user_id
- video_url
- thumbnail_url
- description
- views_count
- likes_count
- created_at

**Relationships**

- belongs_to Profile (via user_id)
- can appear in feeds, profiles, discovery/explore surfaces
- can be submitted to Challenge (as ChallengeSubmission)
- has_many Likes
- has_many Views

**Visibility rules**  
Videos are public and appear in feeds, profiles, and discovery surfaces.

---

## Follow

**Purpose**  
Social graph edge representing a user following another user.

**Owner**  
User (the follower).

**Key Fields**

- id
- follower_id
- followed_id
- created_at

**Relationships**

- belongs_to User (follower)
- belongs_to User (followed)
- contributes to engagement metrics on Profile

---

## Like

**Purpose**  
Engagement signal when a user likes a video.

**Owner**  
User.

**Key Fields**

- id
- user_id
- video_id
- created_at

**Relationships**

- belongs_to User
- belongs_to Video
- contributes to Video.likes_count and ranking signals

---

## View

**Purpose**  
Meaningful engagement and ranking signal when a user views a video. Not just a display count—View records can inform ranking and recommendations.

**Owner**  
User (viewer).

**Key Fields**

- id
- user_id
- video_id
- created_at

**Relationships**

- belongs_to User
- belongs_to Video
- contributes to Video.views_count and ranking signals

---

## Challenge

**Purpose**  
Admin-created recurring competition (e.g. Top Dribble of the Month).

**Owner**  
Admin (system).

**Key Fields**

- id
- title
- description
- start_date
- end_date
- created_by (admin)
- created_at
- updated_at

**Relationships**

- has_many ChallengeSubmissions
- has LeaderboardEntries (derived from submissions)
- appears on Explore page

---

## ChallengeSubmission

**Purpose**  
Links a player (user) and their video to a challenge. A player's video entry for a challenge.

**Owner**  
User (player).

**Key Fields**

- id
- challenge_id
- user_id
- video_id
- admin_score (optional)
- engagement_score (derived)
- created_at

**Relationships**

- belongs_to Challenge
- belongs_to User (player)
- belongs_to Video
- appears in LeaderboardEntry

---

## LeaderboardEntry

**Purpose**  
Reflects ranked challenge outcomes. Ranked position of a submission within a challenge.

**Owner**  
System (derived).

**Key Fields**

- id
- challenge_id
- challenge_submission_id
- rank
- score (admin + engagement)

**Relationships**

- belongs_to Challenge
- belongs_to ChallengeSubmission
- public leaderboard view

---

## Event

**Purpose**  
Football activity (trials, showcases, scouting events).

**Owner**  
User, Club, or Organization (organizer).

**Key Fields**

- id
- title
- location
- date
- description
- organizer_id
- created_at
- updated_at

**Relationships**

- belongs_to User, Club, or Organization (organizer)
- has_many UserEventInterests (interest markers)
- appears on Explore page and listing surfaces

**Visibility rules**  
Events are public. Users can view event detail pages and mark interest.

---

## UserEventInterest

**Purpose**  
Stores when a user marks interest in an event (e.g. View, Interested). Persists the user–event relationship for simple interest tracking.

**Owner**  
User.

**Key Fields**

- id
- user_id
- event_id
- status (e.g. interested | viewed)
- created_at

**Relationships**

- belongs_to User
- belongs_to Event

**Visibility rules**  
Users can view and manage their own interest markers.

---

## Message

**Purpose**  
Single text message in a 1-to-1 conversation.

**Owner**  
User (sender).

**Key Fields**

- id
- conversation_id
- sender_id
- body (text)
- created_at
- read_at (optional)

**Relationships**

- belongs_to Conversation
- belongs_to User (sender)

---

## Conversation

**Purpose**  
1-to-1 direct messaging thread between two users.

**Owner**  
System (no single owner).

**Key Fields**

- id
- participant_1_id
- participant_2_id
- created_at
- updated_at

**Relationships**

- has_many Messages
- belongs_to User (participants)
- supports unread indicators

**Visibility rules**  
Only participants can view the conversation.

---

## Notification

**Purpose**  
Lightweight in-app alert for MVP-relevant signals (e.g. new follower, like, message). Do not overdesign; only reflect signals already mentioned in product behavior.

**Owner**  
User (recipient).

**Key Fields**

- id
- user_id
- type
- reference_id (polymorphic)
- read_at
- created_at

**Relationships**

- belongs_to User
- references various entities (Follow, Like, Message, etc.)

---

## Report

**Purpose**  
User-submitted flag on content (video, profile, etc.) for moderation review. Supports admin moderation of reported content.

**Owner**  
User (reporter).

**Key Fields**

- id
- reporter_id
- reportable_type (polymorphic: Video, Profile, etc.)
- reportable_id
- reason (optional)
- status (pending | reviewed | resolved)
- created_at

**Relationships**

- belongs_to User (reporter)
- references reportable entity (Video, Profile, etc.)
- reviewed by Admin

**Visibility rules**  
Only admins can view and act on reports.
