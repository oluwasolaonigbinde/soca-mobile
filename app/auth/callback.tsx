import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

/**
 * Auth callback route for web email confirmation links.
 * Supabase redirects here with access_token and refresh_token in the hash.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') {
        console.log('[auth/callback] Not web, redirecting to /');
        router.replace('/');
        return;
      }

      const hash = window.location.hash?.slice(1);
      const search = window.location.search?.slice(1);

      console.log('[auth/callback] hash present:', !!hash, 'search present:', !!search);

      const parseParams = (str: string) => {
        const params = new URLSearchParams(str);
        return {
          access_token: params.get('access_token'),
          refresh_token: params.get('refresh_token'),
        };
      };

      const fromHash = hash ? parseParams(hash) : { access_token: null, refresh_token: null };
      const fromSearch = search ? parseParams(search) : { access_token: null, refresh_token: null };

      const access_token = fromHash.access_token ?? fromSearch.access_token;
      const refresh_token = fromHash.refresh_token ?? fromSearch.refresh_token;

      if (!access_token || !refresh_token) {
        console.log('[auth/callback] No tokens found, redirecting to /');
        router.replace('/');
        return;
      }

      try {
        console.log('[auth/callback] Setting session');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;

        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        const { data } = await supabase.auth.getSession();
        useAuthStore.setState({ session: data.session });
        await fetchProfile();

        console.log('[auth/callback] Session set, redirecting to /');
        router.replace('/');
      } catch (e) {
        console.error('[auth/callback] Error:', e);
        setError(e instanceof Error ? e.message : 'Sign-in failed');
      }
    };

    run();
  }, [router, fetchProfile]);

  if (error) {
    return (
      <Screen style={styles.container}>
        <Text variant="heading" style={styles.title}>
          Sign-in failed
        </Text>
        <Text variant="body" style={styles.error}>
          {error}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#111" />
        <Text variant="body" style={styles.message}>
          Completing sign-in…
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    color: '#666',
  },
  error: {
    color: '#DC2626',
    textAlign: 'center',
  },
});
