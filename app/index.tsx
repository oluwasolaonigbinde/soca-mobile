import { isProfileComplete } from '@/lib/profile';
import { getRoleHome } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import type { Href } from 'expo-router';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Sole redirect authority. Implements Entry Routing Rule and state machine.
 * No redirect logic in _layout.tsx.
 */
export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const profileStatus = useAuthStore((s) => s.profileStatus);
  const authLoaded = useAuthStore((s) => s.authLoaded);

  if (!authLoaded || profileStatus === 'loading' || profileStatus === 'missing') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00FF88" />
      </View>
    );
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#090C0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
