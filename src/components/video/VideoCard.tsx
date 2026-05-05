import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import { alpha, theme } from '@/components/ui/theme';
import { useVideoLikeStatus } from '@/hooks/useVideoLikeStatus';
import { getVideoThumbnailUri } from '@/lib/video-thumbnails';
import type { VideoWithCounts } from '@/types/database';

function formatDuration(duration: number | null) {
  if (!duration || duration < 1) return null;

  const totalSeconds = Math.round(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function VideoCard({
  video,
  compact = false,
}: {
  video: VideoWithCounts;
  compact?: boolean;
}) {
  const router = useRouter();
  const { isLiked, like, unlike, isLoading: likeLoading } = useVideoLikeStatus(video.id);
  const ownerName =
    video.owner_profile?.display_name || video.owner_profile?.full_name || 'Unknown user';
  const duration = formatDuration(video.duration);
  const thumbnailUrl = getVideoThumbnailUri({
    videoId: video.id,
    caption: video.caption,
    thumbnailUrl: (video as VideoWithCounts & { thumbnail_url?: string | null }).thumbnail_url,
  });
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnailUrl, video.id]);

  const thumbnailStyles = [styles.thumbnail, compact && styles.thumbnailCompact];

  return (
    <Pressable onPress={() => router.push(`/video/${video.id}`)}>
      <Surface elevated style={styles.card}>
        {thumbnailUrl && !thumbnailFailed ? (
          <ImageBackground
            source={{ uri: thumbnailUrl }}
            style={thumbnailStyles}
            imageStyle={styles.thumbnailImage}
            onError={() => setThumbnailFailed(true)}
          >
            <View style={styles.thumbnailShade} />
            <LinearGradient
              colors={[...theme.gradients.videoOverlay]}
              style={styles.thumbnailOverlay}
            />
            <ThumbnailChrome compact={compact} duration={duration} />
          </ImageBackground>
        ) : (
          <View style={thumbnailStyles}>
            <View style={styles.thumbnailFallback} />
            <View style={styles.pitchOutline} />
            <View style={styles.pitchCircle} />
            <LinearGradient
              colors={[...theme.gradients.videoOverlay]}
              style={styles.thumbnailOverlay}
            />
            <ThumbnailChrome compact={compact} duration={duration} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.ownerRow}>
            <Pressable
              onPress={() =>
                video.owner_profile?.id
                  ? router.push(`/profile/${video.owner_profile.id}`)
                  : undefined
              }
              disabled={!video.owner_profile?.id}
              hitSlop={8}
            >
              <Avatar
                uri={video.owner_profile?.avatar_url}
                name={ownerName}
                size={compact ? 34 : 42}
              />
            </Pressable>
            <View style={styles.ownerCopy}>
              <Text variant={compact ? 'title' : 'subheading'} numberOfLines={2}>
                {video.caption || 'Highlight'}
              </Text>
              <Text variant="caption" style={styles.muted}>
                {ownerName} | {formatDate(video.created_at)}
              </Text>
            </View>
          </View>

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
                {video.like_count} Likes
              </Text>
            </Pressable>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={14}
                color={theme.colors.accent}
              />
              <Text variant="caption" style={styles.metaText}>
                {video.view_count} Views
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

function ThumbnailChrome({
  compact,
  duration,
}: {
  compact: boolean;
  duration: string | null;
}) {
  return (
    <>
      <View style={styles.highlightBadge}>
        <Text variant="caption" style={styles.highlightBadgeText}>
          Highlight
        </Text>
      </View>
      <View style={styles.playWrap}>
        <MaterialCommunityIcons
          name="play"
          size={compact ? 18 : 24}
          color="#FFFFFF"
        />
      </View>
      <MaterialCommunityIcons
        name="play-circle-outline"
        size={compact ? 30 : 40}
        color="rgba(255,255,255,0.18)"
        style={styles.playGlow}
      />
      {duration ? (
        <View style={styles.durationBadge}>
          <Text variant="caption" style={styles.durationText}>
            {duration}
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 208,
    backgroundColor: theme.colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailCompact: {
    height: 156,
  },
  thumbnailImage: {
    opacity: 0.96,
  },
  thumbnailShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha(theme.colors.black, 0.18),
  },
  thumbnailFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfaceDarkMuted,
  },
  pitchOutline: {
    position: 'absolute',
    top: 18,
    right: 18,
    bottom: 18,
    left: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: alpha(theme.colors.white, 0.12),
  },
  pitchCircle: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: alpha(theme.colors.white, 0.12),
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  highlightBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: alpha(theme.colors.black, 0.55),
    borderWidth: theme.border.hairline,
    borderColor: alpha(theme.colors.white, 0.1),
  },
  highlightBadgeText: {
    color: theme.colors.textPrimary,
  },
  playWrap: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.colors.white, 0.18),
    borderWidth: theme.border.regular,
    borderColor: alpha(theme.colors.white, 0.2),
    zIndex: 1,
  },
  playGlow: {
    position: 'absolute',
  },
  durationBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  body: {
    padding: theme.spacing.md,
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
