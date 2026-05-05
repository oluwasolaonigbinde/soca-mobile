import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { usePostLikeStatus } from '@/hooks/usePostLikeStatus';
import type { PostWithContent } from '@/types/database';

import { VideoCard } from '../video/VideoCard';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function PostCard({ post }: { post: PostWithContent }) {
  const router = useRouter();
  const { isLiked, like, unlike, isLoading: likeLoading } = usePostLikeStatus(
    post.video_id ? undefined : post.id,
    post.is_liked,
  );
  // Clamp to 0: server-side like_count can lag the optimistic is_liked flag
  // (e.g. demo mode, stale cache, multi-tab) and would otherwise render -1.
  const displayedLikeCount = Math.max(
    0,
    post.like_count + (isLiked ? 1 : 0) - (post.is_liked ? 1 : 0),
  );

  if (post.video) {
    return <VideoCard video={post.video} />;
  }

  const ownerName =
    post.owner_profile?.display_name || post.owner_profile?.full_name || 'Unknown user';

  return (
    <Surface elevated style={styles.card}>
      <View style={styles.ownerRow}>
        <Pressable
          onPress={() =>
            post.owner_profile?.id ? router.push(`/profile/${post.owner_profile.id}`) : undefined
          }
          disabled={!post.owner_profile?.id}
          hitSlop={8}
        >
          <Avatar uri={post.owner_profile?.avatar_url} name={ownerName} size={42} />
        </Pressable>
        <View style={styles.ownerCopy}>
          <Text variant="subheading" numberOfLines={2}>
            {ownerName}
          </Text>
          <Text variant="caption" style={styles.muted}>
            Post | {formatDate(post.created_at)}
          </Text>
        </View>
      </View>

      {post.body ? (
        <Text variant="body" style={styles.body}>
          {post.body}
        </Text>
      ) : null}

      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.metaRow}>
        <Pressable
          style={styles.metaPill}
          onPress={() => (isLiked ? unlike() : like())}
          disabled={likeLoading}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={14}
            color={theme.colors.accent}
          />
          <Text variant="caption" style={[styles.metaText, isLiked && styles.metaTextLiked]}>
            {displayedLikeCount} Likes
          </Text>
        </Pressable>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons
            name={post.image_url ? 'image-outline' : 'text-box-outline'}
            size={14}
            color={theme.colors.accent}
          />
          <Text variant="caption" style={styles.metaText}>
            {post.image_url ? 'Image post' : 'Text post'}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  ownerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  ownerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  body: {
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceTint,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  metaTextLiked: {
    color: theme.colors.accent,
  },
});
