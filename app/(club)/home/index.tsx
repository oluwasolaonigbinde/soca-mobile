import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth';
import { StyleSheet } from 'react-native';

export default function ClubHomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);

  return (
    <Screen style={styles.container}>
      <Text variant="heading">Club Home</Text>
      <Text variant="body" style={styles.subtitle}>
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}.
      </Text>
      <Button
        title="Sign Out"
        variant="outline"
        onPress={signOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  signOut: {
    marginTop: 32,
    alignSelf: 'stretch',
  },
});
