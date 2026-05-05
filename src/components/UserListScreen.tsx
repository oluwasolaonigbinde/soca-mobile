import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Screen } from '@/components/ui/Screen';
import { StateCard } from '@/components/ui/StateCard';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { Profile } from '@/types/database';

interface UserListScreenProps {
  data: Profile[] | undefined;
  isLoading: boolean;
  error: unknown;
  errorLabel: string;
  emptyLabel: string;
  errorDescription?: string;
  emptyDescription?: string;
  errorIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  emptyIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function UserListScreen({
  data,
  isLoading,
  error,
  errorLabel,
  emptyLabel,
  errorDescription,
  emptyDescription,
  errorIcon,
  emptyIcon,
}: UserListScreenProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.centered}>
        <StateCard
          title={errorLabel}
          description={errorDescription}
          tone="danger"
          icon={errorIcon}
        />
      </Screen>
    );
  }

  if (!data?.length) {
    return (
      <Screen style={styles.centered}>
        <StateCard
          title={emptyLabel}
          description={emptyDescription}
          tone="tint"
          icon={emptyIcon}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/profile/${item.id}`)}>
            <Surface elevated style={styles.row}>
              <Avatar
                uri={item.avatar_url}
                name={item.display_name || item.full_name || 'Unknown'}
                size={44}
              />
              <View style={styles.copy}>
                <Text variant="title">
                  {item.display_name || item.full_name || 'Unknown'}
                </Text>
                {item.location ? (
                  <Text variant="caption" style={styles.meta}>
                    {item.location}
                  </Text>
                ) : null}
              </View>
            </Surface>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  meta: {
    color: theme.colors.textMuted,
  },
});
