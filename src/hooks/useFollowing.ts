import {
  DEMO_MODE_ENABLED,
  listDemoFollowing,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';

async function fetchFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', userId);

  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map((r) => r.followee_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (profilesError) throw profilesError;
  return (profiles as Profile[]) ?? [];
}

export function useFollowing(userId: string | undefined) {
  const currentUserId = useAuthStore((state) => state.session?.user?.id);
  const currentProfile = useAuthStore((state) => state.profile);

  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (DEMO_MODE_ENABLED && userId) {
        return listDemoFollowing(userId, currentUserId, currentProfile);
      }

      return fetchFollowing(userId!);
    },
    enabled: !!userId,
  });
}
