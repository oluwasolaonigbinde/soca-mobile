import { UserListScreen } from '@/components/UserListScreen';
import { useFollowing } from '@/hooks/useFollowing';
import { useAuthStore } from '@/store/auth';

export default function FollowingScreen() {
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const { data, isLoading, error } = useFollowing(currentUserId);

  return (
    <UserListScreen
      data={data}
      isLoading={isLoading}
      error={error}
      errorLabel="Unable to load following right now."
      errorDescription="Please try again in a moment."
      errorIcon="account-multiple-outline"
      emptyLabel="Not following anyone yet."
      emptyDescription="Profiles you follow will appear here for quick access."
      emptyIcon="account-search-outline"
    />
  );
}
