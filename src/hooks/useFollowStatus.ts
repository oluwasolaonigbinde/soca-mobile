import { follow as followUser, unfollow as unfollowUser } from '@/lib/follows';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function checkIsFollowing(followerId: string | undefined, followeeId: string | undefined): Promise<boolean> {
  if (!followerId || !followeeId) return Promise.resolve(false);

  return supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle()
    .then(({ data }) => !!data);
}

export function useFollowStatus(profileId: string | undefined) {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const queryClient = useQueryClient();

  const { data: isFollowing, isLoading: isQueryLoading } = useQuery({
    queryKey: ['followStatus', currentUserId, profileId],
    queryFn: () => checkIsFollowing(currentUserId, profileId),
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
      queryClient.invalidateQueries({ queryKey: ['followStatus', currentUserId, profileId] });
    },
  });

  return {
    isFollowing: isFollowing ?? false,
    isLoading: isQueryLoading || mutation.isPending,
    follow: () => mutation.mutateAsync('follow'),
    unfollow: () => mutation.mutateAsync('unfollow'),
  };
}
