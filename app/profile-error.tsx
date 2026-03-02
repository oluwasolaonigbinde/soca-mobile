import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
    <Screen style={styles.container}>
      <Text variant="heading" style={styles.title}>
        Profile Setup Failed
      </Text>
      <Text variant="body" style={styles.subtitle}>
        We couldn&apos;t create your profile. Please check your connection and
        try again.
      </Text>

      <View style={styles.actions}>
        <Button
          title={loading ? 'Retrying\u2026' : 'Retry'}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    color: '#666',
    marginBottom: 32,
  },
  actions: {
    gap: 12,
  },
});
