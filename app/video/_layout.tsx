import { AuthGate } from '@/components/auth/AuthGate';
import { Stack } from 'expo-router';

export default function VideoLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
