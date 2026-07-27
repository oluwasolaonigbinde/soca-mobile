import { AuthGate } from '@/components/auth/AuthGate';
import { HomeScreen } from '@/components/home/HomeScreen';
import { useAuthStore } from '@/store/auth';

export default function FeedScreen() {
  const role = useAuthStore((state) => state.profile?.role);

  return (
    <AuthGate>
      {role ? <HomeScreen role={role} /> : null}
    </AuthGate>
  );
}
