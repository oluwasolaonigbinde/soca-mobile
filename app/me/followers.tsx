import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

export default function FollowersScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const { data: followers, isLoading, error } = useFollowers(currentUserId);

  if (isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.centered}>
        <Text variant="body">Failed to load followers.</Text>
      </Screen>
    );
  }

  if (!followers?.length) {
    return (
      <Screen style={styles.centered}>
        <Text variant="body" style={styles.emptyText}>
          No followers yet.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/profile/${item.id}`)}
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <Text variant="body" style={styles.name}>
              {item.display_name || item.full_name || 'Unknown'}
            </Text>
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
  },
  emptyText: {
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
  },
  name: {
    flex: 1,
  },
});
