import { isProfileComplete } from '@/lib/profile';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';
import type { Href } from 'expo-router';
import { Redirect } from 'expo-router';

function getRoleHome(role: UserRole) {
  const map = {
    player: '/(player)/home',
    scout: '/(scout)/home',
    club: '/(club)/home',
    org: '/(org)/home',
  } as const;
  return map[role];
}

/**
 * Sole redirect authority. Implements Entry Routing Rule and state machine.
 * No redirect logic in _layout.tsx.
 */
export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const profileStatus = useAuthStore((s) => s.profileStatus);
  const authLoaded = useAuthStore((s) => s.authLoaded);

  if (!authLoaded) {
    return null;
  }

  if (profileStatus === 'loading' || profileStatus === 'missing') {
    return null;
  }

  if (profileStatus === 'error') {
    return <Redirect href={"/profile-error" as Href} />;
  }

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  if (!profile?.role) {
    return <Redirect href="/onboarding/role" />;
  }

  if (!isProfileComplete(profile)) {
    return <Redirect href={"/onboarding/profile-setup" as Href} />;
  }

  return <Redirect href={getRoleHome(profile.role) as Href} />;
}
