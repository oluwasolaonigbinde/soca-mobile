import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth/AuthGate';

export default function MeLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: true }} />
    </AuthGate>
  );
}
