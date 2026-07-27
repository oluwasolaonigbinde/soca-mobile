import { AuthGate } from '@/components/auth/AuthGate';
import { UnifiedExploreScreen } from '@/components/explore/UnifiedExploreScreen';

export default function DiscoverScreen() {
  return (
    <AuthGate>
      <UnifiedExploreScreen entrypoint="discover" />
    </AuthGate>
  );
}
