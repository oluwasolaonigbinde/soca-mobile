import { listFeedVideos, listProfileVideos } from '@/lib/videos';
import { useQuery } from '@tanstack/react-query';

export function useVideos(limit = 20) {
  return useQuery({
    queryKey: ['videos', 'feed', limit],
    queryFn: () => listFeedVideos(limit),
  });
}

export function useProfileVideos(profileId: string | undefined, limit = 12) {
  return useQuery({
    queryKey: ['videos', 'profile', profileId, limit],
    queryFn: () => listProfileVideos(profileId!, limit),
    enabled: !!profileId,
  });
}
