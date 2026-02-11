import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';
import { Redirect } from 'expo-router';

function getRoleHome(role: UserRole) {
  const map = {
    player: '/(player)/home',
    scout: '/(scout)/home',
    club: '/(club)/home',
  } as const;
  return map[role];
}

/**
 * Entry-point router — sends the user to the correct initial screen
 * based on auth / profile state. The centralized guard in _layout.tsx
 * handles all subsequent navigation protection.
 */
export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  if (!session) return <Redirect href="/welcome" />;
  if (!profile?.role) return <Redirect href="/onboarding/role" />;
  return <Redirect href={getRoleHome(profile.role)} />;
}
