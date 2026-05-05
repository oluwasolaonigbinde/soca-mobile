import { listFeedPosts, listProfilePosts } from '@/lib/posts';
import { useQuery } from '@tanstack/react-query';

export function usePosts(limit = 20) {
  return useQuery({
    queryKey: ['posts', 'feed', limit],
    queryFn: () => listFeedPosts(limit),
  });
}

export function useProfilePosts(profileId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['posts', 'profile', profileId, limit],
    queryFn: () => listProfilePosts(profileId!, limit),
    enabled: !!profileId,
  });
}
