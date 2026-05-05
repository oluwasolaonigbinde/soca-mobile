import type {
  ChallengeSubmission,
  Conversation,
  ConversationSummary,
  Message,
  Profile,
  ProfilePreview,
  ProfileWithCounts,
  UserRole,
  VideoWithCounts,
} from '@/types/database';

// Demo mode replaces every networked service with seeded fakes from this file.
// It is gated behind __DEV__ so a release/handover build can never accidentally
// ship in demo mode even if EXPO_PUBLIC_DEMO_MODE=true leaks into the build env.
// To use a release-style build for a recorded walkthrough, set both
// __DEV__ tooling AND EXPO_PUBLIC_DEMO_MODE=true (e.g. dev client) — never a
// production build for the client.
export const DEMO_MODE_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

const DEMO_NOW = new Date('2026-03-14T12:00:00.000Z');
const CURRENT_USER_PLACEHOLDER_ID = '__demo-current-user__';
const BASE_SELF_FOLLOWER_COUNT = 184;
const BASE_SELF_FOLLOWING_COUNT = 42;
const BASE_SELF_PROFILE_VIEW_COUNT = 1260;
const INITIAL_FOLLOWING_IDS = ['demo-player-ruby', 'demo-scout-ava', 'demo-club-northbridge'];
const INITIAL_FOLLOWER_IDS = ['demo-player-daniel', 'demo-scout-ava', 'demo-org-summit'];
const INITIAL_LIKED_VIDEO_IDS = ['demo-video-self-cutback'];
const INITIAL_INTERESTED_EVENT_IDS = ['demo-event-showcase'];

type DemoDiscoverSort = 'latest' | 'featured' | 'popular' | 'recommended';
type DemoDiscoverRoleFilter = UserRole | 'all';

interface DemoDiscoverProfile extends ProfileWithCounts {
  age: number | null;
  popularity_score: number;
  is_featured: boolean;
  featured_sort_order: number | null;
}

interface DemoChallengeRecord {
  id: string;
  title: string;
  description: string | null;
  month: string | null;
  month_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by_admin: string | null;
  created_at: string;
  is_open: boolean;
}

interface DemoChallengeLeaderboardEntry extends ChallengeSubmission {
  admin_score_value: number;
  like_count: number;
  view_count: number;
  engagement_score: number;
  total_score: number;
  player_name: string;
  player_avatar_url: string | null;
  video_caption: string | null;
  rank?: number;
}

interface DemoEventRecord {
  id: string;
  title: string;
  date: string | null;
  event_date: string | null;
  location: string | null;
  description: string | null;
  organizer_id: string | null;
  organizer_name: string | null;
  interested_count: number;
  created_at: string;
}

interface DemoVideoTemplate {
  id: string;
  owner_id: string;
  storage_path: string;
  caption: string | null;
  duration: number | null;
  created_at: string;
  playback_url: string;
  base_like_count: number;
  base_view_count: number;
}

interface DemoConversationSeed {
  conversation: Conversation;
  other_profile_id: string;
  messages: {
    id: string;
    from: 'self' | 'other';
    text: string;
    created_at: string;
    read_at?: string | null;
  }[];
}

interface DemoProfileSeed extends ProfileWithCounts {
  is_featured: boolean;
  featured_sort_order: number | null;
}

const SAMPLE_VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

function isoDaysFromNow(dayOffset: number, hour = 12) {
  const date = new Date(DEMO_NOW);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function getCurrentYear() {
  return DEMO_NOW.getUTCFullYear();
}

function getAge(birthYear: number | null) {
  if (!birthYear) return null;
  return getCurrentYear() - birthYear;
}

function buildProfilePreview(profile: Profile): ProfilePreview {
  return {
    id: profile.id,
    display_name: profile.display_name,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
  };
}

function sanitizeDisplayName(profile: Pick<Profile, 'display_name' | 'full_name'>) {
  return profile.display_name || profile.full_name || 'SOCA Player';
}

const DEMO_PUBLIC_PROFILES: DemoProfileSeed[] = [
  {
    id: 'demo-player-ruby',
    role: 'player',
    full_name: 'Ruby Okafor',
    username: 'ruby.okafor',
    avatar_url: null,
    display_name: 'Ruby O.',
    bio: 'Direct forward with sharp runs across the back line and quick finishes from cut-backs.',
    location: 'London, UK',
    verified: true,
    verified_at: isoDaysFromNow(-24, 10),
    position: 'Forward',
    birth_year: 2008,
    created_at: isoDaysFromNow(-28, 9),
    updated_at: isoDaysFromNow(-2, 16),
    follower_count: 284,
    following_count: 61,
    profile_views_count: 1820,
    is_featured: true,
    featured_sort_order: 1,
  },
  {
    id: 'demo-player-daniel',
    role: 'player',
    full_name: 'Daniel Mensah',
    username: 'daniel.mensah',
    avatar_url: null,
    display_name: 'Daniel M.',
    bio: 'Press-resistant midfielder with range in possession and a calm final pass.',
    location: 'Manchester, UK',
    verified: true,
    verified_at: isoDaysFromNow(-20, 8),
    position: 'Midfielder',
    birth_year: 2007,
    created_at: isoDaysFromNow(-25, 13),
    updated_at: isoDaysFromNow(-1, 12),
    follower_count: 176,
    following_count: 54,
    profile_views_count: 1290,
    is_featured: true,
    featured_sort_order: 2,
  },
  {
    id: 'demo-scout-ava',
    role: 'scout',
    full_name: 'Ava Carter',
    username: 'ava.carter',
    avatar_url: null,
    display_name: 'Ava Carter',
    bio: 'Regional scout tracking U16-U19 wide players and creative attacking profiles.',
    location: 'Birmingham, UK',
    verified: true,
    verified_at: isoDaysFromNow(-34, 11),
    position: null,
    birth_year: null,
    created_at: isoDaysFromNow(-42, 10),
    updated_at: isoDaysFromNow(-3, 9),
    follower_count: 91,
    following_count: 118,
    profile_views_count: 740,
    is_featured: true,
    featured_sort_order: 3,
  },
  {
    id: 'demo-club-northbridge',
    role: 'club',
    full_name: 'Northbridge FC Academy',
    username: 'northbridge-academy',
    avatar_url: null,
    display_name: 'Northbridge FC',
    bio: 'Academy program recruiting dynamic wide players and progressive midfielders.',
    location: 'Leeds, UK',
    verified: true,
    verified_at: isoDaysFromNow(-40, 15),
    position: null,
    birth_year: null,
    created_at: isoDaysFromNow(-56, 14),
    updated_at: isoDaysFromNow(-4, 8),
    follower_count: 512,
    following_count: 18,
    profile_views_count: 2410,
    is_featured: true,
    featured_sort_order: 4,
  },
  {
    id: 'demo-org-summit',
    role: 'org',
    full_name: 'Summit Talent Network',
    username: 'summit-talent',
    avatar_url: null,
    display_name: 'Summit Talent',
    bio: 'Showcase organizer connecting youth players, scouts, and clubs across the region.',
    location: 'London, UK',
    verified: true,
    verified_at: isoDaysFromNow(-31, 17),
    position: null,
    birth_year: null,
    created_at: isoDaysFromNow(-48, 12),
    updated_at: isoDaysFromNow(-5, 10),
    follower_count: 341,
    following_count: 26,
    profile_views_count: 1804,
    is_featured: false,
    featured_sort_order: null,
  },
];

const DEMO_VIDEO_TEMPLATES: DemoVideoTemplate[] = [
  {
    id: 'demo-video-self-cutback',
    owner_id: CURRENT_USER_PLACEHOLDER_ID,
    storage_path: 'demo/self-cutback.mp4',
    caption: '1v1 acceleration into a cut-back chance',
    duration: 43,
    created_at: isoDaysFromNow(-1, 18),
    playback_url: SAMPLE_VIDEO_URLS[0],
    base_like_count: 88,
    base_view_count: 1420,
  },
  {
    id: 'demo-video-ruby-breakaway',
    owner_id: 'demo-player-ruby',
    storage_path: 'demo/ruby-breakaway.mp4',
    caption: 'Late winner after attacking the blind side',
    duration: 38,
    created_at: isoDaysFromNow(-1, 10),
    playback_url: SAMPLE_VIDEO_URLS[1],
    base_like_count: 148,
    base_view_count: 3200,
  },
  {
    id: 'demo-video-daniel-turn',
    owner_id: 'demo-player-daniel',
    storage_path: 'demo/daniel-turn.mp4',
    caption: 'Half-turn escape and line-breaking release',
    duration: 52,
    created_at: isoDaysFromNow(-2, 13),
    playback_url: SAMPLE_VIDEO_URLS[2],
    base_like_count: 94,
    base_view_count: 2010,
  },
  {
    id: 'demo-video-self-press',
    owner_id: CURRENT_USER_PLACEHOLDER_ID,
    storage_path: 'demo/self-press.mp4',
    caption: 'High press recovery leading to a shot',
    duration: 34,
    created_at: isoDaysFromNow(-3, 9),
    playback_url: SAMPLE_VIDEO_URLS[3],
    base_like_count: 64,
    base_view_count: 980,
  },
  {
    id: 'demo-video-ruby-combo',
    owner_id: 'demo-player-ruby',
    storage_path: 'demo/ruby-combo.mp4',
    caption: 'Third-man run finished after quick combination play',
    duration: 47,
    created_at: isoDaysFromNow(-4, 15),
    playback_url: SAMPLE_VIDEO_URLS[4],
    base_like_count: 112,
    base_view_count: 2540,
  },
];

const DEMO_CHALLENGES: DemoChallengeRecord[] = [
  {
    id: 'demo-challenge-spring-showcase',
    title: 'Spring Skills Showcase',
    description: 'Show your sharpest attacking moment from the month in a single clip.',
    month: 'March 2026',
    month_label: 'March 2026',
    starts_at: '2026-03-01T00:00:00.000Z',
    ends_at: '2026-03-31T23:59:59.000Z',
    created_by_admin: null,
    created_at: isoDaysFromNow(-20, 8),
    is_open: true,
  },
  {
    id: 'demo-challenge-first-touch',
    title: 'First Touch Master',
    description: 'Submit your cleanest first touch under pressure and next action.',
    month: 'March 2026',
    month_label: 'March 2026',
    starts_at: '2026-03-05T00:00:00.000Z',
    ends_at: '2026-03-26T23:59:59.000Z',
    created_by_admin: null,
    created_at: isoDaysFromNow(-18, 8),
    is_open: true,
  },
  {
    id: 'demo-challenge-transition-play',
    title: 'Transition Play Challenge',
    description: 'Best counter-attack contribution from regaining possession to final action.',
    month: 'April 2026',
    month_label: 'April 2026',
    starts_at: '2026-04-01T00:00:00.000Z',
    ends_at: '2026-04-30T23:59:59.000Z',
    created_by_admin: null,
    created_at: isoDaysFromNow(-10, 8),
    is_open: true,
  },
];

const DEMO_EVENTS: DemoEventRecord[] = [
  {
    id: 'demo-event-trial',
    title: 'Regional U16 Trial - North',
    date: '2026-03-22T10:00:00.000Z',
    event_date: '2026-03-22T10:00:00.000Z',
    location: 'Manchester Sports Complex',
    description: 'Open assessment day for wide forwards and midfielders across the North.',
    organizer_id: 'demo-club-northbridge',
    organizer_name: 'Northbridge FC',
    interested_count: 27,
    created_at: isoDaysFromNow(-9, 7),
  },
  {
    id: 'demo-event-showcase',
    title: 'Academy Showcase Weekend',
    date: '2026-03-28T09:00:00.000Z',
    event_date: '2026-03-28T09:00:00.000Z',
    location: 'London',
    description: 'Invite-only showcase with scouts, analysts, and academy staff in attendance.',
    organizer_id: 'demo-org-summit',
    organizer_name: 'Summit Talent',
    interested_count: 41,
    created_at: isoDaysFromNow(-7, 12),
  },
  {
    id: 'demo-event-networking',
    title: 'Scout Networking Evening',
    date: '2026-04-05T18:00:00.000Z',
    event_date: '2026-04-05T18:00:00.000Z',
    location: 'Birmingham',
    description: 'A lighter-format evening for scouts, clubs, and player support teams to connect.',
    organizer_id: 'demo-scout-ava',
    organizer_name: 'Ava Carter',
    interested_count: 19,
    created_at: isoDaysFromNow(-6, 18),
  },
];

const DEMO_CONVERSATION_SEEDS: DemoConversationSeed[] = [
  {
    conversation: {
      id: 'demo-conversation-ava',
      user_a: CURRENT_USER_PLACEHOLDER_ID,
      user_b: 'demo-scout-ava',
      last_message_at: isoDaysFromNow(-1, 19),
      created_at: isoDaysFromNow(-5, 10),
    },
    other_profile_id: 'demo-scout-ava',
    messages: [
      {
        id: 'demo-message-ava-1',
        from: 'other',
        text: 'Just reviewed your acceleration clip. The first five yards really stand out.',
        created_at: isoDaysFromNow(-2, 15),
        read_at: isoDaysFromNow(-2, 16),
      },
      {
        id: 'demo-message-ava-2',
        from: 'self',
        text: 'Appreciate that. I have two more game clips I can share from this week.',
        created_at: isoDaysFromNow(-2, 16),
        read_at: isoDaysFromNow(-2, 16),
      },
      {
        id: 'demo-message-ava-3',
        from: 'other',
        text: 'Perfect. Keep clipping those final-third actions and send me the strongest two.',
        created_at: isoDaysFromNow(-1, 19),
        read_at: null,
      },
    ],
  },
  {
    conversation: {
      id: 'demo-conversation-northbridge',
      user_a: CURRENT_USER_PLACEHOLDER_ID,
      user_b: 'demo-club-northbridge',
      last_message_at: isoDaysFromNow(-1, 13),
      created_at: isoDaysFromNow(-6, 9),
    },
    other_profile_id: 'demo-club-northbridge',
    messages: [
      {
        id: 'demo-message-club-1',
        from: 'other',
        text: 'We are hosting an invite-only showcase next Thursday. Are you available?',
        created_at: isoDaysFromNow(-1, 11),
        read_at: isoDaysFromNow(-1, 12),
      },
      {
        id: 'demo-message-club-2',
        from: 'self',
        text: 'Yes, I am available. Happy to send over a full highlight package too.',
        created_at: isoDaysFromNow(-1, 13),
        read_at: isoDaysFromNow(-1, 13),
      },
    ],
  },
];

const demoFollowState = new Map<string, Set<string>>();
const demoLikeState = new Map<string, Set<string>>();
const demoEventInterestState = new Map<string, Set<string>>();
const demoVideoViewCountState = new Map<string, number>();
const demoConversationState = new Map<string, Map<string, Message[]>>();
const demoSubmissionState = new Map<string, Map<string, ChallengeSubmission>>();

function getBaseCurrentUserProfile(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): ProfileWithCounts | null {
  if (!currentUserId) return null;

  const nowIso = new Date().toISOString();

  return {
    id: currentUserId,
    role: currentProfile?.role ?? 'player',
    full_name: currentProfile?.full_name ?? 'Jordan Cole',
    username: currentProfile?.username ?? 'jordan.cole',
    avatar_url: currentProfile?.avatar_url ?? null,
    display_name: currentProfile?.display_name ?? currentProfile?.full_name ?? 'Jordan C.',
    bio:
      currentProfile?.bio ??
      'Explosive attacker building a sharper library of trial-ready clips and full-game moments.',
    location: currentProfile?.location ?? 'Lagos, Nigeria',
    verified: currentProfile?.verified ?? true,
    verified_at: currentProfile?.verified_at ?? isoDaysFromNow(-12, 11),
    position: currentProfile?.position ?? 'Winger',
    birth_year: currentProfile?.birth_year ?? 2007,
    created_at: currentProfile?.created_at ?? isoDaysFromNow(-40, 9),
    updated_at: currentProfile?.updated_at ?? nowIso,
    follower_count: BASE_SELF_FOLLOWER_COUNT,
    following_count: BASE_SELF_FOLLOWING_COUNT,
    profile_views_count: BASE_SELF_PROFILE_VIEW_COUNT,
  };
}

function ensureDemoFollowSet(userId: string) {
  const existing = demoFollowState.get(userId);
  if (existing) return existing;

  const next = new Set(INITIAL_FOLLOWING_IDS);
  demoFollowState.set(userId, next);
  return next;
}

function ensureDemoLikeSet(userId: string) {
  const existing = demoLikeState.get(userId);
  if (existing) return existing;

  const next = new Set(INITIAL_LIKED_VIDEO_IDS);
  demoLikeState.set(userId, next);
  return next;
}

function ensureDemoEventInterestSet(userId: string) {
  const existing = demoEventInterestState.get(userId);
  if (existing) return existing;

  const next = new Set(INITIAL_INTERESTED_EVENT_IDS);
  demoEventInterestState.set(userId, next);
  return next;
}

function ensureConversationMap(userId: string) {
  const existing = demoConversationState.get(userId);
  if (existing) return existing;

  const next = new Map<string, Message[]>();
  DEMO_CONVERSATION_SEEDS.forEach((seed) => {
    next.set(
      seed.conversation.id,
      seed.messages.map((message) => ({
        id: message.id,
        conversation_id: seed.conversation.id,
        sender_id: message.from === 'self' ? userId : seed.other_profile_id,
        recipient_id: message.from === 'self' ? seed.other_profile_id : userId,
        text: message.text,
        created_at: message.created_at,
        read_at: message.read_at ?? null,
      })),
    );
  });
  demoConversationState.set(userId, next);
  return next;
}

function ensureSubmissionMap(userId: string) {
  const existing = demoSubmissionState.get(userId);
  if (existing) return existing;

  const next = new Map<string, ChallengeSubmission>();
  next.set('demo-challenge-spring-showcase', {
    id: `demo-submission-${userId}-spring`,
    challenge_id: 'demo-challenge-spring-showcase',
    user_id: userId,
    video_id: 'demo-video-self-cutback',
    admin_score: null,
    created_at: isoDaysFromNow(-2, 18),
  });
  demoSubmissionState.set(userId, next);
  return next;
}

function getAdjustedSelfMetrics(currentUserId: string | undefined) {
  const following = currentUserId ? ensureDemoFollowSet(currentUserId) : new Set<string>();
  return {
    follower_count: BASE_SELF_FOLLOWER_COUNT,
    following_count: BASE_SELF_FOLLOWING_COUNT + (following.size - INITIAL_FOLLOWING_IDS.length),
    profile_views_count: BASE_SELF_PROFILE_VIEW_COUNT,
  };
}

function toDiscoverProfile(profile: DemoProfileSeed | ProfileWithCounts): DemoDiscoverProfile {
  const discoverProfile = profile as DemoProfileSeed;
  const followerCount = profile.follower_count ?? 0;
  const profileViewsCount = profile.profile_views_count ?? 0;

  return {
    ...profile,
    age: getAge(profile.birth_year),
    popularity_score: followerCount * 3 + profileViewsCount,
    is_featured: discoverProfile.is_featured ?? false,
    featured_sort_order: discoverProfile.featured_sort_order ?? null,
  };
}

function getPublicProfileById(profileId: string | undefined) {
  if (!profileId) return null;
  return DEMO_PUBLIC_PROFILES.find((profile) => profile.id === profileId) ?? null;
}

function getProfileMap(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  const profiles = new Map<string, ProfileWithCounts>();

  DEMO_PUBLIC_PROFILES.forEach((profile) => {
    profiles.set(profile.id, { ...profile });
  });

  const currentUserProfile = getBaseCurrentUserProfile(currentUserId, currentProfile);
  if (currentUserProfile) {
    profiles.set(currentUserProfile.id, {
      ...currentUserProfile,
      ...getAdjustedSelfMetrics(currentUserId),
    });
  }

  return profiles;
}

function getResolvedOwnerId(ownerId: string, currentUserId: string | undefined) {
  if (ownerId !== CURRENT_USER_PLACEHOLDER_ID) {
    return ownerId;
  }

  return currentUserId ?? 'demo-self';
}

function getVideoLikeDelta(videoId: string, currentUserId: string | undefined) {
  if (!currentUserId) return 0;

  const likedIds = ensureDemoLikeSet(currentUserId);
  const isInitiallyLiked = INITIAL_LIKED_VIDEO_IDS.includes(videoId);
  const isCurrentlyLiked = likedIds.has(videoId);

  if (isCurrentlyLiked === isInitiallyLiked) {
    return 0;
  }

  return isCurrentlyLiked ? 1 : -1;
}

function buildDemoVideo(
  template: DemoVideoTemplate,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): VideoWithCounts {
  const profiles = getProfileMap(currentUserId, currentProfile);
  const ownerId = getResolvedOwnerId(template.owner_id, currentUserId);
  const ownerProfile = profiles.get(ownerId) ?? null;
  const extraViews = demoVideoViewCountState.get(template.id) ?? 0;

  return {
    id: template.id,
    owner_id: ownerId,
    storage_path: template.storage_path,
    caption: template.caption,
    duration: template.duration,
    created_at: template.created_at,
    playback_url: template.playback_url,
    like_count: template.base_like_count + getVideoLikeDelta(template.id, currentUserId),
    view_count: template.base_view_count + extraViews,
    owner_profile: ownerProfile ? buildProfilePreview(ownerProfile) : null,
  };
}

function getConversationOtherProfileId(conversationId: string) {
  const seed = DEMO_CONVERSATION_SEEDS.find(
    (candidate) => candidate.conversation.id === conversationId,
  );
  if (seed) {
    return seed.other_profile_id;
  }

  if (!conversationId.startsWith('demo-conversation-')) {
    return null;
  }

  const derivedProfileId = `demo-${conversationId.replace('demo-conversation-', '')}`;
  return getPublicProfileById(derivedProfileId)?.id ?? null;
}

function getChallengeTemplate(challengeId: string | undefined) {
  if (!challengeId) return null;
  return DEMO_CHALLENGES.find((challenge) => challenge.id === challengeId) ?? null;
}

const STATIC_CHALLENGE_ENTRIES: Record<string, DemoChallengeLeaderboardEntry[]> = {
  'demo-challenge-spring-showcase': [
    {
      id: 'demo-entry-ruby-spring',
      challenge_id: 'demo-challenge-spring-showcase',
      user_id: 'demo-player-ruby',
      video_id: 'demo-video-ruby-breakaway',
      admin_score: null,
      created_at: isoDaysFromNow(-3, 12),
      admin_score_value: 0,
      like_count: 148,
      view_count: 3200,
      engagement_score: 3644,
      total_score: 3644,
      player_name: 'Ruby O.',
      player_avatar_url: null,
      video_caption: 'Late winner after attacking the blind side',
    },
    {
      id: 'demo-entry-daniel-spring',
      challenge_id: 'demo-challenge-spring-showcase',
      user_id: 'demo-player-daniel',
      video_id: 'demo-video-daniel-turn',
      admin_score: null,
      created_at: isoDaysFromNow(-2, 17),
      admin_score_value: 0,
      like_count: 94,
      view_count: 2010,
      engagement_score: 2292,
      total_score: 2292,
      player_name: 'Daniel M.',
      player_avatar_url: null,
      video_caption: 'Half-turn escape and line-breaking release',
    },
  ],
  'demo-challenge-first-touch': [
    {
      id: 'demo-entry-ruby-touch',
      challenge_id: 'demo-challenge-first-touch',
      user_id: 'demo-player-ruby',
      video_id: 'demo-video-ruby-combo',
      admin_score: null,
      created_at: isoDaysFromNow(-4, 14),
      admin_score_value: 0,
      like_count: 112,
      view_count: 2540,
      engagement_score: 2876,
      total_score: 2876,
      player_name: 'Ruby O.',
      player_avatar_url: null,
      video_caption: 'Third-man run finished after quick combination play',
    },
  ],
  'demo-challenge-transition-play': [
    {
      id: 'demo-entry-daniel-transition',
      challenge_id: 'demo-challenge-transition-play',
      user_id: 'demo-player-daniel',
      video_id: 'demo-video-daniel-turn',
      admin_score: null,
      created_at: isoDaysFromNow(-1, 9),
      admin_score_value: 0,
      like_count: 94,
      view_count: 2010,
      engagement_score: 2292,
      total_score: 2292,
      player_name: 'Daniel M.',
      player_avatar_url: null,
      video_caption: 'Half-turn escape and line-breaking release',
    },
  ],
};

function buildDynamicChallengeEntry(
  challengeId: string,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  if (!currentUserId) return null;

  const submission = ensureSubmissionMap(currentUserId).get(challengeId);
  if (!submission) return null;

  const currentUserProfile = getBaseCurrentUserProfile(currentUserId, currentProfile);
  const video = getDemoVideoById(submission.video_id, currentUserId, currentProfile);
  const playerName = sanitizeDisplayName(currentUserProfile ?? { display_name: null, full_name: null });
  const likeCount = video?.like_count ?? 56;
  const viewCount = video?.view_count ?? 820;
  const engagementScore = likeCount * 3 + viewCount;

  return {
    ...submission,
    admin_score_value: submission.admin_score ?? 0,
    like_count: likeCount,
    view_count: viewCount,
    engagement_score: engagementScore,
    total_score: engagementScore,
    player_name: playerName,
    player_avatar_url: currentUserProfile?.avatar_url ?? null,
    video_caption: video?.caption ?? 'Highlight',
  } satisfies DemoChallengeLeaderboardEntry;
}

function stripCountsFromProfile(profile: ProfileWithCounts): Profile {
  const {
    follower_count: _followerCount,
    following_count: _followingCount,
    profile_views_count: _profileViewsCount,
    ...rest
  } = profile;
  return rest;
}

export function isDemoProfileId(profileId: string | undefined | null) {
  return (
    !!profileId &&
    /^(demo-player-|demo-scout-|demo-club-|demo-org-)/.test(profileId)
  );
}

export function isDemoVideoId(videoId: string | undefined | null) {
  return !!videoId && videoId.startsWith('demo-video-');
}

export function isDemoConversationId(conversationId: string | undefined | null) {
  return !!conversationId && conversationId.startsWith('demo-conversation-');
}

export function isDemoChallengeId(challengeId: string | undefined | null) {
  return !!challengeId && challengeId.startsWith('demo-challenge-');
}

export function isDemoEventId(eventId: string | undefined | null) {
  return !!eventId && eventId.startsWith('demo-event-');
}

export function getDemoProfileById(
  profileId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): ProfileWithCounts | null {
  if (!profileId) return null;

  if (currentUserId && profileId === currentUserId) {
    const base = getBaseCurrentUserProfile(currentUserId, currentProfile);
    return base ? { ...base, ...getAdjustedSelfMetrics(currentUserId) } : null;
  }

  const profile = getPublicProfileById(profileId);
  if (!profile) return null;

  if (currentUserId && ensureDemoFollowSet(currentUserId).has(profile.id)) {
    return {
      ...profile,
      follower_count: profile.follower_count + 1,
    };
  }

  return { ...profile };
}

export function listDemoFollowers(
  userId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): Profile[] {
  if (!userId) return [];

  if (currentUserId && userId === currentUserId) {
    return INITIAL_FOLLOWER_IDS.map((profileId) => getDemoProfileById(profileId, currentUserId, currentProfile))
      .filter((profile): profile is ProfileWithCounts => !!profile)
      .map(stripCountsFromProfile);
  }

  if (!getPublicProfileById(userId)) {
    return [];
  }

  return DEMO_PUBLIC_PROFILES
    .filter((candidate) => candidate.id !== userId)
    .slice(0, 3)
    .map(stripCountsFromProfile);
}

export function listDemoFollowing(
  userId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): Profile[] {
  if (!userId) return [];

  if (currentUserId && userId === currentUserId) {
    return Array.from(ensureDemoFollowSet(currentUserId))
      .map((profileId) => getDemoProfileById(profileId, currentUserId, currentProfile))
      .filter((profile): profile is ProfileWithCounts => !!profile)
      .map(stripCountsFromProfile);
  }

  return DEMO_PUBLIC_PROFILES.slice(0, 2).map(stripCountsFromProfile);
}

export function listDemoFeedVideos(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
  limit = 20,
) {
  return DEMO_VIDEO_TEMPLATES
    .map((template) => buildDemoVideo(template, currentUserId, currentProfile))
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, limit);
}

export function listDemoProfileVideos(
  profileId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
  limit = 12,
) {
  if (!profileId) return [];

  return DEMO_VIDEO_TEMPLATES
    .filter(
      (template) => getResolvedOwnerId(template.owner_id, currentUserId) === profileId,
    )
    .map((template) => buildDemoVideo(template, currentUserId, currentProfile))
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, limit);
}

export function getDemoVideoById(
  videoId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  if (!videoId) return null;

  const template = DEMO_VIDEO_TEMPLATES.find((candidate) => candidate.id === videoId);
  return template ? buildDemoVideo(template, currentUserId, currentProfile) : null;
}

export function recordDemoVideoView(videoId: string) {
  demoVideoViewCountState.set(videoId, (demoVideoViewCountState.get(videoId) ?? 0) + 1);
}

export function isDemoVideoLiked(videoId: string, currentUserId: string | undefined) {
  if (!currentUserId) return false;
  return ensureDemoLikeSet(currentUserId).has(videoId);
}

export function setDemoVideoLiked(
  videoId: string,
  currentUserId: string,
  liked: boolean,
) {
  const likedSet = ensureDemoLikeSet(currentUserId);

  if (liked) {
    likedSet.add(videoId);
  } else {
    likedSet.delete(videoId);
  }
}

export function listDemoDiscoverProfiles(
  filters: {
    search?: string;
    position?: string;
    location?: string;
    role?: DemoDiscoverRoleFilter;
    minAge?: string;
    maxAge?: string;
    sort?: DemoDiscoverSort;
    limit?: number;
  },
) {
  const role = filters.role ?? 'player';
  const sort = filters.sort ?? 'latest';
  const limit = filters.limit ?? 40;
  const search = filters.search?.trim().toLowerCase() ?? '';
  const position = filters.position?.trim().toLowerCase() ?? '';
  const location = filters.location?.trim().toLowerCase() ?? '';
  const minAge = Number(filters.minAge);
  const maxAge = Number(filters.maxAge);

  let profiles = DEMO_PUBLIC_PROFILES.map(toDiscoverProfile);

  if (role !== 'all') {
    profiles = profiles.filter((profile) => profile.role === role);
  }

  if (position) {
    profiles = profiles.filter((profile) =>
      profile.position?.toLowerCase().includes(position),
    );
  }

  if (location) {
    profiles = profiles.filter((profile) =>
      profile.location?.toLowerCase().includes(location),
    );
  }

  if (Number.isFinite(minAge)) {
    profiles = profiles.filter(
      (profile) => profile.age === null || profile.age >= Number(minAge),
    );
  }

  if (Number.isFinite(maxAge)) {
    profiles = profiles.filter(
      (profile) => profile.age === null || profile.age <= Number(maxAge),
    );
  }

  if (search) {
    profiles = profiles.filter((profile) =>
      [
        profile.display_name,
        profile.full_name,
        profile.username,
        profile.location,
        profile.position,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search)),
    );
  }

  if (sort === 'featured') {
    profiles = profiles
      .filter((profile) => profile.is_featured)
      .sort((left, right) => {
        const leftOrder = left.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder;
      });
  } else if (sort === 'popular') {
    profiles = profiles.sort((left, right) => right.popularity_score - left.popularity_score);
  } else if (sort === 'recommended') {
    const recommendedOrder = [
      'demo-player-ruby',
      'demo-scout-ava',
      'demo-club-northbridge',
      'demo-player-daniel',
      'demo-org-summit',
    ];
    profiles = profiles.sort(
      (left, right) =>
        recommendedOrder.indexOf(left.id) - recommendedOrder.indexOf(right.id),
    );
  } else {
    profiles = profiles.sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
  }

  return profiles.slice(0, limit);
}

export function getDemoExploreSections(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  const featuredPlayers = DEMO_PUBLIC_PROFILES
    .map(toDiscoverProfile)
    .filter((profile) => profile.is_featured)
    .sort((left, right) => {
      const leftOrder = left.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.featured_sort_order ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    })
    .slice(0, 4);

  const allVideos = listDemoFeedVideos(currentUserId, currentProfile, 12);

  return {
    featuredPlayers,
    featuredVideos: allVideos.slice(0, 4),
    trendingVideos: [...allVideos]
      .sort((left, right) => {
        const leftScore = left.like_count * 3 + left.view_count;
        const rightScore = right.like_count * 3 + right.view_count;
        return rightScore - leftScore;
      })
      .slice(0, 4),
    challenges: DEMO_CHALLENGES.slice(0, 3).map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      month_label: challenge.month_label,
      starts_at: challenge.starts_at,
      ends_at: challenge.ends_at,
      is_open: challenge.is_open,
      submission_count: listDemoChallengeLeaderboard(
        challenge.id,
        currentUserId,
        currentProfile,
      ).length,
    })),
    events: DEMO_EVENTS.slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      organizer_name: event.organizer_name,
    })),
  };
}

export function listDemoConversations(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): ConversationSummary[] {
  if (!currentUserId) return [];

  const conversationMap = ensureConversationMap(currentUserId);
  const profiles = getProfileMap(currentUserId, currentProfile);

  return Array.from(conversationMap.entries())
    .map<ConversationSummary | null>(([conversationId, messages]) => {
      const otherProfileId = getConversationOtherProfileId(conversationId);
      if (!otherProfileId) {
        return null;
      }

      const otherProfile = profiles.get(otherProfileId);
      const sortedMessages = [...messages].sort(
        (left, right) => Date.parse(left.created_at) - Date.parse(right.created_at),
      );
      const latestMessage = sortedMessages[sortedMessages.length - 1] ?? null;
      const seed =
        DEMO_CONVERSATION_SEEDS.find((candidate) => candidate.conversation.id === conversationId) ??
        null;

      return {
        id: conversationId,
        user_a: currentUserId,
        user_b: otherProfileId,
        created_at: seed?.conversation.created_at ?? isoDaysFromNow(-5, 10),
        last_message_at: latestMessage?.created_at ?? seed?.conversation.last_message_at ?? isoDaysFromNow(-1, 12),
        other_profile: otherProfile ? buildProfilePreview(otherProfile) : null,
        last_message_text: latestMessage?.text ?? null,
        unread_count: sortedMessages.filter(
          (message) => message.recipient_id === currentUserId && !message.read_at,
        ).length,
      };
    })
    .filter((conversation): conversation is ConversationSummary => !!conversation)
    .sort((left, right) => Date.parse(right.last_message_at) - Date.parse(left.last_message_at));
}

export function getDemoConversationThread(
  conversationId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  if (!conversationId || !currentUserId) return null;

  const conversationMap = ensureConversationMap(currentUserId);
  const messages = conversationMap.get(conversationId);
  if (!messages) return null;

  const otherProfileId = getConversationOtherProfileId(conversationId);
  const otherProfile = otherProfileId
    ? getProfileMap(currentUserId, currentProfile).get(otherProfileId) ?? null
    : null;

  return {
    conversation: {
      id: conversationId,
      user_a: currentUserId,
      user_b: otherProfileId ?? 'demo-user',
      created_at: DEMO_CONVERSATION_SEEDS.find(
        (candidate) => candidate.conversation.id === conversationId,
      )?.conversation.created_at ?? isoDaysFromNow(-5, 10),
      last_message_at:
        [...messages].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0]
          ?.created_at ?? isoDaysFromNow(-1, 12),
    },
    other_profile: otherProfile ? buildProfilePreview(otherProfile) : null,
    messages: [...messages].sort(
      (left, right) => Date.parse(left.created_at) - Date.parse(right.created_at),
    ),
    unread_count: messages.filter(
      (message) => message.recipient_id === currentUserId && !message.read_at,
    ).length,
  };
}

export function getOrCreateDemoConversation(
  currentUserId: string,
  otherProfileId: string,
) {
  const conversationMap = ensureConversationMap(currentUserId);
  const existingId = Array.from(conversationMap.keys()).find(
    (conversationId) => getConversationOtherProfileId(conversationId) === otherProfileId,
  );

  if (existingId) {
    return {
      id: existingId,
      user_a: currentUserId,
      user_b: otherProfileId,
      created_at: isoDaysFromNow(-5, 10),
      last_message_at:
        [...(conversationMap.get(existingId) ?? [])]
          .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0]
          ?.created_at ?? isoDaysFromNow(-1, 12),
    } satisfies Conversation;
  }

  const conversationId = `demo-conversation-${otherProfileId.replace('demo-', '')}`;
  conversationMap.set(conversationId, [
    {
      id: `demo-message-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: otherProfileId,
      recipient_id: currentUserId,
      text: 'Thanks for reaching out. Happy to continue here.',
      created_at: new Date().toISOString(),
      read_at: null,
    },
  ]);

  return {
    id: conversationId,
    user_a: currentUserId,
    user_b: otherProfileId,
    created_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  } satisfies Conversation;
}

export function markDemoConversationRead(
  conversationId: string,
  currentUserId: string,
) {
  const conversationMap = ensureConversationMap(currentUserId);
  const messages = conversationMap.get(conversationId);
  if (!messages) return;

  const readAt = new Date().toISOString();
  conversationMap.set(
    conversationId,
    messages.map((message) =>
      message.recipient_id === currentUserId && !message.read_at
        ? { ...message, read_at: readAt }
        : message,
    ),
  );
}

export function sendDemoMessage(
  conversationId: string,
  currentUserId: string,
  text: string,
) {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Write a message before sending.');
  }

  const conversationMap = ensureConversationMap(currentUserId);
  const thread = conversationMap.get(conversationId);
  const otherProfileId = getConversationOtherProfileId(conversationId);

  if (!thread || !otherProfileId) {
    throw new Error('Conversation not found.');
  }

  conversationMap.set(conversationId, [
    ...thread,
    {
      id: `demo-message-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      recipient_id: otherProfileId,
      text: trimmedText,
      created_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
    },
  ]);
}

export function listDemoChallenges(limit = 12) {
  return [...DEMO_CHALLENGES]
    .sort((left, right) => {
      if (left.is_open !== right.is_open) {
        return left.is_open ? -1 : 1;
      }

      const leftStartsAt = left.starts_at ? Date.parse(left.starts_at) : 0;
      const rightStartsAt = right.starts_at ? Date.parse(right.starts_at) : 0;
      return rightStartsAt - leftStartsAt;
    })
    .slice(0, limit)
    .map((challenge) => ({
      ...challenge,
      submission_count: listDemoChallengeLeaderboard(
        challenge.id,
        undefined,
        null,
      ).length,
    }));
}

export function getDemoChallengeById(challengeId: string | undefined) {
  if (!challengeId) return null;

  const challenge = getChallengeTemplate(challengeId);
  if (!challenge) return null;

  return {
    ...challenge,
    submission_count: listDemoChallengeLeaderboard(challengeId, undefined, null).length,
  };
}

export function listDemoChallengeVideos(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  return listDemoProfileVideos(currentUserId, currentUserId, currentProfile, 24);
}

export function getDemoChallengeSubmission(
  challengeId: string | undefined,
  currentUserId: string | undefined,
) {
  if (!challengeId || !currentUserId) return null;
  return ensureSubmissionMap(currentUserId).get(challengeId) ?? null;
}

export function submitDemoChallengeVideo(
  challengeId: string,
  videoId: string,
  currentUserId: string,
) {
  ensureSubmissionMap(currentUserId).set(challengeId, {
    id: `demo-submission-${currentUserId}-${challengeId}`,
    challenge_id: challengeId,
    user_id: currentUserId,
    video_id: videoId,
    admin_score: null,
    created_at: new Date().toISOString(),
  });
}

export function listDemoChallengeLeaderboard(
  challengeId: string | undefined,
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
) {
  if (!challengeId) return [];

  const staticEntries = STATIC_CHALLENGE_ENTRIES[challengeId] ?? [];
  const dynamicEntry = buildDynamicChallengeEntry(challengeId, currentUserId, currentProfile);
  const entries = dynamicEntry ? [...staticEntries, dynamicEntry] : [...staticEntries];

  return entries
    .sort((left, right) => {
      if (right.total_score !== left.total_score) return right.total_score - left.total_score;
      if (right.like_count !== left.like_count) return right.like_count - left.like_count;
      if (right.view_count !== left.view_count) return right.view_count - left.view_count;
      return Date.parse(left.created_at) - Date.parse(right.created_at);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function listDemoEvents(limit = 12, currentUserId?: string) {
  const interested = currentUserId ? ensureDemoEventInterestSet(currentUserId) : new Set<string>();

  return DEMO_EVENTS.map((event) => ({
    ...event,
    interested_count:
      event.interested_count +
      (interested.has(event.id) && !INITIAL_INTERESTED_EVENT_IDS.includes(event.id)
        ? 1
        : !interested.has(event.id) && INITIAL_INTERESTED_EVENT_IDS.includes(event.id)
          ? -1
          : 0),
  })).slice(0, limit);
}

export function getDemoEventById(eventId: string | undefined, currentUserId?: string) {
  if (!eventId) return null;
  return listDemoEvents(12, currentUserId).find((event) => event.id === eventId) ?? null;
}

export function isDemoEventInterested(eventId: string, currentUserId: string | undefined) {
  if (!currentUserId) return false;
  return ensureDemoEventInterestSet(currentUserId).has(eventId);
}

export function setDemoEventInterested(
  eventId: string,
  currentUserId: string,
  interested: boolean,
) {
  const interestedSet = ensureDemoEventInterestSet(currentUserId);

  if (interested) {
    interestedSet.add(eventId);
  } else {
    interestedSet.delete(eventId);
  }
}

export function isDemoFollowing(
  currentUserId: string | undefined,
  profileId: string | undefined,
) {
  if (!currentUserId || !profileId) return false;
  return ensureDemoFollowSet(currentUserId).has(profileId);
}

export function setDemoFollowing(
  currentUserId: string,
  profileId: string,
  isFollowing: boolean,
) {
  const followingSet = ensureDemoFollowSet(currentUserId);

  if (isFollowing) {
    followingSet.add(profileId);
  } else {
    followingSet.delete(profileId);
  }
}
