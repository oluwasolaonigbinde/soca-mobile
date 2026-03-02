import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useFollowStatus } from '@/hooks/useFollowStatus';
import { useProfileById } from '@/hooks/useProfileById';
import { recordProfileView } from '@/lib/profile-views';
import { useAuthStore } from '@/store/auth';
import type { ProfileWithCounts } from '@/types/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const ROLE_LABELS: Record<string, string> = {
  player: 'Player',
  scout: 'Scout',
  club: 'Club',
  org: 'Organization',
};

function StatBlock({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.statBlock}>
      <Text variant="subheading" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const viewedRef = useRef<Set<string>>(new Set());

  const { data: profile, isLoading, error } = useProfileById(id);
  const { isFollowing, isLoading: followLoading, follow, unfollow } = useFollowStatus(id);
  const isOwnProfile = !!id && id === currentUserId;

  useEffect(() => {
    if (id && currentUserId && !viewedRef.current.has(id)) {
      viewedRef.current.add(id);
      recordProfileView(id);
    }
  }, [id, currentUserId]);

  if (isLoading || !id) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen style={styles.centered}>
        <Text variant="body">Profile not found.</Text>
      </Screen>
    );
  }

  const p = profile as ProfileWithCounts;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {p.avatar_url ? (
            <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <Text variant="heading" style={styles.displayName}>
            {p.display_name || p.full_name || 'Unknown'}
          </Text>
          {p.role && (
            <Text variant="caption" style={styles.role}>
              {ROLE_LABELS[p.role] ?? p.role}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatBlock
            label="Followers"
            value={p.follower_count ?? 0}
            onPress={isOwnProfile ? () => router.push('/me/followers') : undefined}
          />
          <StatBlock
            label="Following"
            value={p.following_count ?? 0}
            onPress={isOwnProfile ? () => router.push('/me/following') : undefined}
          />
          <StatBlock label="Profile views" value={p.profile_views_count ?? 0} />
        </View>

        {p.bio ? (
          <View style={styles.bioSection}>
            <Text variant="body">{p.bio}</Text>
          </View>
        ) : null}
        {p.location ? (
          <Text variant="caption" style={styles.location}>
            {p.location}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {isOwnProfile ? (
            <Button
              title="Edit Profile"
              onPress={() => router.push('/me/edit-profile')}
            />
          ) : (
            <Button
              title={followLoading ? '…' : isFollowing ? 'Unfollow' : 'Follow'}
              variant={isFollowing ? 'outline' : 'solid'}
              onPress={() => (isFollowing ? unfollow() : follow())}
              disabled={followLoading}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
  },
  displayName: {
    marginTop: 12,
  },
  role: {
    marginTop: 4,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
  },
  bioSection: {
    marginBottom: 12,
  },
  location: {
    color: '#666',
    marginBottom: 24,
  },
  actions: {
    marginTop: 8,
  },
});
