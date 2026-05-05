import { useVerificationProfiles } from '@/hooks/useAdmin';
import {
  getProfileDisplayName,
  getVerificationBadgeCopy,
  getVerificationStatusLabel,
  setProfileVerification,
} from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import type { Profile } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

function VerificationCard({
  profile,
  onToggle,
  onOpenProfile,
}: {
  profile: Profile;
  onToggle: () => void;
  onOpenProfile: () => void;
}) {
  const badgeCopy = getVerificationBadgeCopy(profile);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text variant="subheading">{getProfileDisplayName(profile)}</Text>
        <Text variant="caption" style={profile.verified ? styles.verifiedBadge : styles.unverifiedBadge}>
          {getVerificationStatusLabel(profile)}
        </Text>
      </View>
      <Text variant="caption" style={styles.muted}>
        {[profile.role || 'role pending', profile.location || 'location pending'].join(' | ')}
      </Text>
      {badgeCopy ? (
        <Text variant="caption" style={styles.muted}>
          {badgeCopy}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          title={profile.verified ? 'Revoke Badge' : 'Verify Profile'}
          onPress={onToggle}
          variant={profile.verified ? 'outline' : 'solid'}
          style={styles.actionButton}
        />
        <Button title="Open Profile" variant="outline" onPress={onOpenProfile} style={styles.actionButton} />
      </View>
    </View>
  );
}

export default function AdminVerificationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch, error } = useVerificationProfiles();

  const onToggle = async (profile: Profile) => {
    try {
      await setProfileVerification(profile.id, !profile.verified);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['discover'] }),
      ]);
    } catch (toggleError) {
      const message =
        toggleError instanceof Error ? toggleError.message : 'Unable to update verification.';
      showMessage('Verification failed', message);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Verification</Text>
          <Text variant="body" style={styles.muted}>
            Apply or remove public verification badges on profiles from this admin-only screen.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load profiles</Text>
            <Text variant="caption" style={styles.errorText}>
              Confirm the verified columns and admin profile policy exist, then refresh.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((profile) => (
                <VerificationCard
                  key={profile.id}
                  profile={profile}
                  onToggle={() => onToggle(profile)}
                  onOpenProfile={() => router.push(`/profile/${profile.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="subheading">No profiles loaded</Text>
              <Text variant="caption" style={styles.muted}>
                Public profiles will appear here after users finish onboarding.
              </Text>
            </View>
          )
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    gap: 18,
  },
  header: {
    gap: 8,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  list: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2A24',
    backgroundColor: '#111613',
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  verifiedBadge: {
    color: '#047857',
  },
  unverifiedBadge: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    borderRadius: 18,
    backgroundColor: '#111613',
    padding: 18,
    gap: 8,
  },
  errorBox: {
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    padding: 18,
    gap: 6,
  },
  errorText: {
    color: '#B91C1C',
  },
});
