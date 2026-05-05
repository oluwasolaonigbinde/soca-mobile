import { getVideoById } from '@/lib/videos';
import { useQuery } from '@tanstack/react-query';

export function useVideoById(videoId: string | undefined) {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => getVideoById(videoId!),
    enabled: !!videoId,
  });
}
