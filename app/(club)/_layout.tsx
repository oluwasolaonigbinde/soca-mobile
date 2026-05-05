import { RoleGate } from '@/components/auth/RoleGate';
import { Stack } from 'expo-router';

export default function ClubLayout() {
  return (
    <RoleGate allowedRoles={['club']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
