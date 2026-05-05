import { useAdminChallengeSubmissions, useAdminChallenges } from '@/hooks/useAdmin';
import {
  awardChallengeWinner,
  createChallenge,
  updateChallengeSubmissionScore,
  type AdminChallengeSubmissionRecord,
} from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export default function AdminChallengesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch, error } = useAdminChallenges();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | undefined>();
  const selectedChallenge = useMemo(
    () => data?.find((challenge) => challenge.id === selectedChallengeId) ?? data?.[0],
    [data, selectedChallengeId],
  );
  const {
    data: submissions,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useAdminChallengeSubmissions(selectedChallenge?.id);
  const [form, setForm] = useState({
    title: '',
    description: '',
    month: '',
    starts_at: '',
    ends_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [scoreEdits, setScoreEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedChallengeId && data?.[0]?.id) {
      setSelectedChallengeId(data[0].id);
    }
  }, [data, selectedChallengeId]);

  const onCreate = async () => {
    try {
      setSubmitting(true);
      await createChallenge(form);
      setForm({
        title: '',
        description: '',
        month: '',
        starts_at: '',
        ends_at: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['explore'] }),
      ]);
      showMessage('Challenge created', 'The challenge is now available in the public challenge list.');
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Unable to create challenge.';
      showMessage('Create failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const onScoreSubmission = async (submission: AdminChallengeSubmissionRecord) => {
    try {
      await updateChallengeSubmissionScore(
        submission.id,
        scoreEdits[submission.id] ?? String(submission.admin_score ?? ''),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'challenge-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges', 'leaderboard'] }),
      ]);
      showMessage('Score saved', 'The internal admin score was updated.');
    } catch (scoreError) {
      const message = scoreError instanceof Error ? scoreError.message : 'Unable to save score.';
      showMessage('Score failed', message);
    }
  };

  const onAwardWinner = async (submission: AdminChallengeSubmissionRecord) => {
    if (!selectedChallenge) return;

    try {
      await awardChallengeWinner({
        challenge_id: selectedChallenge.id,
        submission_id: submission.id,
        profile_id: submission.user_id,
        challenge_title: selectedChallenge.title,
        player_name: submission.player_name,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', submission.user_id] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
      ]);
      showMessage('Winner assigned', `${submission.player_name} now has a profile achievement.`);
    } catch (winnerError) {
      const message = winnerError instanceof Error ? winnerError.message : 'Unable to assign winner.';
      showMessage('Winner failed', message);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Manage Challenges</Text>
          <Text variant="body" style={styles.muted}>
            Create monthly challenge rows for players to submit against. Use ISO timestamps for start/end if needed.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text variant="subheading">Create Challenge</Text>
          <View style={styles.form}>
            <Input
              placeholder="Title"
              value={form.title}
              onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
            />
            <Input
              placeholder="Month label (optional)"
              value={form.month}
              onChangeText={(value) => setForm((current) => ({ ...current, month: value }))}
            />
            <Input
              placeholder="Start date or ISO timestamp (optional)"
              value={form.starts_at}
              onChangeText={(value) => setForm((current) => ({ ...current, starts_at: value }))}
            />
            <Input
              placeholder="End date or ISO timestamp (optional)"
              value={form.ends_at}
              onChangeText={(value) => setForm((current) => ({ ...current, ends_at: value }))}
            />
            <Input
              placeholder="Description (optional)"
              multiline
              value={form.description}
              onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
              style={styles.multilineInput}
            />
            <Button
              title={submitting ? 'Creating...' : 'Create Challenge'}
              onPress={onCreate}
              disabled={submitting}
            />
          </View>
        </View>

        <Button title="Open Public Challenges" variant="outline" onPress={() => router.push('/challenges')} />

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load challenges</Text>
            <Text variant="caption" style={styles.errorText}>
              Confirm the challenge tables exist, then refresh this screen.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((challenge) => (
                <View key={challenge.id} style={styles.card}>
                  <Text variant="subheading">{challenge.title}</Text>
                  <Text variant="caption" style={styles.accent}>
                    {[challenge.month_label, challenge.is_open ? 'Open' : 'Scheduled/Closed']
                      .filter(Boolean)
                      .join(' | ')}
                  </Text>
                  <Text variant="body" style={styles.muted}>
                    {challenge.description || 'No description added yet.'}
                  </Text>
                  <Text variant="caption" style={styles.muted}>
                    {[challenge.starts_at, challenge.ends_at].filter(Boolean).join(' to ') || 'No dates set'}
                  </Text>
                  <Button
                    title="Review Submissions"
                    variant={selectedChallenge?.id === challenge.id ? 'soft' : 'outline'}
                    size="small"
                    onPress={() => setSelectedChallengeId(challenge.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="subheading">No challenges yet</Text>
              <Text variant="caption" style={styles.muted}>
                Use the form above to seed the first admin-managed challenge.
              </Text>
            </View>
          )
        ) : null}

        {selectedChallenge ? (
          <View style={styles.panel}>
            <Text variant="subheading">Review Submissions</Text>
            <Text variant="caption" style={styles.muted}>
              {selectedChallenge.title}
            </Text>

            {submissionsLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" />
              </View>
            ) : submissions?.length ? (
              <View style={styles.list}>
                {submissions.map((submission) => (
                  <View key={submission.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text variant="subheading">#{submission.rank} {submission.player_name}</Text>
                      <Text variant="caption" style={styles.accent}>
                        {submission.total_score} community pts
                      </Text>
                    </View>
                    <Text variant="caption" style={styles.muted}>
                      {submission.video_caption || 'Highlight submission'}
                    </Text>
                    <Text variant="caption" style={styles.muted}>
                      Likes {submission.like_count} | Views {submission.view_count} | Admin score {submission.admin_score ?? 'none'}
                    </Text>
                    <Input
                      placeholder="Admin score 0-100 (optional)"
                      keyboardType="number-pad"
                      value={scoreEdits[submission.id] ?? String(submission.admin_score ?? '')}
                      onChangeText={(value) =>
                        setScoreEdits((current) => ({ ...current, [submission.id]: value }))
                      }
                    />
                    <View style={styles.actions}>
                      <Button
                        title="Save Score"
                        variant="outline"
                        size="small"
                        onPress={() => onScoreSubmission(submission)}
                        style={styles.actionButton}
                      />
                      <Button
                        title="Assign Winner"
                        size="small"
                        onPress={() => onAwardWinner(submission)}
                        style={styles.actionButton}
                      />
                    </View>
                    <Button
                      title="Open Player Profile"
                      variant="ghost"
                      size="small"
                      onPress={() => router.push(`/profile/${submission.user_id}`)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="subheading">No submissions yet</Text>
                <Text variant="caption" style={styles.muted}>
                  Player submissions will appear here when the public challenge receives entries.
                </Text>
              </View>
            )}
            <Button title="Refresh Submissions" variant="outline" onPress={() => refetchSubmissions()} />
          </View>
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
  panel: {
    borderWidth: 1,
    borderColor: '#1F2A24',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    backgroundColor: '#111613',
  },
  form: {
    gap: 12,
  },
  multilineInput: {
    height: 112,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
  accent: {
    color: '#00FF88',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
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
    gap: 12,
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
});
