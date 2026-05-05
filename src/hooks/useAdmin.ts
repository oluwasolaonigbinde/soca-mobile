import {
  getAdminOverview,
  listAdminChallenges,
  listAdminChallengeSubmissions,
  listAdminEvents,
  listFeaturedItemsAdmin,
  listReports,
  listVerificationProfiles,
} from '@/lib/admin';
import { useQuery } from '@tanstack/react-query';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: getAdminOverview,
  });
}

export function useAdminChallenges(limit = 24) {
  return useQuery({
    queryKey: ['admin', 'challenges', limit],
    queryFn: () => listAdminChallenges(limit),
  });
}

export function useAdminEvents(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'events', limit],
    queryFn: () => listAdminEvents(limit),
  });
}

export function useAdminChallengeSubmissions(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'challenge-submissions', challengeId],
    queryFn: () => listAdminChallengeSubmissions(challengeId!),
    enabled: !!challengeId,
  });
}

export function useAdminReports(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'reports', limit],
    queryFn: () => listReports(limit),
  });
}

export function useAdminFeaturedItems(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'featured-items', limit],
    queryFn: () => listFeaturedItemsAdmin(limit),
  });
}

export function useVerificationProfiles(limit = 40) {
  return useQuery({
    queryKey: ['admin', 'verification', limit],
    queryFn: () => listVerificationProfiles(limit),
  });
}
