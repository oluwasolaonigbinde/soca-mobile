import { isSessionAdmin } from '@/lib/admin';
import { isProfileComplete } from '@/lib/profile';
import { getRoleHome } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import type { Href } from 'expo-router';
import { Redirect } from 'expo-router';
import type { PropsWithChildren } from 'react';

export function AdminGate({ children }: PropsWithChildren) {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const profileStatus = useAuthStore((state) => state.profileStatus);
  const authLoaded = useAuthStore((state) => state.authLoaded);

  if (!authLoaded || profileStatus === 'loading' || profileStatus === 'missing') {
    return null;
  }

  if (profileStatus === 'error') {
    return <Redirect href={'/profile-error' as Href} />;
  }

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  if (!profile?.role) {
    return <Redirect href="/onboarding/role" />;
  }

  if (!isProfileComplete(profile)) {
    return <Redirect href={'/onboarding/profile-setup' as Href} />;
  }

  if (!isSessionAdmin(session)) {
    return <Redirect href={getRoleHome(profile.role)} />;
  }

  return <>{children}</>;
}
