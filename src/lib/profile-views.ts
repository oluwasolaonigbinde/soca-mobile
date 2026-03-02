import { supabase } from '@/lib/supabase';

/**
 * Record a profile view. When authenticated, inserts with viewer_id = auth.uid().
 * No-op when not authenticated (RLS requires auth for inserts).
 */
export async function recordProfileView(profileId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('profile_views').insert({
    viewer_id: user.id,
    profile_id: profileId,
  });
}
