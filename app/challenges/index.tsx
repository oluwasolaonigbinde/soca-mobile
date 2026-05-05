import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppHeader,
  AppShell,
  SectionHeader,
  StateCard,
  theme,
} from '@/components/ui';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { useChallenges } from '@/hooks/useChallenges';

export default function ChallengesScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useChallenges();
  const openChallenges = data?.filter((challenge) => challenge.is_open) ?? [];
  const closedChallenges = data?.filter((challenge) => !challenge.is_open) ?? [];

  return (
    <AppShell
      header={
        <AppHeader
          title="Challenges"
          subtitle="Monthly football competitions built around clips, community, and leaderboard momentum."
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.accent}
            onRefresh={() => refetch()}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : null}

        {error ? (
          <StateCard
            title="Unable to load challenges"
            description="Something went wrong. Pull to refresh."
            tone="danger"
            icon="alert-circle-outline"
          />
        ) : null}

        {!isLoading && !error && !data?.length ? (
          <StateCard
            title="No challenges yet"
            description="New competitions will appear here when they go live."
            tone="tint"
            icon="trophy-outline"
          />
        ) : null}

        {!isLoading && !error && openChallenges.length ? (
          <View style={styles.section}>
            <SectionHeader
              title="Open Challenges"
              subtitle="Submit clips while the window is live."
            />
            <View style={styles.list}>
              {openChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => router.push(`/challenges/${challenge.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {!isLoading && !error && !openChallenges.length && !!data?.length ? (
          <StateCard
            title="No live challenges right now"
            description="Closed challenges remain available for browsing below."
            tone="tint"
            icon="calendar-clock"
          />
        ) : null}

        {!isLoading && !error && closedChallenges.length ? (
          <View style={styles.section}>
            <SectionHeader
              title="Recently Closed"
              subtitle="Past competitions and their submission windows."
            />
            <View style={styles.list}>
              {closedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onPress={() => router.push(`/challenges/${challenge.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
  },
  centered: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
  section: {
    gap: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.md,
  },
});
