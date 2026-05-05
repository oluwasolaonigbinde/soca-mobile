import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

export async function getCurrentUserProfileOrThrow(): Promise<Profile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Profile not found.');

  return data as Profile;
}

export async function requireCurrentUserRole(
  role: UserRole,
  action: string,
): Promise<Profile> {
  const profile = await getCurrentUserProfileOrThrow();

  if (profile.role !== role) {
    throw new Error(`Only ${role} accounts can ${action}.`);
  }

  return profile;
}
