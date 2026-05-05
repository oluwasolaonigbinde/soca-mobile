import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppHeader,
  AppShell,
  Avatar,
  SearchInput,
  StateCard,
  Surface,
  Text,
  theme,
} from '@/components/ui';
import { useConversations } from '@/hooks/useMessages';
import type { ConversationSummary } from '@/types/database';

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

function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationSummary;
  onPress: () => void;
}) {
  const displayName =
    item.other_profile?.display_name ||
    item.other_profile?.full_name ||
    'Unknown user';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.rowPressed]}>
      <Surface elevated style={styles.row}>
        <View style={styles.avatarWrap}>
          <Avatar
            uri={item.other_profile?.avatar_url}
            name={displayName}
            size={56}
          />
        </View>

        <View style={styles.rowCopy}>
          <View style={styles.rowHeader}>
            <Text variant="title" style={styles.flex}>
              {displayName}
            </Text>
            <Text variant="caption" style={styles.timestamp}>
              {formatTimestamp(item.last_message_at)}
            </Text>
          </View>

          <View style={styles.rowBody}>
            <Text variant="body" style={styles.preview} numberOfLines={2}>
              {item.last_message_text ?? 'No messages yet. Tap to start the thread.'}
            </Text>
            {item.unread_count > 0 ? (
              <View style={styles.unreadBadge}>
                <Text variant="caption" style={styles.unreadText}>
                  {item.unread_count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, error, refetch } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!data || !searchQuery.trim()) return data ?? [];
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      const name =
        item.other_profile?.display_name ||
        item.other_profile?.full_name ||
        '';
      return name.toLowerCase().includes(q);
    });
  }, [data, searchQuery]);

  return (
    <AppShell
      header={
        <AppHeader badge="MESSAGES" title="Messages" />
      }
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : error ? (
        <StateCard
          title="Unable to load messages"
          description="Check your connection and try again."
          tone="danger"
          icon="alert-circle-outline"
          actionLabel="Retry"
          onActionPress={() => refetch()}
          loading={isRefetching}
        />
      ) : !data?.length ? (
        <StateCard
          title="No conversations yet"
          description="Open a player or scout profile and use the message action to start a thread."
          tone="tint"
          icon="message-text-outline"
        />
      ) : (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            containerStyle={styles.search}
          />
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ConversationRow
                item={item}
                onPress={() => router.push(`/messages/${item.id}`)}
              />
            )}
          />
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  rowPressed: {
    opacity: 0.92,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
  rowCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  timestamp: {
    color: theme.colors.textSoft,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    color: theme.colors.textMuted,
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
  },
  unreadText: {
    color: theme.colors.textInverse,
  },
});
