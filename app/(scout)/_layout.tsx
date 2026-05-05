import { RoleGate } from '@/components/auth/RoleGate';
import { Stack } from 'expo-router';

export default function ScoutLayout() {
  return (
    <RoleGate allowedRoles={['scout']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
