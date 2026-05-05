import { AdminGate } from '@/components/auth/AdminGate';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <AdminGate>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#090C0A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
          contentStyle: { backgroundColor: '#090C0A' },
        }}
      />
    </AdminGate>
  );
}
