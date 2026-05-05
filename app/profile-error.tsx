import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, Surface, Text, theme } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

export default function ProfileErrorScreen() {
  const router = useRouter();
  const retryProfileCreation = useAuthStore((s) => s.retryProfileCreation);
  const signOut = useAuthStore((s) => s.signOut);
  const loading = useAuthStore((s) => s.loading);

  const onRetry = async () => {
    await retryProfileCreation();
    router.replace('/');
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <Screen style={styles.screen}>
      <Surface elevated style={styles.card}>
        <Text variant="overline" style={styles.kicker}>
          PROFILE ERROR
        </Text>
        <Text variant="heading">Profile setup failed</Text>
        <Text variant="body" style={styles.subtitle}>
          We couldn&apos;t create your profile. Please check your connection and try again.
        </Text>

        <View style={styles.actions}>
          <Button
            title={loading ? 'Retrying...' : 'Retry'}
            onPress={onRetry}
            disabled={loading}
          />
          <Button
            title="Sign Out"
            variant="outline"
            onPress={onSignOut}
            disabled={loading}
          />
        </View>
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  card: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
