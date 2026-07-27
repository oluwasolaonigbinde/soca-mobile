import { AuthGate } from '@/components/auth/AuthGate';
import { UnifiedExploreScreen } from '@/components/explore/UnifiedExploreScreen';

export default function ExploreScreen() {
  return (
    <AuthGate>
      <UnifiedExploreScreen entrypoint="explore" />
    </AuthGate>
  );
}
