import { RoleGate } from '@/components/auth/RoleGate';
import { Stack } from 'expo-router';

export default function OrgLayout() {
  return (
    <RoleGate allowedRoles={['org']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
