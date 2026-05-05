-- Slice 06 - Messaging
-- Run manually in Supabase SQL Editor.
-- Pre-requisite: auth and profiles tables exist.

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_users_check CHECK (user_a <> user_b)
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_user_pair_key
  ON conversations (user_a, user_b);

CREATE INDEX IF NOT EXISTS conversations_user_a_idx
  ON conversations (user_a, last_message_at DESC);

CREATE INDEX IF NOT EXISTS conversations_user_b_idx
  ON conversations (user_b, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_at_idx
  ON messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS messages_recipient_unread_idx
  ON messages (recipient_id, read_at, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_participants ON conversations;
CREATE POLICY conversations_select_participants ON conversations FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS conversations_insert_participants ON conversations;
CREATE POLICY conversations_insert_participants ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.uid() = user_a OR auth.uid() = user_b)
  );

DROP POLICY IF EXISTS conversations_update_participants ON conversations;
CREATE POLICY conversations_update_participants ON conversations FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS messages_select_participants ON messages;
CREATE POLICY messages_select_participants ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user_a = auth.uid() OR conversations.user_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS messages_insert_sender ON messages;
CREATE POLICY messages_insert_sender ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.user_a = auth.uid() OR conversations.user_b = auth.uid())
        AND (recipient_id = conversations.user_a OR recipient_id = conversations.user_b)
        AND recipient_id <> auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_update_recipient ON messages;
CREATE POLICY messages_update_recipient ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

COMMENT ON TABLE conversations IS 'Materialized one-to-one conversation pairings; SOCA app sorts user_a/user_b before insert to avoid duplicate rows.';
COMMENT ON TABLE messages IS 'Text-only direct messages between two participants with read receipts for unread indicators.';
