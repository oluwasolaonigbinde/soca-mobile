import {
  DEMO_MODE_ENABLED,
  getDemoProfileById,
  isDemoProfileId,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileAchievement, ProfileWithCounts } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';

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
    { data: profileViewsCount, error: viewsError },
    { data: achievements, error: achievementsError },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followee_id', profileId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId),
    // profile_views.SELECT is owner-only (avoids leaking viewer_id), so we
    // call a SECURITY DEFINER RPC that returns just the count.
    supabase.rpc('get_profile_view_count', { p_profile_id: profileId }),
    supabase
      .from('profile_achievements')
      .select('*')
      .eq('profile_id', profileId)
      .order('awarded_at', { ascending: false })
      .limit(8),
  ]);

  if (viewsError && viewsError.code !== '42883') {
    // 42883 = function does not exist (project hasn't run the migration yet).
    // Treat as zero rather than failing the whole profile fetch.
    throw viewsError;
  }

  if (achievementsError && achievementsError.code !== '42P01') {
    throw achievementsError;
  }

  const profileViewsCountNumber =
    typeof profileViewsCount === 'number'
      ? profileViewsCount
      : typeof profileViewsCount === 'string'
        ? Number(profileViewsCount) || 0
        : 0;

  return {
    ...(profile as Profile),
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    profile_views_count: profileViewsCountNumber,
    achievements: (achievements as ProfileAchievement[] | null) ?? [],
  };
}

export function useProfileById(profileId: string | undefined) {
  const currentUserId = useAuthStore((state) => state.session?.user?.id);
  const currentProfile = useAuthStore((state) => state.profile);

  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      // Demo isolation: when demo mode is on, the current user and any
      // `demo-*` id must NOT fall through to live Supabase. Returning the seed
      // (or null when missing) keeps demo screens consistent.
      if (
        DEMO_MODE_ENABLED &&
        profileId &&
        (profileId === currentUserId || isDemoProfileId(profileId))
      ) {
        return getDemoProfileById(profileId, currentUserId, currentProfile);
      }

      return fetchProfileWithCounts(profileId!);
    },
    enabled: !!profileId,
  });
}
