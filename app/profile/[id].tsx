import { useLocalSearchParams } from 'expo-router';

import { ProfileScreenContent } from '@/components/profile/ProfileScreenContent';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ProfileScreenContent profileId={id} mode="public" />;
}
