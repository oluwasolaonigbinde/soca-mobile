import { supabase } from '@/lib/supabase';

export async function follow(followeeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    followee_id: followeeId,
  });

  if (error) throw error;
}

export async function unfollow(followeeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
