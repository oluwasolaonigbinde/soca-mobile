# SOCA V1 — Product Behavior

## Product Overview

SOCA V1 is a football-focused discovery and social platform centered on player visibility and exposure.

The platform allows players to showcase talent and allows scouts, clubs, and organizations to discover and engage with players. It centers around player visibility through public profiles, highlight videos, discovery surfaces, and structured challenges.

## Core Goals

**Players** should be able to:

- create football profiles
- upload highlight videos
- participate in challenges
- gain exposure

**Scouts** should be able to:

- discover players
- evaluate players through videos and profiles
- interact with players

**Clubs** should be able to:

- discover talent
- view player profiles
- message players

**Organizations** should be able to:

- maintain presence
- participate in ecosystem engagement such as events or visibility.

The system is a single unified platform containing multiple roles. These roles coexist in one network. The system is role-aware, but not role-siloed. Multi-role switching is out of scope for V1.

## Roles

Supported roles:

- Player
- Scout
- Club
- Organization

Roles influence onboarding fields, profile metadata, discovery behavior, and feed relevance. Multi-role switching is NOT part of V1.

## Authentication & Onboarding

**Supported authentication methods:**

- Email/password
- Google sign-in

**Onboarding flow:**

1. Create account
2. Select role
3. Complete role-specific profile setup
4. Enter platform

**Required elements:**

- Role selection during onboarding
- Role-specific profile setup (fields vary by role)

The onboarding system should collect enough metadata to support discovery.

## Profiles

Profiles are public-facing identity surfaces. They represent the public identity of each user and are visible to other platform users.

Profiles include:

- profile image
- bio
- location
- football metadata
- engagement metrics
- follower relationships

Player profiles are optimized for discovery and evaluation.

## Content System

**Primary content type:**

Highlight videos. Video highlights are the primary proof-of-talent object in the system.

Players upload videos that become visible in:

- profile pages
- public feeds
- discovery/explore surfaces
- challenge submissions (where applicable)

Public feed visibility is required: highlight videos must be able to appear in feeds, profiles, and discovery surfaces.

## Feeds

Feeds are role-aware content streams. A feed may include:

- highlight videos (from players)
- featured players or content
- challenges
- events

Feed composition and ordering may use engagement, challenge performance, and role-specific relevance. When feed logic is unspecified, prefer a simple rule-based approach (e.g. latest first, or engagement-weighted).

## Video Upload & Playback

**Required capabilities:**

- video upload
- secure storage
- streamed playback
- metadata persistence

The system should prioritize reliable playback and mobile performance.

## Discovery

Discovery is a core football-specific function: it allows users to find players for talent evaluation and engagement, not just generic social browsing.

**Discovery supports:**

- Search
- Filters
- Sorting

**Likely filters include:**

- position
- age (derived from birth year where applicable)
- location
- role

**Likely sorting includes:**

- latest
- popular
- featured

## Explore Page

Explore is a mixed discovery surface that can contain:

- featured players
- trending videos
- challenges
- events

Explore is designed to highlight activity across the platform.

## Social Graph

Users can:

- follow users
- view profiles
- like videos

These actions are not decorative: they can inform ranking and relevance. Engagement contributes to credibility and ranking signals.

## Challenges

Challenges are admin-created, recurring (typically monthly) competitions.

- Admin creates challenges.
- Players submit videos.
- Scoring combines admin input and engagement metrics.
- The output is a public leaderboard ranking submissions.

## Messaging

Messaging is 1-to-1 and text-only for V1.

**Capabilities include:**

- conversation list
- message thread
- unread indicators

Group chat and media attachments are not in scope for V1.

## Events

Events represent football activities (trials, showcases, scouting events).

**Event surfaces:**

- listing surfaces (e.g. Home, Explore)
- event detail pages

**Event records include:**

- title
- location
- date
- description
- organizer

Users can view events and mark interest (e.g. View, Interested). Ticketing, payments, and full RSVP systems are not in scope for V1.

## Assistive Intelligence

The platform uses assistive ranking and recommendation logic, not advanced AI or machine learning.

**Useful ranking/recommendation inputs include:**

- engagement (likes, views, follows)
- challenge performance
- scout interactions
- shortlist-like behavior (if implemented; e.g. bookmarking or saving players of interest)
- messaging interest

These inputs may improve feeds, player discovery, and recommendations.

## Admin & Moderation

Admins can:

- manage challenges (create, edit, close)
- feature content (players, videos, challenges, events)
- moderate reports and content
- optionally assign manual verification badges

## System-Wide Product Principles

- **Player discovery first** — The platform exists to surface players to scouts, clubs, and organizations.
- **Public identity over private complexity** — Profiles are public-facing; avoid unnecessary privacy layers for MVP.
- **Role-aware, not role-siloed** — All roles share one network; behavior adapts by role but is not isolated.
- **MVP simplicity over future overengineering** — Prefer simple, working behavior over speculative extensibility.
- **Engagement is functional** — Follows, likes, and views feed ranking and relevance; treat them as data.
- **Video is core** — Highlight videos are the primary proof-of-talent object; prioritize reliable upload and playback.

## Implementation Decision Rules for Agents

- Prefer decisions that improve player visibility and discovery.
- Prefer simpler MVP behavior over speculative future extensibility.
- Prefer football-specific interpretations over generic social-media interpretations.
- Do not silently introduce future-phase features.
- Keep role-aware behavior consistent across onboarding, profiles, feed logic, and discovery.
- Preserve engagement data cleanly because it may be reused for ranking/recommendations.
- If ranking logic is unspecified, use a reasonable explainable rule-based approach first.
