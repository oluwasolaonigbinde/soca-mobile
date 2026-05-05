import { requireCurrentUserRole } from '@/lib/authorization';
import {
  DEMO_MODE_ENABLED,
  getDemoChallengeById,
  getDemoChallengeSubmission,
  isDemoChallengeId,
  isDemoVideoId,
  listDemoChallengeLeaderboard,
  listDemoChallengeVideos,
  listDemoChallenges,
  submitDemoChallengeVideo,
} from '@/lib/demo-mode';
import { listProfileVideos } from '@/lib/videos';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Challenge, ChallengeSubmission, Profile, Video, VideoWithCounts } from '@/types/database';

type RawRow = Record<string, unknown>;

export interface ChallengeWithStatus extends Challenge {
  month_label: string | null;
  is_open: boolean;
  submission_count?: number;
}

export interface ChallengeLeaderboardEntry extends ChallengeSubmission {
  admin_score_value: number;
  like_count: number;
  view_count: number;
  engagement_score: number;
  total_score: number;
  player_name: string;
  player_avatar_url: string | null;
  video_caption: string | null;
}

export function getChallengeEngagementScore(likeCount: number, viewCount: number) {
  return likeCount * 3 + viewCount;
}

export function sortChallengeLeaderboardEntries(
  entries: ChallengeLeaderboardEntry[],
) {
  return [...entries].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.like_count !== a.like_count) return b.like_count - a.like_count;
    if (b.view_count !== a.view_count) return b.view_count - a.view_count;
    return Date.parse(a.created_at) - Date.parse(b.created_at);
  });
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

function getString(row: RawRow, key: string) {
  const value = row[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function buildCountMap(rows: RawRow[], key: string) {
  return rows.reduce<Map<string, number>>((map, row) => {
    const rawKey = row[key];
    if (typeof rawKey !== 'string' || rawKey.length === 0) return map;

    map.set(rawKey, (map.get(rawKey) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}

function sortChallengesForDisplay(challenges: ChallengeWithStatus[]) {
  return [...challenges].sort((left, right) => {
    if (left.is_open !== right.is_open) {
      return left.is_open ? -1 : 1;
    }

    const leftStartsAt = left.starts_at ? Date.parse(left.starts_at) : 0;
    const rightStartsAt = right.starts_at ? Date.parse(right.starts_at) : 0;
    return rightStartsAt - leftStartsAt;
  });
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

function normalizeChallenge(row: RawRow): ChallengeWithStatus | null {
  const id = getString(row, 'id');
  const createdAt = getString(row, 'created_at');

  if (!id || !createdAt) return null;

  const startsAt = getString(row, 'starts_at') ?? getString(row, 'start_date');
  const endsAt = getString(row, 'ends_at') ?? getString(row, 'end_date');
  const now = Date.now();
  const startsAtTime = startsAt ? Date.parse(startsAt) : Number.NEGATIVE_INFINITY;
  const endsAtTime = endsAt ? Date.parse(endsAt) : Number.POSITIVE_INFINITY;

  return {
    id,
    title: getString(row, 'title') ?? getString(row, 'name') ?? 'Challenge',
    description: getString(row, 'description'),
    month: getString(row, 'month'),
    month_label: getString(row, 'month_label') ?? getString(row, 'month'),
    starts_at: startsAt,
    ends_at: endsAt,
    created_by_admin: getString(row, 'created_by_admin') ?? getString(row, 'created_by'),
    created_at: createdAt,
    is_open: startsAtTime <= now && now < endsAtTime,
  };
}

function rankEntries(entries: ChallengeLeaderboardEntry[]) {
  let currentRank = 0;
  let previousScore: number | null = null;

  return entries.map((entry, index) => {
    if (previousScore === null || entry.total_score !== previousScore) {
      currentRank = index + 1;
      previousScore = entry.total_score;
    }

    return {
      ...entry,
      rank: currentRank,
    };
  });
}

export async function listChallenges(limit = 12): Promise<ChallengeWithStatus[]> {
  if (DEMO_MODE_ENABLED) {
    return listDemoChallenges(limit) as ChallengeWithStatus[];
  }

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const challenges = ((data as RawRow[] | null) ?? [])
    .map(normalizeChallenge)
    .filter((row): row is ChallengeWithStatus => !!row);
  const submissionCounts = await listChallengeSubmissionCounts(
    challenges.map((challenge) => challenge.id),
  );

  return sortChallengesForDisplay(
    challenges.map((challenge) => ({
      ...challenge,
      submission_count: submissionCounts.get(challenge.id),
    })),
  );
}

export async function getChallengeById(challengeId: string): Promise<ChallengeWithStatus | null> {
  if (DEMO_MODE_ENABLED && isDemoChallengeId(challengeId)) {
    return getDemoChallengeById(challengeId) as ChallengeWithStatus | null;
  }

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  if (!data) return null;
  const challenge = normalizeChallenge(data as RawRow);
  if (!challenge) return null;

  const submissionCounts = await listChallengeSubmissionCounts([challenge.id]);
  return {
    ...challenge,
    submission_count: submissionCounts.get(challenge.id),
  };
}

export async function listChallengeVideosForCurrentUser(): Promise<VideoWithCounts[]> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (DEMO_MODE_ENABLED) {
    return listDemoChallengeVideos(user?.id ?? undefined, useAuthStore.getState().profile);
  }
  if (!user) return [];

  return listProfileVideos(user.id, 24);
}

export async function getCurrentUserChallengeSubmission(challengeId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (DEMO_MODE_ENABLED && isDemoChallengeId(challengeId)) {
    return getDemoChallengeSubmission(challengeId, user?.id ?? undefined);
  }
  if (!user) return null;

  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  return (data as ChallengeSubmission | null) ?? null;
}

export async function submitChallengeVideo(challengeId: string, videoId: string) {
  if (DEMO_MODE_ENABLED && isDemoChallengeId(challengeId) && isDemoVideoId(videoId)) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    submitDemoChallengeVideo(challengeId, videoId, user.id);
    return;
  }

  const profile = await requireCurrentUserRole(
    'player',
    'submit videos to challenges',
  );

  const challenge = await getChallengeById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found.');
  }
  if (!challenge.is_open) {
    throw new Error('This challenge is not currently accepting submissions.');
  }

  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('owner_id', profile.id)
    .maybeSingle();

  if (videoError) throw videoError;
  if (!video) {
    throw new Error('Choose one of your own uploaded videos.');
  }

  const existingSubmission = await getCurrentUserChallengeSubmission(challengeId);
  if (existingSubmission) {
    const { error } = await supabase
      .from('challenge_submissions')
      .update({
        video_id: videoId,
        admin_score: null,
      })
      .eq('id', existingSubmission.id)
      .eq('user_id', profile.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('challenge_submissions').insert({
    challenge_id: challengeId,
    user_id: profile.id,
    video_id: videoId,
    admin_score: null,
  });

  if (error) throw error;
}

export async function listChallengeLeaderboard(
  challengeId: string,
): Promise<(ChallengeLeaderboardEntry & { rank: number })[]> {
  if (DEMO_MODE_ENABLED && isDemoChallengeId(challengeId)) {
    return listDemoChallengeLeaderboard(
      challengeId,
      useAuthStore.getState().session?.user?.id,
      useAuthStore.getState().profile,
    ) as (ChallengeLeaderboardEntry & { rank: number })[];
  }

  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const submissions = (data as ChallengeSubmission[] | null) ?? [];
  if (submissions.length === 0) return [];

  const userIds = Array.from(new Set(submissions.map((submission) => submission.user_id)));
  const videoIds = Array.from(new Set(submissions.map((submission) => submission.video_id)));

  const [
    { data: profileRows, error: profileError },
    { data: videoRows, error: videoError },
    { data: likeRows, error: likeError },
    { data: viewRows, error: viewError },
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, full_name, avatar_url').in('id', userIds),
    supabase.from('videos').select('id, caption').in('id', videoIds),
    supabase.from('video_likes').select('video_id').in('video_id', videoIds),
    supabase.from('video_views').select('video_id').in('video_id', videoIds),
  ]);

  if (profileError) throw profileError;
  if (videoError) throw videoError;
  if (likeError) throw likeError;
  if (viewError) throw viewError;

  const profileMap = new Map(
    (((profileRows as (Pick<Profile, 'id' | 'display_name' | 'full_name' | 'avatar_url'>)[] | null) ?? []).map(
      (profile) => [profile.id, profile],
    )),
  );
  const videoMap = new Map(
    (((videoRows as (Pick<Video, 'id' | 'caption'>)[] | null) ?? []).map((video) => [video.id, video])),
  );
  const likeCounts = buildCountMap((likeRows as RawRow[] | null) ?? [], 'video_id');
  const viewCounts = buildCountMap((viewRows as RawRow[] | null) ?? [], 'video_id');

  const ranked = submissions
    .map<ChallengeLeaderboardEntry>((submission) => {
      const profile = profileMap.get(submission.user_id);
      const video = videoMap.get(submission.video_id);
      const likeCount = likeCounts.get(submission.video_id) ?? 0;
      const viewCount = viewCounts.get(submission.video_id) ?? 0;
      const adminScoreValue = submission.admin_score ?? 0;
      const engagementScore = getChallengeEngagementScore(likeCount, viewCount);

      return {
        ...submission,
        admin_score_value: adminScoreValue,
        like_count: likeCount,
        view_count: viewCount,
        engagement_score: engagementScore,
        total_score: engagementScore,
        player_name: profile?.display_name || profile?.full_name || 'Unknown player',
        player_avatar_url: profile?.avatar_url ?? null,
        video_caption: video?.caption ?? null,
      };
    });

  return rankEntries(sortChallengeLeaderboardEntries(ranked));
}
