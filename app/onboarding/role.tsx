import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// ---------------------------------------------------------------------------
// Role options
// ---------------------------------------------------------------------------

const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'player',
    label: 'Player',
    description: 'Showcase your skills and get discovered',
  },
  {
    value: 'scout',
    label: 'Scout',
    description: 'Discover and recruit talented players',
  },
  {
    value: 'club',
    label: 'Club',
    description: 'Manage your club and find players',
  },
  {
    value: 'org',
    label: 'Organization',
    description: 'Federations, leagues, media brands, governing bodies',
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RoleSelectionScreen() {
  const router = useRouter();
  const updateRole = useAuthStore((s) => s.updateRole);
  const loading = useAuthStore((s) => s.loading);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    if (!selected) return;
    setError(null);
    try {
      await updateRole(selected);
      router.replace('/onboarding/profile-setup' as Parameters<typeof router.replace>[0]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <Screen style={styles.container}>
      <Text variant="heading" style={styles.title}>
        Choose Your Role
      </Text>
      <Text variant="body" style={styles.subtitle}>
        This cannot be changed later.
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text variant="caption" style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      <View style={styles.roles}>
        {ROLES.map((role) => {
          const active = selected === role.value;
          return (
            <Pressable
              key={role.value}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(role.value)}
            >
              <Text
                variant="subheading"
                style={[styles.cardLabel, active && styles.cardLabelActive]}
              >
                {role.label}
              </Text>
              <Text variant="caption" style={styles.cardDesc}>
                {role.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={loading ? 'Saving\u2026' : 'Continue'}
        onPress={onConfirm}
        disabled={!selected || loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
  },
  roles: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
  },
  cardActive: {
    borderColor: '#111',
    backgroundColor: '#F9FAFB',
  },
  cardLabel: {
    marginBottom: 2,
  },
  cardLabelActive: {
    color: '#111',
  },
  cardDesc: {
    color: '#666',
  },
});
