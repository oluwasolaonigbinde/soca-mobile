import {
  DEMO_MODE_ENABLED,
  isDemoFollowing,
  isDemoProfileId,
  setDemoFollowing,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';

export async function follow(followeeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === followeeId) throw new Error('You cannot follow yourself.');

  if (DEMO_MODE_ENABLED && isDemoProfileId(followeeId)) {
    setDemoFollowing(user.id, followeeId, true);
    return;
  }

  const { error } = await supabase.from('follows').upsert(
    {
      follower_id: user.id,
      followee_id: followeeId,
    },
    { onConflict: 'follower_id,followee_id' },
  );

  if (error) throw error;
}

export async function unfollow(followeeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (DEMO_MODE_ENABLED && isDemoProfileId(followeeId)) {
    setDemoFollowing(user.id, followeeId, false);
    return;
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followee_id', followeeId);

  if (error) throw error;
}

export async function isFollowing(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (DEMO_MODE_ENABLED && isDemoProfileId(followeeId)) {
    return isDemoFollowing(followerId, followeeId);
  }

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
