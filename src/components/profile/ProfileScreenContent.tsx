import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { getVerificationBadgeCopy } from '@/lib/admin';
import { getOrCreateConversation } from '@/lib/messages';
import { getAgeFromBirthYear, getShortPositionLabel } from '@/lib/profile';
import { recordProfileView } from '@/lib/profile-views';
import { useAuthStore } from '@/store/auth';
import type { ProfileWithCounts } from '@/types/database';
import { useFollowStatus } from '@/hooks/useFollowStatus';
import { useProfilePosts } from '@/hooks/usePosts';
import { useProfileById } from '@/hooks/useProfileById';
import { useProfileVideos } from '@/hooks/useVideos';
import { getVideoThumbnailUri } from '@/lib/video-thumbnails';

import { PostCard } from '../feed/PostCard';
import {
  AppShell,
  Avatar,
  Button,
  GradientCard,
  MetricPill,
  Screen,
  SectionHeader,
  StateCard,
  Surface,
  TabSwitch,
  Text,
  alpha,
  theme,
} from '../ui';

const ROLE_LABELS: Record<string, string> = {
  player: 'Player',
  scout: 'Scout',
  club: 'Club',
  org: 'Organization',
};

interface ProfileScreenContentProps {
  profileId: string | undefined;
  mode?: 'public' | 'tab';
}

function StatAction({
  label,
  value,
  onPress,
  dark = false,
}: {
  label: string;
  value: number;
  onPress?: () => void;
  dark?: boolean;
}) {
  const content = <MetricPill value={value} label={label} dark={dark} compact />;

  if (!onPress) {
    return <View style={styles.statItem}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={styles.statItem}>
      {content}
    </Pressable>
  );
}

export function ProfileScreenContent({
  profileId,
  mode = 'public',
}: ProfileScreenContentProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const loading = useAuthStore((s) => s.loading);
  const currentUserId = session?.user?.id;
  const viewedRef = useRef<Set<string>>(new Set());
  const [startingConversation, setStartingConversation] = useState(false);
  const [profileTab, setProfileTab] = useState<'posts' | 'highlights' | 'about'>('posts');

  const { data: profile, isLoading, error } = useProfileById(profileId);
  const { data: posts, isLoading: postsLoading } = useProfilePosts(profileId);
  const { data: videos, isLoading: videosLoading } = useProfileVideos(profileId);
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
  } = useFollowStatus(profileId);
  const isOwnProfile = !!profileId && profileId === currentUserId;

  useEffect(() => {
    if (profileId && currentUserId && !viewedRef.current.has(profileId)) {
      viewedRef.current.add(profileId);
      recordProfileView(profileId).catch(() => {});
    }
  }, [profileId, currentUserId]);

  const onStartConversation = async () => {
    if (!profileId) return;

    try {
      setStartingConversation(true);
      const conversation = await getOrCreateConversation(profileId);
      router.push(`/messages/${conversation.id}`);
    } catch (conversationError) {
      const message =
        conversationError instanceof Error
          ? conversationError.message
          : 'Unable to start conversation.';

      if (Platform.OS === 'web') {
        window.alert(`Message failed: ${message}`);
      } else {
        Alert.alert('Message failed', message);
      }
    } finally {
      setStartingConversation(false);
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch (signOutError) {
      const message =
        signOutError instanceof Error ? signOutError.message : 'Sign out failed';

      if (Platform.OS === 'web') {
        window.alert(`Sign out failed: ${message}`);
      } else {
        Alert.alert('Sign out failed', message);
      }
    }
  };

  if (isLoading || !profileId) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen style={styles.centered}>
        <StateCard
          title="Profile not found"
          description="The requested profile could not be loaded."
          tone="danger"
          icon="account-search-outline"
        />
      </Screen>
    );
  }

  const p = profile as ProfileWithCounts;
  const age = getAgeFromBirthYear(p.birth_year);
  const shortPosition = getShortPositionLabel(p.position);
  const verificationCopy = getVerificationBadgeCopy(p);

  const content = (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <GradientCard colors={theme.gradients.profileHero} style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Avatar
            uri={p.avatar_url}
            cacheKey={p.updated_at}
            name={p.display_name || p.full_name || 'Profile'}
            size={76}
            style={styles.heroAvatar}
          />

          <View style={styles.heroMain}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroCopy}>
                <Text variant="heading" style={styles.heroName}>
                  {p.display_name || p.full_name || 'Unknown'}
                </Text>
                <View style={styles.heroMeta}>
                  {shortPosition ? (
                    <View style={styles.positionBadge}>
                      <Text variant="caption" style={styles.positionBadgeText}>
                        {shortPosition}
                      </Text>
                    </View>
                  ) : null}
                  {p.role ? (
                    <View style={styles.rolePill}>
                      <Text variant="caption" style={styles.rolePillText}>
                        {ROLE_LABELS[p.role] ?? p.role}
                      </Text>
                    </View>
                  ) : null}
                  {verificationCopy ? (
                    <View style={styles.verifiedPill}>
                      <Text variant="caption" style={styles.verifiedText}>
                        {verificationCopy}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.heroDetailRow}>
                  {p.location ? (
                    <Text variant="caption" style={styles.heroDetailText}>
                      {p.location}
                    </Text>
                  ) : null}
                  {age !== null ? (
                    <Text variant="caption" style={styles.heroDetailText}>
                      {age} yrs
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.heroActions}>
                {isOwnProfile ? (
                  <Button
                    title="Edit Profile"
                    size="small"
                    onPress={() => router.push('/me/edit-profile' as Href)}
                  />
                ) : (
                  <>
                    <Button
                      title={followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                      variant={isFollowing ? 'outline' : 'solid'}
                      size="small"
                      onPress={() => (isFollowing ? unfollow() : follow())}
                      disabled={followLoading}
                    />
                    <Button
                      title={startingConversation ? 'Opening...' : 'Message'}
                      variant="outline"
                      size="small"
                      onPress={onStartConversation}
                      disabled={startingConversation}
                    />
                  </>
                )}
              </View>
            </View>

            {p.bio ? (
              <Text variant="body" style={styles.heroBio}>
                {p.bio}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatAction
            label="Followers"
            value={p.follower_count ?? 0}
            dark
            onPress={isOwnProfile ? () => router.push('/me/followers' as Href) : undefined}
          />
          <StatAction
            label="Following"
            value={p.following_count ?? 0}
            dark
            onPress={isOwnProfile ? () => router.push('/me/following' as Href) : undefined}
          />
          <StatAction label="Posts" value={posts?.length ?? 0} dark />
          <StatAction label="Videos" value={videos?.length ?? 0} dark />
        </View>

        {!isOwnProfile ? (
          <View style={styles.profileSecondaryActions}>
            <Button
              title="Report Profile"
              variant="ghost"
              size="small"
              onPress={() =>
                router.push({
                  pathname: '/report/new',
                  params: {
                    contentType: 'profile',
                    contentId: p.id,
                    label: p.display_name || p.full_name || 'Profile',
                  },
                })
              }
            />
          </View>
        ) : null}
      </GradientCard>

      <View style={styles.section}>
        <TabSwitch
          options={[
            { value: 'posts', label: 'Posts' },
            { value: 'highlights', label: 'Highlights' },
            { value: 'about', label: 'About' },
          ]}
          value={profileTab}
          onChange={(v) => setProfileTab(v as 'posts' | 'highlights' | 'about')}
        />

        {profileTab === 'posts' ? (
          <>
            <SectionHeader
              title="Posts"
              subtitle={
                isOwnProfile
                  ? 'Your updates and video posts in one timeline.'
                  : 'Updates and video posts from this profile.'
              }
              actionLabel={isOwnProfile ? 'Create' : undefined}
              onActionPress={isOwnProfile ? () => router.push('/upload/video') : undefined}
            />
            {postsLoading ? (
              <View style={styles.centeredInline}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
              </View>
            ) : posts?.length ? (
              <View style={styles.postList}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            ) : (
              <StateCard
                title="No posts yet"
                description={
                  isOwnProfile
                    ? 'Create a post or upload a video to get started.'
                    : 'No posts published yet.'
                }
                tone="tint"
                icon="post-outline"
              />
            )}
          </>
        ) : null}

        {profileTab === 'highlights' ? (
          <>
            <SectionHeader
              title="Video Highlights"
              subtitle={
                isOwnProfile
                  ? 'Your video-only highlight library.'
                  : 'Published football clips from this profile.'
              }
              actionLabel={isOwnProfile ? 'Upload' : undefined}
              onActionPress={isOwnProfile ? () => router.push('/upload/video') : undefined}
            />
            {videosLoading ? (
              <View style={styles.centeredInline}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
              </View>
            ) : videos?.length ? (
              <View style={styles.videoGrid}>
                {videos.map((video) => (
                  <Pressable
                    key={video.id}
                    onPress={() => router.push(`/video/${video.id}`)}
                    style={styles.videoTile}
                  >
                    <ImageBackground
                      source={{
                        uri: getVideoThumbnailUri({
                          videoId: video.id,
                          caption: video.caption,
                          thumbnailUrl: (video as typeof video & { thumbnail_url?: string | null }).thumbnail_url,
                        }),
                      }}
                      style={styles.videoTileImage}
                      imageStyle={styles.videoTileImageInner}
                    >
                      <View style={styles.videoTileShade} />
                      <MaterialCommunityIcons
                        name="play-circle-outline"
                        size={34}
                        color="#FFFFFF"
                        style={styles.videoTileIcon}
                      />
                      <Text variant="caption" numberOfLines={2} style={styles.videoTileCaption}>
                        {video.caption || 'Highlight'}
                      </Text>
                    </ImageBackground>
                  </Pressable>
                ))}
              </View>
            ) : (
              <StateCard
                title="No highlights yet"
                description={
                  isOwnProfile
                    ? 'Upload a highlight to get started.'
                    : 'No highlight videos published yet.'
                }
                tone="tint"
                icon="play-box-outline"
              />
            )}
          </>
        ) : (
          null
        )}

        {profileTab === 'about' ? (
          <View style={styles.aboutStack}>
            <Surface elevated style={styles.aboutCard}>
              <View style={styles.aboutBlock}>
                <Text variant="label" style={styles.aboutSectionTitle}>
                  Bio
                </Text>
                <Text variant="body" style={styles.aboutValue}>
                  {p.bio || 'No bio yet.'}
                </Text>
              </View>

              <View style={styles.aboutGrid}>
                <View style={styles.aboutDetail}>
                  <Text variant="caption" style={styles.aboutLabel}>
                    Position
                  </Text>
                  <Text variant="body" style={styles.aboutValue}>
                    {shortPosition || p.position || '-'}
                  </Text>
                </View>
                <View style={styles.aboutDetail}>
                  <Text variant="caption" style={styles.aboutLabel}>
                    Location
                  </Text>
                  <Text variant="body" style={styles.aboutValue}>
                    {p.location || '-'}
                  </Text>
                </View>
                <View style={styles.aboutDetail}>
                  <Text variant="caption" style={styles.aboutLabel}>
                    Role
                  </Text>
                  <Text variant="body" style={styles.aboutValue}>
                    {p.role ? ROLE_LABELS[p.role] ?? p.role : '-'}
                  </Text>
                </View>
                <View style={styles.aboutDetail}>
                  <Text variant="caption" style={styles.aboutLabel}>
                    Age
                  </Text>
                  <Text variant="body" style={styles.aboutValue}>
                    {age !== null ? `${age}` : '-'}
                  </Text>
                </View>
              </View>
            </Surface>

            {p.achievements?.length ? (
              <Surface elevated style={styles.aboutCard}>
                <SectionHeader
                  title="Achievements"
                  subtitle="Official results awarded by SOCA admins."
                />
                <View style={styles.achievementList}>
                  {p.achievements.map((achievement) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                      <Text variant="title">{achievement.title}</Text>
                      {achievement.description ? (
                        <Text variant="body" style={styles.aboutValue}>
                          {achievement.description}
                        </Text>
                      ) : null}
                      <Text variant="caption" style={styles.aboutLabel}>
                        Awarded {new Date(achievement.awarded_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </Surface>
            ) : null}
          </View>
        ) : null}
      </View>

      {mode === 'tab' ? (
        <Surface tone="tint" style={styles.signOutCard}>
          <Button
            title={loading ? 'Signing out...' : 'Sign Out'}
            variant="outline"
            size="small"
            onPress={onSignOut}
            disabled={loading}
          />
        </Surface>
      ) : null}
    </ScrollView>
  );

  if (mode === 'tab') {
    return <AppShell>{content}</AppShell>;
  }

  return <Screen>{content}</Screen>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  scroll: {
    paddingBottom: theme.spacing.jumbo,
    gap: theme.spacing.xl,
  },
  heroCard: {
    gap: theme.spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  heroAvatar: {
    borderWidth: 2,
    borderColor: alpha(theme.colors.white, 0.18),
  },
  heroMain: {
    flex: 1,
    gap: theme.spacing.md,
  },
  heroHeaderRow: {
    gap: theme.spacing.md,
  },
  heroCopy: {
    gap: theme.spacing.xs,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  heroName: {
    color: theme.colors.textOnDark,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  positionBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.accent,
  },
  positionBadgeText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  rolePill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: alpha(theme.colors.white, 0.14),
  },
  rolePillText: {
    color: theme.colors.textOnDarkMuted,
  },
  verifiedPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: alpha(theme.colors.white, 0.14),
  },
  verifiedText: {
    color: theme.colors.textOnDark,
  },
  heroBio: {
    color: theme.colors.textOnDarkMuted,
  },
  heroDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  heroDetailText: {
    color: alpha(theme.colors.white, 0.78),
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: theme.spacing.xs,
  },
  statItem: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: theme.spacing.lg,
  },
  profileSecondaryActions: {
    alignItems: 'flex-start',
  },
  centeredInline: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  postList: {
    gap: theme.spacing.md,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  videoTile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceDark,
  },
  videoTileImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.sm,
  },
  videoTileImageInner: {
    borderRadius: theme.radius.md,
  },
  videoTileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha(theme.colors.black, 0.24),
  },
  videoTileIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  videoTileCaption: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
  signOutCard: {
    padding: theme.spacing.xl,
  },
  aboutCard: {
    gap: theme.spacing.lg,
  },
  aboutStack: {
    gap: theme.spacing.md,
  },
  aboutBlock: {
    gap: theme.spacing.xs,
  },
  aboutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  aboutDetail: {
    minWidth: 128,
    flex: 1,
    gap: 2,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceDark,
  },
  aboutLabel: {
    color: theme.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aboutSectionTitle: {
    color: theme.colors.textPrimary,
  },
  aboutValue: {
    color: theme.colors.textPrimary,
  },
  achievementList: {
    gap: theme.spacing.sm,
  },
  achievementItem: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
});
