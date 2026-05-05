import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StateCard } from '@/components/ui/StateCard';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import { alpha, theme } from '@/components/ui/theme';
import { useConversationThread } from '@/hooks/useMessages';
import {
  markConversationRead,
  sendMessage as sendConversationMessage,
} from '@/lib/messages';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth';

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(parsed));
}

export default function MessageThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const [draft, setDraft] = useState('');

  const { data, isLoading, error } = useConversationThread(conversationId);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) {
        throw new Error('Conversation not found.');
      }

      await sendConversationMessage(conversationId, draft);
    },
    onSuccess: async () => {
      setDraft('');
      await queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['messages', 'conversations'],
      });
    },
  });

  useEffect(() => {
    if (!conversationId || !data?.unread_count) {
      return;
    }

    markConversationRead(conversationId)
      .then(async () => {
        await queryClient.invalidateQueries({
          queryKey: ['messages', 'conversation', conversationId],
        });
        await queryClient.invalidateQueries({
          queryKey: ['messages', 'conversations'],
        });
      })
      .catch(() => {});
  }, [conversationId, data?.unread_count]);

  const onSend = async () => {
    try {
      await sendMessageMutation.mutateAsync();
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Unable to send message.';

      if (Platform.OS === 'web') {
        window.alert(`Message failed: ${message}`);
      } else {
        Alert.alert('Message failed', message);
      }
    }
  };

  if (!conversationId || isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen style={styles.centered}>
        <StateCard
          title={error instanceof Error ? error.message : 'Conversation not found.'}
          tone="danger"
        />
      </Screen>
    );
  }

  const title =
    data.other_profile?.display_name ||
    data.other_profile?.full_name ||
    'Conversation';

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardFrame}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Surface elevated style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Back to messages"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          <Avatar
            uri={data.other_profile?.avatar_url}
            name={title}
            size={42}
          />

          <View style={styles.headerCopy}>
            <Text variant="title" numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text variant="caption" style={styles.headerCaption}>
              {data.messages.length} message{data.messages.length === 1 ? '' : 's'}
            </Text>
          </View>
        </Surface>

        <ScrollView
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
          keyboardShouldPersistTaps="handled"
        >
          {data.messages.length ? (
            data.messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                  ]}
                >
                  <Text
                    variant="body"
                    style={[
                      styles.messageText,
                      isOwnMessage ? styles.ownMessageText : null,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    variant="caption"
                    style={[
                      styles.messageMeta,
                      isOwnMessage ? styles.ownMessageMeta : null,
                    ]}
                  >
                    {formatTimestamp(message.created_at)}
                  </Text>
                </View>
              );
            })
          ) : (
            <StateCard
              title="No messages yet"
              description="Send the first message to start this conversation."
              tone="tint"
            />
          )}
        </ScrollView>

        <Surface elevated style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message"
            multiline
            style={styles.input}
            placeholderTextColor={theme.colors.textSoft}
          />
          <Button
            title={sendMessageMutation.isPending ? 'Sending...' : 'Send'}
            size="small"
            onPress={onSend}
            disabled={sendMessageMutation.isPending || !draft.trim()}
            style={styles.sendButton}
          />
        </Surface>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  keyboardFrame: {
    flex: 1,
    gap: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceDark,
    borderColor: theme.colors.borderStrong,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
  pressed: {
    opacity: 0.82,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
  },
  headerCaption: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: theme.border.hairline,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: theme.radius.xs,
    backgroundColor: theme.colors.accent,
    borderColor: alpha(theme.colors.accent, 0.45),
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.borderStrong,
  },
  messageText: {
    color: theme.colors.textPrimary,
  },
  ownMessageText: {
    color: theme.colors.textInverse,
    fontWeight: '500',
  },
  messageMeta: {
    color: theme.colors.textSoft,
  },
  ownMessageMeta: {
    color: alpha(theme.colors.black, 0.58),
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceDark,
    borderColor: theme.colors.borderStrong,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 104,
    borderWidth: theme.border.regular,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 11 : theme.spacing.sm,
    textAlignVertical: 'top',
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  sendButton: {
    minHeight: 42,
    borderRadius: theme.radius.lg,
  },
});
