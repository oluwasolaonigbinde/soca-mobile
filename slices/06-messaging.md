# Slice 06 — Messaging
Status: DONE

## Goal
One-to-one messaging:
- Conversations list with unread indicators
- Message thread

## User-visible behavior
- User can message another user
- Conversations list shows threads + unread status

## Screens / routes
- `/messages`
- `/messages/[conversationId]`
- (optional) `/profile/[id]` message CTA

## Data / backend (recommended)
Tables:
- `messages`:
  - `id`, `conversation_id`, `sender_id`, `recipient_id`, `text`, `created_at`, `read_at?`
- `conversations` (optional):
  - `id`, `user_a`, `user_b`, `last_message_at`

RLS:
- only participants can read/write in a conversation

## Acceptance checks
Manual:
- Send a message and see it delivered
- Unread indicator behaves (basic)
Agent verify:
- `/verify`

## Out of scope
- Media attachments in chat (Phase 2)

## Notes
- Added `/messages` and `/messages/[conversationId]` with conversation list, unread badges, and a text-only thread composer.
- Profile pages now expose a message CTA for other users and a messages entry point for the signed-in user.
- SQL setup is documented in `docs/schema-06-messaging.sql`; messaging stays unavailable until those tables and RLS policies are applied in Supabase.
