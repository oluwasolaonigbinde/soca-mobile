import { isPostLiked, likePost, unlikePost } from '@/lib/posts';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePostLikeStatus(postId: string | undefined, initialLiked = false) {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const queryClient = useQueryClient();

  const { data: liked, isLoading: isQueryLoading } = useQuery({
    queryKey: ['post-like-status', currentUserId, postId],
    queryFn: () => isPostLiked(postId!, currentUserId),
    enabled: !!postId && !!currentUserId,
    initialData: initialLiked,
  });

  const mutation = useMutation({
    mutationFn: async (action: 'like' | 'unlike') => {
      if (!postId) throw new Error('No post selected');
      if (action === 'like') {
        await likePost(postId);
      } else {
        await unlikePost(postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-like-status', currentUserId, postId] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });

  return {
    isLiked: liked ?? false,
    isLoading: isQueryLoading || mutation.isPending,
    like: () => mutation.mutateAsync('like'),
    unlike: () => mutation.mutateAsync('unlike'),
  };
}
