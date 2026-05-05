import {
  DEMO_MODE_ENABLED,
  getDemoConversationThread,
  getOrCreateDemoConversation,
  isDemoConversationId,
  isDemoProfileId,
  listDemoConversations,
  markDemoConversationRead,
  sendDemoMessage,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type {
  Conversation,
  ConversationSummary,
  ConversationThread,
  Message,
  ProfilePreview,
} from '@/types/database';

type RawRow = Record<string, unknown>;

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === '42P01' ||
    candidate.message?.includes('does not exist') === true ||
    candidate.message?.includes('Could not find the table') === true
  );
}

function normalizeConversation(row: RawRow): Conversation | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const userA = typeof row.user_a === 'string' ? row.user_a : null;
  const userB = typeof row.user_b === 'string' ? row.user_b : null;
  const createdAt = typeof row.created_at === 'string' ? row.created_at : null;
  const lastMessageAt =
    typeof row.last_message_at === 'string'
      ? row.last_message_at
      : createdAt;

  if (!id || !userA || !userB || !createdAt || !lastMessageAt) {
    return null;
  }

  return {
    id,
    user_a: userA,
    user_b: userB,
    last_message_at: lastMessageAt,
    created_at: createdAt,
  };
}

function normalizeMessage(row: RawRow): Message | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const conversationId =
    typeof row.conversation_id === 'string' ? row.conversation_id : null;
  const senderId = typeof row.sender_id === 'string' ? row.sender_id : null;
  const recipientId =
    typeof row.recipient_id === 'string' ? row.recipient_id : null;
  const text = typeof row.text === 'string' ? row.text : null;
  const createdAt = typeof row.created_at === 'string' ? row.created_at : null;
  const readAt = typeof row.read_at === 'string' ? row.read_at : null;

  if (!id || !conversationId || !senderId || !recipientId || !text || !createdAt) {
    return null;
  }

  return {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    text,
    created_at: createdAt,
    read_at: readAt,
  };
}

function normalizeProfilePreview(row: RawRow): ProfilePreview | null {
  const id = typeof row.id === 'string' ? row.id : null;
  if (!id) return null;

  const role = row.role;
  return {
    id,
    display_name: typeof row.display_name === 'string' ? row.display_name : null,
    full_name: typeof row.full_name === 'string' ? row.full_name : null,
    avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
    role:
      role === 'player' || role === 'scout' || role === 'club' || role === 'org'
        ? role
        : null,
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('You must be logged in to use messaging.');
  return user.id;
}

function getSortedParticipants(currentUserId: string, otherUserId: string) {
  return [currentUserId, otherUserId].sort((left, right) =>
    left.localeCompare(right),
  ) as [string, string];
}

function getOtherParticipantId(conversation: Conversation, currentUserId: string) {
  if (conversation.user_a === currentUserId) return conversation.user_b;
  if (conversation.user_b === currentUserId) return conversation.user_a;
  throw new Error('You are not a participant in this conversation.');
}

function getMissingSchemaError() {
  return new Error(
    'Messaging tables are not available yet. Run docs/schema-06-messaging.sql in Supabase first.',
  );
}

export async function getOrCreateConversation(otherUserId: string): Promise<Conversation> {
  const currentUserId = await getCurrentUserId();

  if (currentUserId === otherUserId) {
    throw new Error('You cannot message yourself.');
  }

  if (DEMO_MODE_ENABLED && isDemoProfileId(otherUserId)) {
    return getOrCreateDemoConversation(currentUserId, otherUserId);
  }

  const [userA, userB] = getSortedParticipants(currentUserId, otherUserId);

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
    .maybeSingle();

  if (existingError) {
    if (isMissingRelationError(existingError)) {
      throw getMissingSchemaError();
    }
    throw existingError;
  }

  const existingConversation = existing
    ? normalizeConversation(existing as RawRow)
    : null;

  if (existingConversation) {
    return existingConversation;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_a: userA,
      user_b: userB,
      last_message_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      throw getMissingSchemaError();
    }
    throw error;
  }

  const conversation = normalizeConversation(data as RawRow);
  if (!conversation) {
    throw new Error('Conversation could not be created.');
  }

  return conversation;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const currentUserId = await getCurrentUserId();
  if (DEMO_MODE_ENABLED) {
    return listDemoConversations(currentUserId, useAuthStore.getState().profile);
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const conversations = ((data as RawRow[] | null) ?? [])
    .map(normalizeConversation)
    .filter((conversation): conversation is Conversation => !!conversation);

  if (conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const otherParticipantIds = Array.from(
    new Set(
      conversations.map((conversation) =>
        getOtherParticipantId(conversation, currentUserId),
      ),
    ),
  );

  const [
    { data: messageRows, error: messageError },
    { data: unreadRows, error: unreadError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, recipient_id, text, created_at, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('recipient_id', currentUserId)
      .is('read_at', null),
    supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, role')
      .in('id', otherParticipantIds),
  ]);

  if (messageError) {
    if (isMissingRelationError(messageError)) return [];
    throw messageError;
  }
  if (unreadError) {
    if (isMissingRelationError(unreadError)) return [];
    throw unreadError;
  }
  if (profileError) throw profileError;

  const latestMessageByConversation = new Map<string, Message>();
  for (const row of (messageRows as RawRow[] | null) ?? []) {
    const message = normalizeMessage(row);
    if (!message || latestMessageByConversation.has(message.conversation_id)) {
      continue;
    }

    latestMessageByConversation.set(message.conversation_id, message);
  }

  const unreadCountByConversation = ((unreadRows as RawRow[] | null) ?? []).reduce(
    (counts, row) => {
      const conversationId =
        typeof row.conversation_id === 'string' ? row.conversation_id : null;
      if (!conversationId) return counts;

      counts.set(conversationId, (counts.get(conversationId) ?? 0) + 1);
      return counts;
    },
    new Map<string, number>(),
  );

  const profileMap = new Map(
    ((profileRows as RawRow[] | null) ?? [])
      .map(normalizeProfilePreview)
      .filter((profile): profile is ProfilePreview => !!profile)
      .map((profile) => [profile.id, profile]),
  );

  return conversations.map((conversation) => {
    const otherParticipantId = getOtherParticipantId(conversation, currentUserId);
    const latestMessage = latestMessageByConversation.get(conversation.id);

    return {
      ...conversation,
      other_profile: profileMap.get(otherParticipantId) ?? null,
      last_message_text: latestMessage?.text ?? null,
      unread_count: unreadCountByConversation.get(conversation.id) ?? 0,
    };
  });
}

export async function getConversationThread(
  conversationId: string,
): Promise<ConversationThread | null> {
  const currentUserId = await getCurrentUserId();
  if (DEMO_MODE_ENABLED && isDemoConversationId(conversationId)) {
    return getDemoConversationThread(
      conversationId,
      currentUserId,
      useAuthStore.getState().profile,
    );
  }

  const { data: conversationRow, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationError) {
    if (isMissingRelationError(conversationError)) return null;
    throw conversationError;
  }

  if (!conversationRow) {
    return null;
  }

  const conversation = normalizeConversation(conversationRow as RawRow);
  if (!conversation) {
    return null;
  }

  const otherParticipantId = getOtherParticipantId(conversation, currentUserId);

  const [
    { data: messageRows, error: messageError },
    { data: profileRow, error: profileError },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, recipient_id, text, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, role')
      .eq('id', otherParticipantId)
      .maybeSingle(),
  ]);

  if (messageError) {
    if (isMissingRelationError(messageError)) {
      return {
        conversation,
        other_profile: null,
        messages: [],
        unread_count: 0,
      };
    }
    throw messageError;
  }
  if (profileError && profileError.code !== 'PGRST116') throw profileError;

  const messages = ((messageRows as RawRow[] | null) ?? [])
    .map(normalizeMessage)
    .filter((message): message is Message => !!message);

  const unreadCount = messages.filter(
    (message) => message.recipient_id === currentUserId && !message.read_at,
  ).length;

  return {
    conversation,
    other_profile: profileRow ? normalizeProfilePreview(profileRow as RawRow) : null,
    messages,
    unread_count: unreadCount,
  };
}

export async function markConversationRead(conversationId: string) {
  const currentUserId = await getCurrentUserId();
  if (DEMO_MODE_ENABLED && isDemoConversationId(conversationId)) {
    markDemoConversationRead(conversationId, currentUserId);
    return;
  }

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', currentUserId)
    .is('read_at', null);

  if (error) {
    if (isMissingRelationError(error)) return;
    throw error;
  }
}

export async function sendMessage(conversationId: string, text: string) {
  const currentUserId = await getCurrentUserId();
  if (DEMO_MODE_ENABLED && isDemoConversationId(conversationId)) {
    sendDemoMessage(conversationId, currentUserId, text);
    return;
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error('Write a message before sending.');
  }

  const { data: conversationRow, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationError) {
    if (isMissingRelationError(conversationError)) {
      throw getMissingSchemaError();
    }
    throw conversationError;
  }

  if (!conversationRow) {
    throw new Error('Conversation not found.');
  }

  const conversation = normalizeConversation(conversationRow as RawRow);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  const recipientId = getOtherParticipantId(conversation, currentUserId);
  const now = new Date().toISOString();

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: currentUserId,
    recipient_id: recipientId,
    text: trimmedText,
  });

  if (error) {
    if (isMissingRelationError(error)) {
      throw getMissingSchemaError();
    }
    throw error;
  }

  const { error: updateError } = await supabase
    .from('conversations')
    .update({ last_message_at: now })
    .eq('id', conversationId);

  if (updateError) throw updateError;
}
