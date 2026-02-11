import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <Screen style={styles.container}>
      <View style={styles.hero}>
        <Text variant="heading" style={styles.title}>
          SOCA
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Your football career starts here.
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/auth/login" asChild>
          <Button title="Log In" />
        </Link>
        <Link href="/auth/signup" asChild>
          <Button title="Sign Up" variant="outline" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 40,
    letterSpacing: 4,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  actions: {
    gap: 12,
  },
});
