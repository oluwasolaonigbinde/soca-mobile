import {
  getChallengeEngagementScore,
  sortChallengeLeaderboardEntries,
  type ChallengeLeaderboardEntry,
} from '@/lib/challenges';

jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));

jest.mock('@/lib/authorization', () => ({
  requireCurrentUserRole: jest.fn(),
}));

jest.mock('@/lib/videos', () => ({
  listProfileVideos: jest.fn(),
}));

function makeEntry(
  overrides: Partial<ChallengeLeaderboardEntry> = {},
): ChallengeLeaderboardEntry {
  return {
    id: 'submission-1',
    challenge_id: 'challenge-1',
    user_id: 'user-1',
    video_id: 'video-1',
    admin_score: 99,
    admin_score_value: 99,
    like_count: 1,
    view_count: 1,
    engagement_score: 4,
    total_score: 4,
    player_name: 'Player One',
    player_avatar_url: null,
    video_caption: 'Top dribble',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('challenge leaderboard scoring', () => {
  it('derives public score from engagement only', () => {
    expect(getChallengeEngagementScore(2, 5)).toBe(11);
  });

  it('sorts leaderboard entries by community score instead of admin score', () => {
    const sorted = sortChallengeLeaderboardEntries([
      makeEntry({
        id: 'submission-high-admin',
        admin_score: 500,
        admin_score_value: 500,
        like_count: 1,
        view_count: 1,
        engagement_score: 4,
        total_score: 4,
      }),
      makeEntry({
        id: 'submission-high-engagement',
        admin_score: 0,
        admin_score_value: 0,
        like_count: 4,
        view_count: 1,
        engagement_score: 13,
        total_score: 13,
      }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual([
      'submission-high-engagement',
      'submission-high-admin',
    ]);
  });
});
