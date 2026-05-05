# Slice 09 — AI Assist (Assistive Intelligence)
Status: DONE

## Goal
Implement the MVP "assistive intelligence" layer as deterministic ranking/recommendations.

## User-visible behavior

### Feed (network-first)
- Feed shows content from people you follow and people you engage with (likes, views, messages).
- When you have few follows and little engagement, pad with public latest so the feed isn't empty.
- As you follow and engage more, feed shifts toward your network's content (LinkedIn-style).
- Same logic for all roles; feed is similar for everyone.

### Discover (recommended tab)
- Add a "Recommended" sort tab in Discover.
- Recommended = suggested players you don't follow yet, based on your behavior (e.g. players you've messaged, viewed, or similar to those).
- Fallback to popular when no interaction signals exist.

### Explore
- No "Recommended for you" section. Explore stays as-is (featured, trending, challenges, events).

## Implementation approach (V1)
- Rule-based, deterministic. No ML.
- Use existing tables only: `follows`, `video_likes`, `video_views`, `messages`.
- Feed: query videos from (a) people you follow, (b) people whose content you've liked/viewed, (c) people you've messaged; merge and sort by recency; if sparse, append latest public videos.
- Discover Recommended: derive "relevant" profile IDs from messages, profile_views, follows; rank by recency + engagement; fallback to popular when empty.
- Skip `engagement_signals` and `shortlists` for this slice.

## Data / backend
- No new tables. Use: `follows`, `video_likes`, `video_views`, `messages`, `profile_views`.

## Acceptance checks
Manual:
- Feed: with few follows, see public content; after following/engaging, see more network content.
- Discover: select Recommended tab; after messaging/viewing players, see them (or similar) in recommended.
- Ranking logic is explainable in code.
Agent verify:
- `/verify`

## Out of scope
- ML training, computer vision, "fit score" learning (Phase 3)
- Shortlists, engagement_signals table

## Implementation notes
- Feed now uses a network-first ranking: followed creators, message counterparts, and owners of videos you like/view receive higher priority, then the list pads with latest public uploads when needed.
- Discover adds a `Recommended` tab and keeps Explore unchanged. The UI treats Recommended as player-focused and excludes profiles you already follow.
- TODO: if stronger recommendation explanations are needed later, expose per-profile reason labels in the UI instead of keeping the logic code-only.
