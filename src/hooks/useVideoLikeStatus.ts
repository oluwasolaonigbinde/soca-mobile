import { isVideoLiked, likeVideo, unlikeVideo } from '@/lib/videos';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useVideoLikeStatus(videoId: string | undefined) {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const queryClient = useQueryClient();

  const { data: liked, isLoading: isQueryLoading } = useQuery({
    queryKey: ['video-like-status', currentUserId, videoId],
    queryFn: () => isVideoLiked(videoId!, currentUserId),
    enabled: !!videoId && !!currentUserId,
  });

  const mutation = useMutation({
    mutationFn: async (action: 'like' | 'unlike') => {
      if (!videoId) throw new Error('No video selected');
      if (action === 'like') {
        await likeVideo(videoId);
      } else {
        await unlikeVideo(videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['video-like-status', currentUserId, videoId] });
    },
  });

  return {
    isLiked: liked ?? false,
    isLoading: isQueryLoading || mutation.isPending,
    like: () => mutation.mutateAsync('like'),
    unlike: () => mutation.mutateAsync('unlike'),
  };
}
