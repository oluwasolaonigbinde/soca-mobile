import {
  follow as followUser,
  isFollowing as checkIsFollowing,
  unfollow as unfollowUser,
} from '@/lib/follows';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useFollowStatus(profileId: string | undefined) {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const queryClient = useQueryClient();

  const { data: isFollowing, isLoading: isQueryLoading } = useQuery({
    queryKey: ['followStatus', currentUserId, profileId],
    queryFn: () =>
      currentUserId && profileId
        ? checkIsFollowing(currentUserId, profileId)
        : Promise.resolve(false),
    enabled: !!currentUserId && !!profileId,
  });

  const mutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      if (!profileId) throw new Error('No profile');
      if (action === 'follow') {
        await followUser(profileId);
      } else {
        await unfollowUser(profileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['followStatus', currentUserId, profileId] });
      queryClient.invalidateQueries({ queryKey: ['followers', profileId] });
      queryClient.invalidateQueries({ queryKey: ['followers', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });

  return {
    isFollowing: isFollowing ?? false,
    isLoading: isQueryLoading || mutation.isPending,
    follow: () => mutation.mutateAsync('follow'),
    unfollow: () => mutation.mutateAsync('unfollow'),
  };
}
