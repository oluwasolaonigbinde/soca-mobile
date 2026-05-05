import { Stack } from 'expo-router';

import { ProfileScreenContent } from '@/components/profile/ProfileScreenContent';
import { useAuthStore } from '@/store/auth';

export default function MyProfileScreen() {
  const currentUserId = useAuthStore((state) => state.session?.user?.id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreenContent profileId={currentUserId} mode="tab" />
    </>
  );
}
