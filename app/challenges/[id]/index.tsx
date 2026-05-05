import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Avatar,
  Button,
  Screen,
  SectionHeader,
  StateCard,
  Surface,
  Text,
  alpha,
  theme,
} from '@/components/ui';
import {
  useChallengeById,
  useChallengeLeaderboard,
  useCurrentUserChallengeSubmission,
} from '@/hooks/useChallenges';
import { useAuthStore } from '@/store/auth';

function formatDate(iso: string | null) {
  if (!iso) return 'Date TBD';

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const {
    data: challenge,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useChallengeById(id);
  const { data: leaderboard } = useChallengeLeaderboard(id);
  const { data: submission } = useCurrentUserChallengeSubmission(id);

  if (!id || isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  if (error || !challenge) {
    return (
      <Screen style={styles.centered}>
        <StateCard title="Challenge not found" tone="danger" />
      </Screen>
    );
  }

  const isPlayer = profile?.role === 'player';
  const leaderboardPreview = leaderboard?.slice(0, 3) ?? [];
  const totalEntries = challenge.submission_count ?? leaderboard?.length ?? 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => refetch()}
          />
        }
      >
        <SectionHeader title={challenge.title} subtitle={challenge.description || 'Challenge details.'} />

        <Surface elevated style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            {challenge.month_label ? (
              <Text variant="overline" style={styles.summaryKicker}>
                {challenge.month_label}
              </Text>
            ) : (
              <View />
            )}
            <View
              style={[
                styles.statusPill,
                challenge.is_open ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              <Text
                variant="caption"
                style={challenge.is_open ? styles.statusOpenText : styles.statusClosedText}
              >
                {challenge.is_open ? 'Open for submissions' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={styles.windowRow}>
            <View style={styles.windowItem}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={18}
                color={theme.colors.textMuted}
              />
              <View style={styles.windowCopy}>
                <Text variant="caption" style={styles.metaLabel}>
                  Submission window
                </Text>
                <Text variant="body" style={styles.metaValue}>
                  {formatDate(challenge.starts_at)} - {formatDate(challenge.ends_at)}
                </Text>
              </View>
            </View>

            <View style={styles.windowItem}>
              <MaterialCommunityIcons
                name="play-box-multiple-outline"
                size={18}
                color={theme.colors.textMuted}
              />
              <View style={styles.windowCopy}>
                <Text variant="caption" style={styles.metaLabel}>
                  Entries
                </Text>
                <Text variant="body" style={styles.metaValue}>
                  {totalEntries}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={submission ? 'Update Submission' : 'Submit Video'}
              size="small"
              onPress={() => router.push(`/challenges/${id}/submit`)}
              style={styles.actionButton}
              disabled={!isPlayer}
            />
            <Button
              title="Leaderboard"
              variant="outline"
              size="small"
              onPress={() => router.push(`/challenges/${id}/leaderboard`)}
              style={styles.actionButton}
            />
          </View>

          {!isPlayer ? (
            <Text variant="caption" style={styles.helperText}>
              Only player accounts can submit videos. Other roles can still follow the leaderboard.
            </Text>
          ) : null}

          {submission ? (
            <Text variant="caption" style={styles.helperText}>
              Your current submission is live. Submitting again replaces it.
            </Text>
          ) : null}
        </Surface>

        <Surface elevated style={styles.leaderboardCard}>
          <SectionHeader
            title="Leaderboard Preview"
            subtitle="Top entries ranked by current community score."
            actionLabel="Full board"
            onActionPress={() => router.push(`/challenges/${id}/leaderboard`)}
          />

          {leaderboardPreview.length ? (
            leaderboardPreview.map((entry) => (
              <View key={entry.id} style={styles.rankRow}>
                <View style={styles.rankBadge}>
                  <Text variant="caption" style={styles.rankBadgeText}>
                    #{entry.rank}
                  </Text>
                </View>
                <Avatar
                  uri={entry.player_avatar_url}
                  name={entry.player_name}
                  size={42}
                />
                <View style={styles.rankCopy}>
                  <Text variant="title">{entry.player_name}</Text>
                  <Text variant="caption" style={styles.rankCaption}>
                    {entry.video_caption || 'Highlight'}
                  </Text>
                </View>
                <View style={styles.scorePill}>
                  <Text variant="caption" style={styles.scoreText}>
                    {entry.total_score} pts
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text variant="caption" style={styles.rankCaption}>
              No submissions yet.
            </Text>
          )}
        </Surface>
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
  summaryCard: {
    gap: theme.spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  summaryKicker: {
    color: theme.colors.textSoft,
  },
  statusPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderWidth: theme.border.regular,
  },
  statusOpen: {
    backgroundColor: theme.colors.successSoft,
    borderColor: alpha(theme.colors.success, 0.28),
  },
  statusClosed: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
  },
  statusOpenText: {
    color: theme.colors.success,
  },
  statusClosedText: {
    color: theme.colors.textMuted,
  },
  windowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  windowItem: {
    minWidth: 180,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceDark,
  },
  windowCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    color: theme.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    color: theme.colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  helperText: {
    color: theme.colors.textMuted,
  },
  leaderboardCard: {
    gap: theme.spacing.md,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rankBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceDark,
  },
  rankBadgeText: {
    color: theme.colors.textPrimary,
  },
  rankCopy: {
    flex: 1,
    gap: 2,
  },
  rankCaption: {
    color: theme.colors.textMuted,
  },
  scorePill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceTint,
  },
  scoreText: {
    color: theme.colors.accent,
  },
});
