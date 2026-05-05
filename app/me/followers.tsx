import { UserListScreen } from '@/components/UserListScreen';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuthStore } from '@/store/auth';

export default function FollowersScreen() {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const { data, isLoading, error } = useFollowers(currentUserId);

  return (
    <UserListScreen
      data={data}
      isLoading={isLoading}
      error={error}
      errorLabel="Unable to load followers right now."
      errorDescription="Please try again in a moment."
      errorIcon="account-multiple-outline"
      emptyLabel="No followers yet."
      emptyDescription="Share your profile and highlights to start building your audience."
      emptyIcon="account-plus-outline"
    />
  );
}
