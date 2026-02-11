import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleHome(role: UserRole) {
  const map = {
    player: '/(player)/home',
    scout: '/(scout)/home',
    club: '/(club)/home',
  } as const;
  return map[role];
}

// ---------------------------------------------------------------------------
// Centralized route guard
// ---------------------------------------------------------------------------

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (!initialized || loading) return;

    const first = segments[0] as string | undefined;

    const isPublic =
      !first ||
      first === 'welcome' ||
      first === 'auth' ||
      first === '+not-found' ||
      first === '_sitemap';

    const isOnboarding = first === 'onboarding';

    if (!session) {
      // Unauthenticated — only public routes allowed
      if (!isPublic) {
        router.replace('/welcome');
      }
    } else {
      // Authenticated
      if (isPublic) {
        // Redirect away from public screens
        if (!profile?.role) {
          router.replace('/onboarding/role');
        } else {
          router.replace(getRoleHome(profile.role));
        }
      } else if (isOnboarding && profile?.role) {
        // Already has a role — go to home
        router.replace(getRoleHome(profile.role));
      }
    }
  }, [session, profile, initialized, loading, segments, router]);
}

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialized]);

  // Guard must be called unconditionally (React hook rules)
  useProtectedRoute();

  if (!fontsLoaded || !initialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
