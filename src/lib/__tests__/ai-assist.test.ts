import {
  buildAffinityCounts,
  hasRecommendationSignals,
  mergeUniqueById,
  sortNetworkFeedVideos,
  sortRecommendedProfiles,
  type RecommendationSignal,
} from '@/lib/ai-assist';

describe('ai assist helpers', () => {
  it('prioritizes higher-signal owners in the feed before fallback recency', () => {
    const videos = [
      { id: 'video-1', owner_id: 'owner-a', created_at: '2026-03-01T10:00:00.000Z' },
      { id: 'video-2', owner_id: 'owner-b', created_at: '2026-03-02T10:00:00.000Z' },
      { id: 'video-3', owner_id: 'owner-a', created_at: '2026-03-03T10:00:00.000Z' },
    ];
    const ownerScores = new Map([
      ['owner-a', 10],
      ['owner-b', 4],
    ]);

    const prioritized = sortNetworkFeedVideos(videos, ownerScores);
    const merged = mergeUniqueById(prioritized, [{ id: 'video-4', owner_id: 'owner-c', created_at: '2026-03-04T10:00:00.000Z' }], 4);

    expect(prioritized.map((video) => video.id)).toEqual(['video-3', 'video-1', 'video-2']);
    expect(merged.map((video) => video.id)).toEqual(['video-3', 'video-1', 'video-2', 'video-4']);
  });

  it('normalizes shared profile attributes for similarity scoring', () => {
    const positionCounts = buildAffinityCounts([' Midfielder ', 'midfielder', null, 'Defender']);

    expect(positionCounts.get('midfielder')).toBe(2);
    expect(positionCounts.get('defender')).toBe(1);
  });

  it('orders recommended profiles by direct signals, then similarity, then popularity', () => {
    const profiles = [
      {
        id: 'player-direct',
        popularity_score: 4,
        created_at: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'player-similar',
        popularity_score: 10,
        created_at: '2026-03-02T10:00:00.000Z',
      },
      {
        id: 'player-popular',
        popularity_score: 50,
        created_at: '2026-03-03T10:00:00.000Z',
      },
    ];

    const recommendationSignals = new Map<string, RecommendationSignal>([
      [
        'player-direct',
        { directSignal: 3, positionAffinity: 0, locationAffinity: 0 },
      ],
      [
        'player-similar',
        { directSignal: 0, positionAffinity: 2, locationAffinity: 1 },
      ],
      [
        'player-popular',
        { directSignal: 0, positionAffinity: 0, locationAffinity: 0 },
      ],
    ]);

    expect(hasRecommendationSignals(recommendationSignals)).toBe(true);
    expect(sortRecommendedProfiles(profiles, recommendationSignals).map((profile) => profile.id)).toEqual([
      'player-direct',
      'player-similar',
      'player-popular',
    ]);
  });
});
