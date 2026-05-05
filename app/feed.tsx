import { Redirect } from 'expo-router';

import { HomeScreen } from '@/components/home/HomeScreen';
import { useAuthStore } from '@/store/auth';

export default function FeedScreen() {
  const session = useAuthStore((state) => state.session);
  const profileStatus = useAuthStore((state) => state.profileStatus);
  const role = useAuthStore((state) => state.profile?.role);

  if (!session && profileStatus === 'ready') {
    return <Redirect href="/welcome" />;
  }

  // Don't guess a role: route to onboarding when missing instead of defaulting
  // to 'player', which would render the player home (with player-only CTAs)
  // for scout/club/org users.
  if (!role) {
    return <Redirect href="/onboarding/role" />;
  }

  return <HomeScreen role={role} />;
}
