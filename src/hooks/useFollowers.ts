import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

async function fetchFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', userId);

  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map((r) => r.follower_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (profilesError) throw profilesError;
  return (profiles as Profile[]) ?? [];
}

export function useFollowers(userId: string | undefined) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => fetchFollowers(userId!),
    enabled: !!userId,
  });
}
