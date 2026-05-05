import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useDiscoverProfiles, useExploreSections } from '@/hooks/useDiscovery';
import { getShortPositionLabel } from '@/lib/profile';
import type {
  ChallengePreview,
  DiscoverProfile,
  DiscoverSort,
  EventPreview,
} from '@/lib/discovery';
import type { VideoWithCounts } from '@/types/database';

import {
  AppHeader,
  AppShell,
  Avatar,
  Chip,
  Input,
  SearchInput,
  SectionHeader,
  StateCard,
  Surface,
  Text,
  theme,
} from '../ui';
import { ChallengeCard } from '../challenges/ChallengeCard';
import { VideoCard } from '../video/VideoCard';

const SORT_OPTIONS: { label: string; value: DiscoverSort }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
];

const ROLE_LABELS: Record<string, string> = {
  player: 'Player',
  scout: 'Scout',
  club: 'Club',
  org: 'Organization',
};

function formatDate(iso: string | null) {
  if (!iso) return 'Date TBD';

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ExploreProfileCard({ profile }: { profile: DiscoverProfile }) {
  const router = useRouter();
  const displayName = profile.display_name || profile.full_name || 'Unknown player';
  const shortPosition = getShortPositionLabel(profile.position);

  return (
    <Pressable onPress={() => router.push(`/profile/${profile.id}`)}>
      {({ pressed }) => (
        <Surface elevated style={[styles.profileCard, pressed && styles.cardPressed]}>
          <View style={styles.profileRow}>
            <Avatar uri={profile.avatar_url} name={displayName} size={56} />
            <View style={styles.profileCopy}>
              <View style={styles.profileTitleRow}>
                <Text variant="title" numberOfLines={1} style={styles.flex}>
                  {displayName}
                </Text>
                {profile.is_featured ? (
                  <View style={styles.featuredPill}>
                    <Text variant="caption" style={styles.featuredText}>
                      Featured
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.profileMetaRow}>
                {shortPosition ? (
                  <View style={styles.positionPill}>
                    <Text variant="caption" style={styles.positionText}>
                      {shortPosition}
                    </Text>
                  </View>
                ) : null}
                <Text variant="caption" style={styles.muted}>
                  {ROLE_LABELS[profile.role ?? ''] ?? 'Profile'}
                </Text>
                {profile.age !== null ? (
                  <Text variant="caption" style={styles.muted}>
                    {profile.age} yrs
                  </Text>
                ) : null}
              </View>

              <View style={styles.profileMetaRow}>
                <Text variant="caption" style={styles.mutedSoft}>
                  {profile.follower_count} followers
                </Text>
                <Text variant="caption" style={styles.mutedSoft}>
                  {profile.location || 'Location TBD'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="arrow-top-right"
              size={18}
              color={theme.colors.textMuted}
            />
          </View>
        </Surface>
      )}
    </Pressable>
  );
}

function EventCard({ event }: { event: EventPreview }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/events/${event.id}`)}>
      {({ pressed }) => (
        <Surface elevated style={[styles.infoCard, pressed && styles.cardPressed]}>
          <Text variant="title">{event.title}</Text>
          <Text variant="caption" style={styles.accent}>
            {[formatDate(event.event_date), event.location].filter(Boolean).join(' | ')}
          </Text>
          {event.organizer_name ? (
            <Text variant="caption" style={styles.muted}>
              {event.organizer_name}
            </Text>
          ) : null}
        </Surface>
      )}
    </Pressable>
  );
}

function buildHighlightShowcase(params: {
  featured: VideoWithCounts[];
  trending: VideoWithCounts[];
}) {
  const combined = [...(params.featured ?? []), ...(params.trending ?? [])];
  const seenIds = new Set<string>();

  return combined.filter((video) => {
    if (!video || seenIds.has(video.id)) {
      return false;
    }

    seenIds.add(video.id);
    return true;
  });
}

export interface UnifiedExploreScreenProps {
  entrypoint?: 'explore' | 'discover';
}

export function UnifiedExploreScreen({
  entrypoint = 'explore',
}: UnifiedExploreScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState<DiscoverSort>('recommended');

  const discoverQuery = useDiscoverProfiles({
    search,
    position,
    location,
    role: 'player',
    sort,
  });
  const exploreQuery = useExploreSections();

  const onRefresh = () => {
    discoverQuery.refetch();
    exploreQuery.refetch();
  };

  const title = entrypoint === 'discover' ? 'Discover' : 'Explore';
  const highlightShowcase = useMemo(
    () =>
      buildHighlightShowcase({
        featured: exploreQuery.data?.featuredVideos ?? [],
        trending: exploreQuery.data?.trendingVideos ?? [],
      }).slice(0, 4),
    [exploreQuery.data?.featuredVideos, exploreQuery.data?.trendingVideos],
  );
  const challengeShowcase = useMemo(() => {
    const challenges = exploreQuery.data?.challenges ?? [];
    const openChallenges = challenges.filter((challenge) => challenge.is_open);
    return (openChallenges.length ? openChallenges : challenges).slice(0, 3);
  }, [exploreQuery.data?.challenges]);

  return (
    <AppShell
      header={
        <AppHeader
          title={title}
          subtitle="Discover players, standout clips, and live football opportunities."
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={discoverQuery.isRefetching || exploreQuery.isRefetching}
            tintColor={theme.colors.accent}
            onRefresh={onRefresh}
          />
        }
      >
        <Surface elevated style={styles.searchPanel}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search players, positions, or locations..."
            containerStyle={styles.searchField}
          />

          <View style={styles.inputRow}>
            <Input
              value={position}
              onChangeText={setPosition}
              placeholder="Position"
              style={styles.flex}
            />
            <Input
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
              style={styles.flex}
            />
          </View>

          <View style={styles.chipRow}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={sort === option.value}
                onPress={() => setSort(option.value)}
              />
            ))}
          </View>
        </Surface>

        <View style={styles.section}>
          <SectionHeader title="Player Discovery" subtitle="Search-ready player profiles with the strongest signals surfaced first." />

          {discoverQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          ) : null}

          {discoverQuery.error ? (
            <StateCard
              title="Unable to load discovery"
              description="Pull to refresh and try again."
              tone="danger"
            />
          ) : null}

          {!discoverQuery.isLoading && !discoverQuery.error && discoverQuery.data?.length === 0 ? (
            <StateCard
              title="No matching players"
              description="Adjust search, position, or location to widen the pool."
              tone="tint"
            />
          ) : null}

          {!discoverQuery.isLoading && !discoverQuery.error ? (
            <View style={styles.profileList}>
              {discoverQuery.data?.map((profile) => (
                <ExploreProfileCard key={profile.id} profile={profile} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Featured Players" subtitle="Curated profiles worth a closer look." />
          {exploreQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          ) : exploreQuery.error ? (
            <StateCard title="Unable to load featured players" tone="danger" />
          ) : exploreQuery.data?.featuredPlayers.length ? (
            <View style={styles.profileList}>
              {exploreQuery.data.featuredPlayers.map((profile) => (
                <ExploreProfileCard key={profile.id} profile={profile} />
              ))}
            </View>
          ) : (
            <StateCard title="No featured players yet" tone="tint" />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Trending Highlights" subtitle="Football clips with real momentum on SOCA." />
          {highlightShowcase.length ? (
            <View style={styles.cardList}>
              {highlightShowcase.map((video) => (
                <VideoCard key={video.id} video={video} compact />
              ))}
            </View>
          ) : (
            <StateCard title="Highlights will appear here as activity grows" tone="tint" />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Open Challenges"
            subtitle="Current community competitions accepting new entries."
            actionLabel="Browse all"
            onActionPress={() => router.push('/challenges')}
          />
          {challengeShowcase.length ? (
            <View style={styles.cardList}>
              {challengeShowcase.map((challenge: ChallengePreview) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => router.push(`/challenges/${challenge.id}`)}
                />
              ))}
            </View>
          ) : (
            <StateCard title="No active challenges yet" tone="tint" />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Events"
            subtitle="Trials, showcases, and scouting moments around the network."
            actionLabel="Browse all"
            onActionPress={() => router.push('/events')}
          />
          {exploreQuery.data?.events.length ? (
            <View style={styles.cardList}>
              {exploreQuery.data.events.map((event: EventPreview) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <StateCard title="No events yet" tone="tint" />
          )}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.jumbo,
    gap: theme.spacing.xxl,
  },
  searchPanel: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  searchField: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  section: {
    gap: theme.spacing.lg,
  },
  centered: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
  profileList: {
    gap: theme.spacing.md,
  },
  profileCard: {
    padding: theme.spacing.lg,
  },
  cardPressed: {
    opacity: 0.94,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: 6,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  featuredPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceTint,
  },
  featuredText: {
    color: theme.colors.accent,
  },
  positionPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.accent,
  },
  positionText: {
    color: theme.colors.textInverse,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  mutedSoft: {
    color: theme.colors.textSoft,
  },
  accent: {
    color: theme.colors.accent,
  },
  infoCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  cardList: {
    gap: theme.spacing.md,
  },
});
