import { AuthGate } from '@/components/auth/AuthGate';
import { Stack } from 'expo-router';

export default function UploadLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
