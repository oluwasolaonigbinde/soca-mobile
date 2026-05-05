import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, SectionHeader, StateCard, Surface, Text, theme } from '@/components/ui';
import { useChallengeById, useChallengeLeaderboard } from '@/hooks/useChallenges';

export default function ChallengeLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    data: challenge,
    isLoading: challengeLoading,
    refetch: refetchChallenge,
    isRefetching: challengeRefetching,
  } = useChallengeById(id);
  const {
    data: leaderboard,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useChallengeLeaderboard(id);

  if (!id || challengeLoading || isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={challengeRefetching || isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => {
              refetchChallenge();
              refetch();
            }}
          />
        }
      >
        <SectionHeader
          eyebrow="LEADERBOARD"
          title={challenge?.title || 'Challenge'}
          subtitle="Top entries by score."
        />

        <View style={styles.actions}>
          <Button
            title="Challenge Details"
            variant="outline"
            onPress={() => router.push(`/challenges/${id}`)}
            style={styles.actionButton}
          />
          <Button
            title="Submit Video"
            onPress={() => router.push(`/challenges/${id}/submit`)}
            style={styles.actionButton}
          />
        </View>

        {error ? (
          <StateCard
            title="Unable to load leaderboard"
            description="Check that challenge_submissions, video_likes, and video_views exist."
            tone="danger"
          />
        ) : null}

        {!error && leaderboard?.length ? (
          <View style={styles.list}>
            {leaderboard.map((entry) => (
              <Surface key={entry.id} elevated style={styles.card}>
                <View style={styles.cardTop}>
                  <Text variant="subheading">#{entry.rank}</Text>
                  <Text variant="subheading">{entry.total_score} pts</Text>
                </View>
                <Text variant="body">{entry.player_name}</Text>
                <Text variant="caption" style={styles.muted}>
                  {entry.video_caption || 'Highlight'}
                </Text>
                <View style={styles.scoreRow}>
                  <Text variant="caption" style={styles.muted}>
                    Likes: {entry.like_count}
                  </Text>
                  <Text variant="caption" style={styles.muted}>
                    Views: {entry.view_count}
                  </Text>
                </View>
                <Text variant="caption" style={styles.muted}>
                  Community score: {entry.total_score}
                </Text>
              </Surface>
            ))}
          </View>
        ) : null}

        {!error && !leaderboard?.length ? (
          <StateCard
            title="No submissions yet"
            description="The leaderboard will populate after the first player submits a highlight."
            tone="tint"
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  scroll: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  muted: {
    color: theme.colors.textMuted,
  },
});
