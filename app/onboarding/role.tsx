import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/database';

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
    <Screen style={styles.screen}>
      <Surface elevated style={styles.card}>
        <Text variant="overline" style={styles.kicker}>
          ROLE SELECTION
        </Text>
        <Text variant="heading">Choose your role</Text>
        <Text variant="body" style={styles.subtitle}>
          Pick your role. This cannot be changed later.
        </Text>

        {error ? <StateCard title={error} tone="danger" /> : null}

        <View style={styles.roles}>
          {ROLES.map((role) => {
            const active = selected === role.value;
            return (
              <Pressable
                key={role.value}
                onPress={() => setSelected(role.value)}
              >
                <Surface tone={active ? 'tint' : 'default'} elevated style={styles.roleCard}>
                  <Text variant="title">{role.label}</Text>
                  <Text variant="caption" style={styles.roleDescription}>
                    {role.description}
                  </Text>
                </Surface>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={loading ? 'Saving...' : 'Continue'}
          onPress={onConfirm}
          disabled={!selected || loading}
        />
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
  roles: {
    gap: theme.spacing.sm,
  },
  roleCard: {
    gap: 4,
  },
  roleDescription: {
    color: theme.colors.textMuted,
  },
});
