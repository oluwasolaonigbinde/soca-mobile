import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => fetchFollowing(userId!),
    enabled: !!userId,
  });
}
