import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const devEmail = process.env.EXPO_PUBLIC_DEV_SIGNIN_EMAIL;
const devPassword = process.env.EXPO_PUBLIC_DEV_SIGNIN_PASSWORD;
const hasDevCredentials = Boolean(devEmail && devPassword);

export default function WelcomeScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const [devError, setDevError] = useState<string | null>(null);

  const handleDevQuickLogin = async () => {
    if (!devEmail || !devPassword) return;
    setDevError(null);
    try {
      await signIn(devEmail, devPassword);
      router.replace('/');
    } catch (e: unknown) {
      setDevError(e instanceof Error ? e.message : 'Dev login failed');
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Surface tone="dark" elevated style={styles.hero}>
          <Text variant="overline" style={styles.kicker}>
            FOOTBALL SOCIAL
          </Text>
          <Text variant="hero" style={styles.brandTitle}>
            SOCA
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Connect, discover, and grow in the football community.
          </Text>
        </Surface>

        {devError ? <StateCard title={devError} tone="danger" /> : null}
        <View style={styles.actions}>
          {hasDevCredentials && (
            <Button
              title={loading ? 'Signing in...' : 'Dev Quick Login'}
              variant="outline"
              onPress={handleDevQuickLogin}
              disabled={loading}
            />
          )}
          <Link href="/auth/login" asChild>
            <Button title="Log In" />
          </Link>
          <Link href="/auth/signup" asChild>
            <Button title="Sign Up" variant="outline" />
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  container: {
    gap: theme.spacing.xl,
  },
  hero: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.accent,
  },
  brandTitle: {
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
