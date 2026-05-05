import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button, Screen, Surface, Text, theme } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen style={styles.screen}>
        <Surface elevated style={styles.card}>
          <Text variant="overline" style={styles.kicker}>
            NOT FOUND
          </Text>
          <Text variant="heading">This screen doesn&apos;t exist.</Text>
          <Link href="/" asChild>
            <Button title="Go to home screen" />
          </Link>
        </Surface>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
  },
});
