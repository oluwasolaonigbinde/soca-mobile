import {
  buildAffinityCounts,
  buildAffinityKey,
  hasRecommendationSignals,
  sortRecommendedProfiles,
  type RecommendationSignal,
} from '@/lib/ai-assist';
import {
  DEMO_MODE_ENABLED,
  getDemoExploreSections,
  listDemoDiscoverProfiles,
} from '@/lib/demo-mode';
import { getAgeFromBirthYear } from '@/lib/profile';
import { getVideoOwnerMap, listLatestVideos, listVideosByIds } from '@/lib/videos';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { FeaturedItem, Profile, UserRole, VideoWithCounts } from '@/types/database';

export type DiscoverSort = 'latest' | 'featured' | 'popular' | 'recommended';
export type DiscoverRoleFilter = UserRole | 'all';

export interface DiscoveryFilters {
  search?: string;
  position?: string;
  location?: string;
  role?: DiscoverRoleFilter;
  minAge?: string;
  maxAge?: string;
  sort?: DiscoverSort;
  limit?: number;
}

export interface DiscoverProfile extends Profile {
  age: number | null;
  follower_count: number;
  profile_views_count: number;
  popularity_score: number;
  is_featured: boolean;
  featured_sort_order: number | null;
}

export interface ChallengePreview {
  id: string;
  title: string;
  description: string | null;
  month_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_open: boolean;
  submission_count?: number;
}

export interface EventPreview {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  organizer_name: string | null;
}

export interface ExploreSections {
  featuredPlayers: DiscoverProfile[];
  featuredVideos: VideoWithCounts[];
  trendingVideos: VideoWithCounts[];
  challenges: ChallengePreview[];
  events: EventPreview[];
}

type RawRow = Record<string, unknown>;

const CURRENT_YEAR = new Date().getFullYear();
const DISCOVERY_BATCH_SIZE = 200;
const RECOMMENDATION_SIGNAL_LIMIT = 120;

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}

function sanitizeSearchValue(value: string | undefined) {
  return value?.trim();
}

function buildDiscoverySearchClause(search: string | undefined) {
  const trimmedSearch = sanitizeSearchValue(search);
  if (!trimmedSearch) return null;

  const escapedSearch = trimmedSearch
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  const pattern = `*${escapedSearch}*`;

  return [
    `display_name.ilike.${pattern}`,
    `full_name.ilike.${pattern}`,
    `username.ilike.${pattern}`,
    `location.ilike.${pattern}`,
    `position.ilike.${pattern}`,
  ].join(',');
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === '42P01' ||
    candidate.message?.includes('does not exist') === true ||
    candidate.message?.includes('Could not find the table') === true
  );
}

function buildCountMap(rows: RawRow[], key: string) {
  return rows.reduce<Map<string, number>>((map, row) => {
    const rawKey = row[key];
    if (typeof rawKey !== 'string' || rawKey.length === 0) return map;

    map.set(rawKey, (map.get(rawKey) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}

function addSignalScore(signals: Map<string, number>, profileId: string | null | undefined, score: number) {
  if (!profileId) {
    return;
  }

  signals.set(profileId, (signals.get(profileId) ?? 0) + score);
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user?.id ?? null;
}

async function listFeaturedItems(itemType: FeaturedItem['item_type'], limit = 12) {
  const { data, error } = await supabase
    .from('featured_items')
    .select('*')
    .eq('item_type', itemType)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data as FeaturedItem[] | null) ?? [];
}

async function enrichProfiles(profiles: Profile[], featuredItems: FeaturedItem[]) {
  if (profiles.length === 0) return [] as DiscoverProfile[];

  const profileIds = profiles.map((profile) => profile.id);
  const [{ data: followerRows, error: followerError }, { data: viewRows, error: viewError }] =
    await Promise.all([
      supabase.from('follows').select('followee_id').in('followee_id', profileIds),
      supabase.from('profile_views').select('profile_id').in('profile_id', profileIds),
    ]);

  if (followerError) throw followerError;
  if (viewError) throw viewError;

  const followerCounts = buildCountMap((followerRows as RawRow[] | null) ?? [], 'followee_id');
  const profileViewCounts = buildCountMap((viewRows as RawRow[] | null) ?? [], 'profile_id');
  const featuredOrder = featuredItems.reduce<Map<string, number>>((map, item) => {
    map.set(item.item_id, item.sort_order);
    return map;
  }, new Map<string, number>());

  return profiles.map((profile) => {
    const followerCount = followerCounts.get(profile.id) ?? 0;
    const profileViewsCount = profileViewCounts.get(profile.id) ?? 0;

    return {
      ...profile,
      age: getAgeFromBirthYear(profile.birth_year),
      follower_count: followerCount,
      profile_views_count: profileViewsCount,
      popularity_score: followerCount * 3 + profileViewsCount,
      is_featured: featuredOrder.has(profile.id),
      featured_sort_order: featuredOrder.get(profile.id) ?? null,
    };
  });
}

export function sortDiscoverProfiles(
  profiles: DiscoverProfile[],
  sort: DiscoverSort,
) {
  const sorted = [...profiles];

  if (sort === 'featured') {
    return sorted
      .filter((profile) => profile.is_featured)
      .sort((a, b) => {
        const sortOrderA = a.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
        const sortOrderB = b.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
        if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      });
  }

  if (sort === 'popular') {
    return sorted.sort((a, b) => {
      if (b.popularity_score !== a.popularity_score) {
        return b.popularity_score - a.popularity_score;
      }

      if (b.follower_count !== a.follower_count) {
        return b.follower_count - a.follower_count;
      }

      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }

  return sorted.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function buildDiscoveryProfilesQuery({
  role,
  position,
  location,
  minAge,
  maxAge,
  search,
}: {
  role: DiscoverRoleFilter;
  position?: string;
  location?: string;
  minAge: number | null;
  maxAge: number | null;
  search?: string;
}) {
  let query = supabase.from('profiles').select('*');

  if (role !== 'all') {
    query = query.eq('role', role);
  }

  if (position) {
    query = query.ilike('position', `%${position}%`);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  if (minAge !== null) {
    query = query.lte('birth_year', CURRENT_YEAR - minAge);
  }

  if (maxAge !== null) {
    query = query.gte('birth_year', CURRENT_YEAR - maxAge);
  }

  const searchClause = buildDiscoverySearchClause(search);
  if (searchClause) {
    query = query.or(searchClause);
  }

  return query.order('created_at', { ascending: false });
}

async function listLatestDiscoveryProfiles({
  role,
  position,
  location,
  minAge,
  maxAge,
  search,
  limit,
}: {
  role: DiscoverRoleFilter;
  position?: string;
  location?: string;
  minAge: number | null;
  maxAge: number | null;
  search?: string;
  limit: number;
}) {
  const { data, error } = await buildDiscoveryProfilesQuery({
    role,
    position,
    location,
    minAge,
    maxAge,
    search,
  }).limit(limit);

  if (error) throw error;
  return (data as Profile[] | null) ?? [];
}

async function listAllDiscoveryProfiles({
  role,
  position,
  location,
  minAge,
  maxAge,
  search,
}: {
  role: DiscoverRoleFilter;
  position?: string;
  location?: string;
  minAge: number | null;
  maxAge: number | null;
  search?: string;
}) {
  const profiles: Profile[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildDiscoveryProfilesQuery({
      role,
      position,
      location,
      minAge,
      maxAge,
      search,
    }).range(offset, offset + DISCOVERY_BATCH_SIZE - 1);

    if (error) throw error;

    const batch = (data as Profile[] | null) ?? [];
    if (batch.length === 0) {
      break;
    }

    profiles.push(...batch);
    if (batch.length < DISCOVERY_BATCH_SIZE) {
      break;
    }

    offset += DISCOVERY_BATCH_SIZE;
  }

  return profiles;
}

async function listRecommendedDiscoverProfiles({
  role,
  position,
  location,
  minAge,
  maxAge,
  search,
  limit,
  featuredItems,
}: {
  role: DiscoverRoleFilter;
  position?: string;
  location?: string;
  minAge: number | null;
  maxAge: number | null;
  search?: string;
  limit: number;
  featuredItems: FeaturedItem[];
}) {
  const profiles = await listAllDiscoveryProfiles({
    role,
    position,
    location,
    minAge,
    maxAge,
    search,
  });
  const enrichedProfiles = await enrichProfiles(profiles, featuredItems);
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return sortDiscoverProfiles(enrichedProfiles, 'popular').slice(0, limit);
  }

  const [
    { data: followRows, error: followError },
    { data: profileViewRows, error: profileViewError },
    { data: messageRows, error: messageError },
    { data: likeRows, error: likeError },
    { data: videoViewRows, error: videoViewError },
  ] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', currentUserId),
    supabase
      .from('profile_views')
      .select('profile_id')
      .eq('viewer_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(RECOMMENDATION_SIGNAL_LIMIT),
    supabase
      .from('messages')
      .select('sender_id, recipient_id')
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(RECOMMENDATION_SIGNAL_LIMIT),
    supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(RECOMMENDATION_SIGNAL_LIMIT),
    supabase
      .from('video_views')
      .select('video_id')
      .eq('viewer_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(RECOMMENDATION_SIGNAL_LIMIT),
  ]);

  if (followError) throw followError;
  if (profileViewError) throw profileViewError;
  if (messageError && !isMissingRelationError(messageError)) throw messageError;
  if (likeError) throw likeError;
  if (videoViewError) throw videoViewError;

  const followedIds = new Set<string>();
  (((followRows as RawRow[] | null) ?? [])).forEach((row) => {
    const followeeId = typeof row.followee_id === 'string' ? row.followee_id : null;
    if (followeeId) {
      followedIds.add(followeeId);
    }
  });

  const directSignals = new Map<string, number>();
  (((profileViewRows as RawRow[] | null) ?? [])).forEach((row) => {
    const profileId = typeof row.profile_id === 'string' ? row.profile_id : null;
    if (profileId && profileId !== currentUserId) {
      addSignalScore(directSignals, profileId, 4);
    }
  });

  (((messageRows as RawRow[] | null) ?? [])).forEach((row) => {
    const senderId = typeof row.sender_id === 'string' ? row.sender_id : null;
    const recipientId = typeof row.recipient_id === 'string' ? row.recipient_id : null;
    const otherParticipantId = senderId === currentUserId ? recipientId : senderId;
    if (otherParticipantId && otherParticipantId !== currentUserId) {
      addSignalScore(directSignals, otherParticipantId, 5);
    }
  });

  const likedVideoIds = ((likeRows as RawRow[] | null) ?? [])
    .map((row) => (typeof row.video_id === 'string' ? row.video_id : null))
    .filter((videoId): videoId is string => !!videoId);
  const viewedVideoIds = ((videoViewRows as RawRow[] | null) ?? [])
    .map((row) => (typeof row.video_id === 'string' ? row.video_id : null))
    .filter((videoId): videoId is string => !!videoId);
  const videoOwnerMap = await getVideoOwnerMap([...likedVideoIds, ...viewedVideoIds]);

  likedVideoIds.forEach((videoId) => {
    const ownerId = videoOwnerMap.get(videoId);
    if (ownerId && ownerId !== currentUserId) {
      addSignalScore(directSignals, ownerId, 3);
    }
  });

  viewedVideoIds.forEach((videoId) => {
    const ownerId = videoOwnerMap.get(videoId);
    if (ownerId && ownerId !== currentUserId) {
      addSignalScore(directSignals, ownerId, 1);
    }
  });

  const seedProfileIds = Array.from(new Set([...followedIds, ...directSignals.keys()])).filter(
    (profileId) => profileId !== currentUserId,
  );

  let positionAffinities = new Map<string, number>();
  let locationAffinities = new Map<string, number>();

  if (seedProfileIds.length > 0) {
    const { data: seedRows, error: seedError } = await supabase
      .from('profiles')
      .select('id, position, location')
      .in('id', seedProfileIds);

    if (seedError) throw seedError;

    const seedProfiles =
      ((seedRows as Pick<Profile, 'id' | 'position' | 'location'>[] | null) ?? []);
    positionAffinities = buildAffinityCounts(seedProfiles.map((profile) => profile.position));
    locationAffinities = buildAffinityCounts(seedProfiles.map((profile) => profile.location));
  }

  const recommendationSignals = new Map<string, RecommendationSignal>();
  const candidateProfiles = enrichedProfiles.filter(
    (profile) => profile.id !== currentUserId && !followedIds.has(profile.id),
  );

  candidateProfiles.forEach((profile) => {
    const positionKey = buildAffinityKey(profile.position);
    const locationKey = buildAffinityKey(profile.location);

    recommendationSignals.set(profile.id, {
      directSignal: directSignals.get(profile.id) ?? 0,
      positionAffinity: positionKey ? (positionAffinities.get(positionKey) ?? 0) : 0,
      locationAffinity: locationKey ? (locationAffinities.get(locationKey) ?? 0) : 0,
    });
  });

  if (!hasRecommendationSignals(recommendationSignals)) {
    return sortDiscoverProfiles(candidateProfiles, 'popular').slice(0, limit);
  }

  return sortRecommendedProfiles(candidateProfiles, recommendationSignals).slice(0, limit);
}

export async function listDiscoverProfiles(filters: DiscoveryFilters): Promise<DiscoverProfile[]> {
  if (DEMO_MODE_ENABLED) {
    return listDemoDiscoverProfiles(filters) as DiscoverProfile[];
  }

  const minAge = parseOptionalNumber(filters.minAge);
  const maxAge = parseOptionalNumber(filters.maxAge);
  const role = filters.role ?? 'player';
  const sort = filters.sort ?? 'latest';
  const limit = filters.limit ?? 40;
  const trimmedPosition = filters.position?.trim();
  const trimmedLocation = filters.location?.trim();
  const trimmedSearch = sanitizeSearchValue(filters.search);

  const featuredItems = await listFeaturedItems('profile');

  if (sort === 'recommended') {
    return listRecommendedDiscoverProfiles({
      role,
      position: trimmedPosition,
      location: trimmedLocation,
      minAge,
      maxAge,
      search: trimmedSearch,
      limit,
      featuredItems,
    });
  }

  const profiles =
    sort === 'latest'
      ? await listLatestDiscoveryProfiles({
          role,
          position: trimmedPosition,
          location: trimmedLocation,
          minAge,
          maxAge,
          search: trimmedSearch,
          limit,
        })
      : await listAllDiscoveryProfiles({
          role,
          position: trimmedPosition,
          location: trimmedLocation,
          minAge,
          maxAge,
          search: trimmedSearch,
        });

  const enrichedProfiles = await enrichProfiles(profiles, featuredItems);
  return sortDiscoverProfiles(enrichedProfiles, sort).slice(0, limit);
}

async function listProfilesByIds(profileIds: string[], featuredItems: FeaturedItem[]) {
  if (profileIds.length === 0) return [] as DiscoverProfile[];

  const { data, error } = await supabase.from('profiles').select('*').in('id', profileIds);
  if (error) throw error;

  const profiles = (data as Profile[] | null) ?? [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const orderedProfiles = profileIds
    .map((profileId) => profileMap.get(profileId))
    .filter((profile): profile is Profile => !!profile);

  return enrichProfiles(orderedProfiles, featuredItems);
}

async function listFeaturedPlayers(limit = 5) {
  const featuredItems = await listFeaturedItems('profile', limit);
  const featuredIds = featuredItems.map((item) => item.item_id);

  if (featuredIds.length === 0) {
    return [];
  }

  return listProfilesByIds(featuredIds, featuredItems);
}

async function listFeaturedVideos(limit = 4) {
  const featuredItems = await listFeaturedItems('video', limit);
  const featuredIds = featuredItems.map((item) => item.item_id);

  if (featuredIds.length === 0) {
    return [];
  }

  return listVideosByIds(featuredIds);
}

function sortTrendingVideos(videos: VideoWithCounts[], limit: number) {
  return [...videos]
    .sort((a, b) => {
      const scoreA = a.like_count * 3 + a.view_count;
      const scoreB = b.like_count * 3 + b.view_count;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    })
    .slice(0, limit);
}

function getString(row: RawRow, key: string) {
  const value = row[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeChallenge(row: RawRow): ChallengePreview | null {
  const id = getString(row, 'id');
  if (!id) return null;

  const startsAt = getString(row, 'starts_at') ?? getString(row, 'start_date');
  const endsAt = getString(row, 'ends_at') ?? getString(row, 'end_date');
  const now = Date.now();
  const startsAtTime = startsAt ? Date.parse(startsAt) : Number.NEGATIVE_INFINITY;
  const endsAtTime = endsAt ? Date.parse(endsAt) : Number.POSITIVE_INFINITY;

  return {
    id,
    title: getString(row, 'title') ?? getString(row, 'name') ?? 'Challenge',
    description: getString(row, 'description'),
    month_label: getString(row, 'month_label') ?? getString(row, 'month'),
    starts_at: startsAt,
    ends_at: endsAt,
    is_open:
      row.is_open === true ||
      (row.is_open !== false && startsAtTime <= now && now < endsAtTime),
  };
}

function normalizeEvent(row: RawRow): EventPreview | null {
  const id = getString(row, 'id');
  if (!id) return null;

  return {
    id,
    title: getString(row, 'title') ?? getString(row, 'name') ?? 'Event',
    description: getString(row, 'description'),
    location: getString(row, 'location'),
    event_date: getString(row, 'event_date') ?? getString(row, 'date') ?? getString(row, 'starts_at'),
    organizer_name: getString(row, 'organizer_name') ?? getString(row, 'organizer'),
  };
}

async function listOptionalCollection<T>({
  table,
  itemType,
  limit,
  normalize,
}: {
  table: 'challenges' | 'events';
  itemType: 'challenge' | 'event';
  limit: number;
  normalize: (row: RawRow) => T | null;
}) {
  const featuredItems = await listFeaturedItems(itemType, limit);

  if (featuredItems.length > 0) {
    const featuredIds = featuredItems.map((item) => item.item_id);
    const { data, error } = await supabase.from(table).select('*').in('id', featuredIds);

    if (error) {
      if (isMissingRelationError(error)) return [] as T[];
      throw error;
    }

    const rows = (data as RawRow[] | null) ?? [];
    const rowMap = new Map<string, RawRow>();
    rows.forEach((row) => {
      const id = getString(row, 'id');
      if (id) {
        rowMap.set(id, row);
      }
    });

    return featuredIds
      .map((id) => rowMap.get(id))
      .filter((row): row is RawRow => !!row)
      .map(normalize)
      .filter((row): row is T => !!row);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelationError(error)) return [] as T[];
    throw error;
  }

  return ((data as RawRow[] | null) ?? []).map(normalize).filter((row): row is T => !!row);
}

async function listChallengeSubmissionCounts(challengeIds: string[]) {
  if (challengeIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('challenge_id')
    .in('challenge_id', challengeIds);

  if (error) {
    if (isMissingRelationError(error)) return new Map<string, number>();
    throw error;
  }

  return buildCountMap((data as RawRow[] | null) ?? [], 'challenge_id');
}

async function listChallengePreviews(limit = 3) {
  const featuredItems = await listFeaturedItems('challenge', limit);
  let rows: RawRow[] = [];

  if (featuredItems.length > 0) {
    const featuredIds = featuredItems.map((item) => item.item_id);
    const { data, error } = await supabase.from('challenges').select('*').in('id', featuredIds);

    if (error) {
      if (isMissingRelationError(error)) return [] as ChallengePreview[];
      throw error;
    }

    const rowMap = new Map<string, RawRow>();
    (((data as RawRow[] | null) ?? [])).forEach((row) => {
      const id = getString(row, 'id');
      if (id) {
        rowMap.set(id, row);
      }
    });

    rows = featuredIds
      .map((id) => rowMap.get(id))
      .filter((row): row is RawRow => !!row);
  } else {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(limit * 2);

    if (error) {
      if (isMissingRelationError(error)) return [] as ChallengePreview[];
      throw error;
    }

    rows = (data as RawRow[] | null) ?? [];
  }

  const normalized = rows.map(normalizeChallenge).filter((row): row is ChallengePreview => !!row);
  const submissionCounts = await listChallengeSubmissionCounts(normalized.map((item) => item.id));
  const prioritized = [
    ...normalized.filter((item) => item.is_open),
    ...normalized.filter((item) => !item.is_open),
  ];

  return prioritized.slice(0, limit).map((challenge) => ({
    ...challenge,
    submission_count: submissionCounts.get(challenge.id),
  }));
}

export async function getExploreSections(): Promise<ExploreSections> {
  if (DEMO_MODE_ENABLED) {
    const currentUserId = await getCurrentUserId();
    return getDemoExploreSections(
      currentUserId ?? undefined,
      useAuthStore.getState().profile,
    ) as ExploreSections;
  }

  const [featuredPlayers, featuredVideos, latestVideos, challenges, events] = await Promise.all([
    listFeaturedPlayers(4),
    listFeaturedVideos(4),
    listLatestVideos(24),
    listChallengePreviews(3),
    listOptionalCollection({
      table: 'events',
      itemType: 'event',
      limit: 3,
      normalize: normalizeEvent,
    }),
  ]);

  return {
    featuredPlayers,
    featuredVideos,
    trendingVideos: sortTrendingVideos(latestVideos, 4),
    challenges,
    events,
  };
}
