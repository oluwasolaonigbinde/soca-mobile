import { supabase } from '@/lib/supabase';
import type { Profile, ProfileWithCounts } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

async function fetchProfileWithCounts(profileId: string): Promise<ProfileWithCounts | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') throw profileError;
  if (!profile) return null;

  const [
    { count: followerCount },
    { count: followingCount },
    { count: profileViewsCount },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', profileId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId),
    supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId),
  ]);

  return {
    ...(profile as Profile),
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    profile_views_count: profileViewsCount ?? 0,
  };
}

export function useProfileById(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => fetchProfileWithCounts(profileId!),
    enabled: !!profileId,
  });
}
