import { AuthGate } from '@/components/auth/AuthGate';
import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
