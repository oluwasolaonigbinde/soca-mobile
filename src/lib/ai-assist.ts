export interface RankableVideo {
  id: string;
  owner_id: string;
  created_at: string;
}

export interface RecommendationSignal {
  directSignal: number;
  positionAffinity: number;
  locationAffinity: number;
}

export interface RankableProfile {
  id: string;
  popularity_score: number;
  created_at: string;
}

export function buildAffinityKey(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function buildAffinityCounts(values: (string | null | undefined)[]) {
  return values.reduce<Map<string, number>>((counts, value) => {
    const key = buildAffinityKey(value);
    if (!key) {
      return counts;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

export function sortNetworkFeedVideos<T extends RankableVideo>(
  videos: T[],
  ownerScores: Map<string, number>,
) {
  return [...videos].sort((left, right) => {
    const scoreDelta = (ownerScores.get(right.owner_id) ?? 0) - (ownerScores.get(left.owner_id) ?? 0);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });
}

export function mergeUniqueById<T extends { id: string }>(primary: T[], fallback: T[], limit: number) {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const collection of [primary, fallback]) {
    for (const item of collection) {
      if (seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      merged.push(item);

      if (merged.length >= limit) {
        return merged;
      }
    }
  }

  return merged;
}

export function hasRecommendationSignals(signals: Map<string, RecommendationSignal>) {
  return Array.from(signals.values()).some(
    (signal) =>
      signal.directSignal > 0 || signal.positionAffinity > 0 || signal.locationAffinity > 0,
  );
}

export function sortRecommendedProfiles<T extends RankableProfile>(
  profiles: T[],
  signals: Map<string, RecommendationSignal>,
) {
  return [...profiles].sort((left, right) => {
    const leftSignal = signals.get(left.id) ?? {
      directSignal: 0,
      positionAffinity: 0,
      locationAffinity: 0,
    };
    const rightSignal = signals.get(right.id) ?? {
      directSignal: 0,
      positionAffinity: 0,
      locationAffinity: 0,
    };

    if (rightSignal.directSignal !== leftSignal.directSignal) {
      return rightSignal.directSignal - leftSignal.directSignal;
    }

    const leftAffinity = leftSignal.positionAffinity * 2 + leftSignal.locationAffinity;
    const rightAffinity = rightSignal.positionAffinity * 2 + rightSignal.locationAffinity;
    if (rightAffinity !== leftAffinity) {
      return rightAffinity - leftAffinity;
    }

    if (right.popularity_score !== left.popularity_score) {
      return right.popularity_score - left.popularity_score;
    }

    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });
}
