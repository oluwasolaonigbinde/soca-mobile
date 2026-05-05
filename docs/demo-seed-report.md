# SOCA demo seed report

## Summary

Demo dataset was seeded via Supabase SQL (MCP `execute_sql`). No app code was changed.

## Schema / tables

- **profiles** – FK `id` → `auth.users(id)`. RLS: SELECT public; INSERT/UPDATE own only. **Role is immutable** (trigger `enforce_immutable_role`); only profiles with `role IS NULL` could be set to a new role (one profile set to `scout`).
- **follows** – Did not exist; created from `docs/schema-02-profiles-social.sql`, then seeded.
- **profile_views** – Did not exist; created from same schema, then seeded.
- **videos** – FK `owner_id` → `auth.users`. Seeded with placeholder `storage_path` values (e.g. `demo/oluwasola-goal.mp4`). Actual files are not in storage; app may show placeholders or broken thumbnails until real files exist.
- **video_likes** – FK `user_id` → `auth.users`, `video_id` → `videos`. Seeded.
- **video_views** – FK `viewer_id` → `auth.users` (nullable), `video_id` → `videos`. Seeded.
- **conversations** – FK `user_a`, `user_b` → `auth.users`. Seeded 1 row.
- **messages** – FK `sender_id`, `recipient_id` → `auth.users`, `conversation_id` → `conversations`. Seeded 3 messages.
- **challenge_submissions** – FK `user_id` → `auth.users`, `video_id` → `videos`, `challenge_id` → `challenges`. Seeded 2 rows.
- **featured_items** – Seeded 4 rows (2 profiles, 2 videos) so Explore “Featured” has content.

## Skipped / constraints

- **auth.users** – Not seeded. Demo uses **existing** auth users only. Adding new users would require Supabase Auth API (e.g. admin `createUser`) or dashboard; direct inserts into `auth.users` are not recommended (password hashing, triggers).
- **profiles.role** – Cannot change once set. Only one profile had `role IS NULL`; it was set to `scout`. Others remain `player` (no `club`/`org` demo roles added).
- **challenges / events** – Not re-seeded; already present with March 2026 dates from earlier update.

## Seeded counts (verification)

| Table               | Count |
|---------------------|-------|
| follows             | 7     |
| profile_views       | 6     |
| videos              | 4     |
| video_likes         | 6     |
| video_views         | 7     |
| conversations       | 1     |
| messages            | 3     |
| challenge_submissions | 2   |
| featured_items      | 6     |

## Demo users (existing auth + updated profiles)

- **708684f1** – Oluwasola O. (`oluwasola`) – player, 2 videos, in conversation, challenge submissions.
- **838f1264** – Sola Oni (`sola_oni`) – **scout** (only role change applied).
- **99e45419** – German Sheps (`german_sheps`) – player (profile text suggests “academy”).
- **cd81bc70** – Idris Sadiq (`idris_sadiq`) – player (profile text suggests “org”).

## Video storage paths (placeholders)

- `demo/oluwasola-goal.mp4`, `demo/oluwasola-skills.mp4` (owner Oluwasola)
- `demo/academy-highlights.mp4` (owner German Sheps)
- `demo/regional-trial.mp4` (owner Idris Sadiq)

Upload real files to the `videos` bucket with these paths, or update `storage_path` after upload, for playback to work.

## Optional: re-run verification queries

```sql
SELECT id, role, username, display_name FROM public.profiles ORDER BY role NULLS LAST, username;
SELECT title, month, starts_at, ends_at FROM public.challenges ORDER BY created_at;
SELECT title, date, location FROM public.events ORDER BY created_at;
SELECT c.id, p_a.username AS user_a, p_b.username AS user_b FROM public.conversations c
  JOIN profiles p_a ON p_a.id = c.user_a JOIN profiles p_b ON p_b.id = c.user_b;
```
