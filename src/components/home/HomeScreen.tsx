import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { UserRole } from '@/types/database';
import { FeedTimeline } from '@/components/feed/FeedTimeline';
import {
  AppShell,
  Surface,
  SectionHeader,
  Text,
  theme,
} from '@/components/ui';

interface HomeScreenProps {
  role: UserRole;
}

interface HomeConfig {
  badge: string;
  title: string;
  feedSubtitle: string;
  primaryAction: {
    title: string;
    caption: string;
    icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    target: Href;
  };
  quickActions: {
    title: string;
    caption: string;
    icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    target: Href;
  }[];
}

const HOME_CONFIG: Record<UserRole, HomeConfig> = {
  player: {
    badge: 'PLAYER HOME',
    title: 'Build your football profile',
    feedSubtitle: 'Updates, announcements, and standout clips from your football network.',
    primaryAction: {
      title: 'Create post',
      caption: 'Share an update, photo, or highlight from your latest session.',
      icon: 'plus-box-outline',
      target: '/upload/video' as Href,
    },
    quickActions: [
      {
        title: 'Upload highlight',
        caption: 'Add a video to your profile Highlights tab.',
        icon: 'video-plus-outline',
        target: '/upload/video' as Href,
      },
      {
        title: 'Open challenges',
        caption: 'Find open showcases and submit your best clip.',
        icon: 'trophy-outline',
        target: '/challenges' as Href,
      },
    ],
  },
  scout: {
    badge: 'SCOUT HOME',
    title: 'Find players worth a closer look',
    feedSubtitle: 'Fresh posts, player announcements, and recent clips for quick scouting passes.',
    primaryAction: {
      title: 'Discover players',
      caption: 'Filter by role, position, location, age, and recommendation signals.',
      icon: 'account-search-outline',
      target: '/discover' as Href,
    },
    quickActions: [
      {
        title: 'Review messages',
        caption: 'Pick up conversations with players and clubs.',
        icon: 'message-text-outline',
        target: '/messages' as Href,
      },
      {
        title: 'Trending clips',
        caption: 'Scan high-engagement highlights from the network.',
        icon: 'fire',
        target: '/explore' as Href,
      },
    ],
  },
  club: {
    badge: 'CLUB HOME',
    title: 'Track talent and club opportunities',
    feedSubtitle: 'See who is posting, trending, and building momentum across the network.',
    primaryAction: {
      title: 'Scout player pool',
      caption: 'Open discovery to compare players and start outreach.',
      icon: 'shield-search',
      target: '/discover' as Href,
    },
    quickActions: [
      {
        title: 'Messages',
        caption: 'Continue recruitment and event conversations.',
        icon: 'message-text-outline',
        target: '/messages' as Href,
      },
      {
        title: 'Events',
        caption: 'Review trials, showcases, and football calendar activity.',
        icon: 'calendar-star',
        target: '/events' as Href,
      },
    ],
  },
  org: {
    badge: 'ORG HOME',
    title: 'Coordinate community football activity',
    feedSubtitle: 'A live view of posts, community activity, and football opportunities around SOCA.',
    primaryAction: {
      title: 'Explore community',
      caption: 'See featured players, clips, challenges, and events together.',
      icon: 'compass-outline',
      target: '/explore' as Href,
    },
    quickActions: [
      {
        title: 'Events',
        caption: 'Check showcase and trial listings visible to the network.',
        icon: 'calendar-blank-outline',
        target: '/events' as Href,
      },
      {
        title: 'Messages',
        caption: 'Keep one-to-one coordination moving.',
        icon: 'message-text-outline',
        target: '/messages' as Href,
      },
    ],
  },
};

export function HomeScreen({ role }: HomeScreenProps) {
  const router = useRouter();
  const config = HOME_CONFIG[role];

  return (
    <AppShell>
      <FeedTimeline
        headerContent={
          <View style={styles.container}>
            <View style={styles.roleIntro}>
              <Text variant="overline" style={styles.roleBadge}>
                {config.badge}
              </Text>
              <Text variant="heading">{config.title}</Text>
            </View>

            <Pressable onPress={() => router.push(config.primaryAction.target)}>
              {({ pressed }) => (
                <Surface tone="tint" elevated style={[styles.uploadCard, pressed && styles.cardPressed]}>
                  <View style={styles.uploadIconWrap}>
                    <MaterialCommunityIcons
                      name={config.primaryAction.icon}
                      size={22}
                      color={theme.colors.textInverse}
                    />
                  </View>
                  <View style={styles.uploadCopy}>
                    <Text variant="title">{config.primaryAction.title}</Text>
                    <Text variant="caption" style={styles.uploadCaption}>
                      {config.primaryAction.caption}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-top-right"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </Surface>
              )}
            </Pressable>

            <View style={styles.quickGrid}>
              {config.quickActions.map((action) => (
                <Pressable key={action.title} onPress={() => router.push(action.target)} style={styles.quickItem}>
                  {({ pressed }) => (
                    <Surface elevated style={[styles.quickCard, pressed && styles.cardPressed]}>
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={20}
                        color={theme.colors.accent}
                      />
                      <View style={styles.quickCopy}>
                        <Text variant="label">{action.title}</Text>
                        <Text variant="caption" style={styles.uploadCaption}>
                          {action.caption}
                        </Text>
                      </View>
                    </Surface>
                  )}
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Latest Posts" subtitle={config.feedSubtitle} />
          </View>
        }
        emptyTitle="No posts yet"
        emptyDescription={
          role === 'player'
            ? 'Create your first post or upload a video to get started.'
            : 'Explore profiles or check back as activity grows.'
        }
        emptyActionLabel={role === 'player' ? 'Create Post' : 'Explore'}
        onEmptyActionPress={() =>
          router.push(role === 'player' ? '/upload/video' : '/explore')
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  roleIntro: {
    gap: theme.spacing.xs,
  },
  roleBadge: {
    color: theme.colors.primary,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardPressed: {
    opacity: 0.94,
  },
  uploadIconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  uploadCopy: {
    flex: 1,
    gap: 2,
  },
  uploadCaption: {
    color: theme.colors.textMuted,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  quickCard: {
    minHeight: 112,
    gap: theme.spacing.sm,
  },
  quickCopy: {
    gap: 2,
  },
});
