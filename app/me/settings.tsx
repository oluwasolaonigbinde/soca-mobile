import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Button, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import { deleteCurrentAccount } from '@/lib/account';
import { showMessage } from '@/lib/showMessage';
import { useAuthStore } from '@/store/auth';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const ACCOUNT_DELETION_URL = process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL;

function openExternalUrl(url: string | undefined, label: string) {
  if (!url) {
    showMessage(`${label} unavailable`, 'Add this public URL before submitting the app to the stores.');
    return;
  }

  void Linking.openURL(url);
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDeletion = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteCurrentAccount();
      router.replace('/welcome');
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete account.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeletion = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete your SOCA account and public content? This cannot be undone.')) {
        void performDeletion();
      }
      return;
    }

    Alert.alert(
      'Delete account?',
      'This permanently removes your SOCA account, profile, posts, uploaded media, messages, and reports where the database can associate them with you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void performDeletion() },
      ],
    );
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <Screen style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface elevated style={styles.card}>
          <Text variant="overline" style={styles.kicker}>
            ACCOUNT
          </Text>
          <Text variant="heading">Settings</Text>
          <Text variant="body" style={styles.copy}>
            Manage your account and store-required legal links.
          </Text>

          {error ? <StateCard title={error} tone="danger" /> : null}

          <View style={styles.actions}>
            <Button title="Privacy Policy" variant="outline" onPress={() => openExternalUrl(PRIVACY_POLICY_URL, 'Privacy policy')} />
            <Button title="Terms of Use" variant="outline" onPress={() => openExternalUrl(TERMS_URL, 'Terms of use')} />
            <Button
              title="Account Deletion Help"
              variant="outline"
              onPress={() => openExternalUrl(ACCOUNT_DELETION_URL, 'Account deletion help')}
            />
            <Button title="Log Out" variant="soft" onPress={handleSignOut} disabled={deleting} />
          </View>
        </Surface>

        <Surface elevated style={styles.dangerCard}>
          <Text variant="subheading" style={styles.dangerTitle}>
            Delete account
          </Text>
          <Text variant="body" style={styles.copy}>
            Account deletion is permanent. Your profile and user-owned records are removed by the SOCA deletion function before your login is deleted.
          </Text>
          <Button
            title={deleting ? 'Deleting...' : 'Delete Account'}
            variant="outline"
            onPress={confirmDeletion}
            disabled={deleting}
            textStyle={styles.deleteButtonText}
          />
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
  },
  copy: {
    color: theme.colors.textMuted,
  },
  actions: {
    gap: theme.spacing.md,
  },
  dangerCard: {
    gap: theme.spacing.md,
    borderColor: theme.colors.danger,
  },
  dangerTitle: {
    color: theme.colors.danger,
  },
  deleteButtonText: {
    color: theme.colors.danger,
  },
});
