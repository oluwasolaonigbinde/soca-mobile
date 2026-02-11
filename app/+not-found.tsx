import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen style={styles.container}>
        <Text variant="heading" style={styles.title}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text variant="caption" style={styles.linkText}>
            Go to home screen
          </Text>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: '#2563EB',
  },
});
