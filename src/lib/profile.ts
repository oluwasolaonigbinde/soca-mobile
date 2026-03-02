import type { Profile } from '@/types/database';

/**
 * Profile is complete when role, display_name, and location are all non-empty.
 * Bio is optional and does NOT gate entry.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  const hasRole = !!profile.role && profile.role.trim().length > 0;
  const hasDisplayName =
    !!profile.display_name && profile.display_name.trim().length > 0;
  const hasLocation =
    !!profile.location && profile.location.trim().length > 0;
  return hasRole && hasDisplayName && hasLocation;
}
