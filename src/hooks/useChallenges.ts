import {
  getChallengeById,
  getCurrentUserChallengeSubmission,
  listChallengeLeaderboard,
  listChallengeVideosForCurrentUser,
  listChallenges,
} from '@/lib/challenges';
import { useQuery } from '@tanstack/react-query';

export function useChallenges(limit = 12) {
  return useQuery({
    queryKey: ['challenges', 'list', limit],
    queryFn: () => listChallenges(limit),
  });
}

export function useChallengeById(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenges', 'detail', challengeId],
    queryFn: () => getChallengeById(challengeId!),
    enabled: !!challengeId,
  });
}

export function useChallengeLeaderboard(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenges', 'leaderboard', challengeId],
    queryFn: () => listChallengeLeaderboard(challengeId!),
    enabled: !!challengeId,
  });
}

export function useChallengeVideos() {
  return useQuery({
    queryKey: ['challenges', 'videos'],
    queryFn: listChallengeVideosForCurrentUser,
  });
}

export function useCurrentUserChallengeSubmission(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenges', 'submission', challengeId],
    queryFn: () => getCurrentUserChallengeSubmission(challengeId!),
    enabled: !!challengeId,
  });
}
