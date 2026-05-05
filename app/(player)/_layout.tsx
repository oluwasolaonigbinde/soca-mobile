import { RoleGate } from '@/components/auth/RoleGate';
import { Stack } from 'expo-router';

export default function PlayerLayout() {
  return (
    <RoleGate allowedRoles={['player']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
