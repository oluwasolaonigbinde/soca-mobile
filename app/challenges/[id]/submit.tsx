import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { RoleGate } from '@/components/auth/RoleGate';
import { Button, Screen, SectionHeader, StateCard, Surface, Text, theme } from '@/components/ui';
import {
  useChallengeById,
  useChallengeVideos,
  useCurrentUserChallengeSubmission,
} from '@/hooks/useChallenges';
import { submitChallengeVideo } from '@/lib/challenges';
import { queryClient } from '@/lib/query';

export default function ChallengeSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: challenge, isLoading: challengeLoading, isRefetching, refetch } = useChallengeById(id);
  const { data: videos, isLoading: videosLoading } = useChallengeVideos();
  const { data: existingSubmission } = useCurrentUserChallengeSubmission(id);

  const onSubmit = async () => {
    if (!id || !selectedVideoId) {
      setErrorMessage('Choose one of your highlight videos first.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await submitChallengeVideo(id, selectedVideoId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenges', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['challenges', 'leaderboard', id] }),
        queryClient.invalidateQueries({ queryKey: ['challenges', 'submission', id] }),
      ]);
      router.replace(`/challenges/${id}/leaderboard`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit this video.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id || challengeLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  if (!challenge) {
    return (
      <Screen style={styles.centered}>
        <StateCard title="Challenge not found" tone="danger" />
      </Screen>
    );
  }

  return (
    <RoleGate allowedRoles={['player']}>
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
          <SectionHeader
            eyebrow="SUBMIT VIDEO"
            title={challenge.title}
            subtitle="Choose a video from your highlights."
          />

          {existingSubmission ? (
            <StateCard
              title="Existing submission found"
              description="Selecting a new video replaces your current entry in the public leaderboard."
              tone="tint"
            />
          ) : null}

          {!challenge.is_open ? (
            <StateCard
              title="Submissions closed"
              description="This challenge is not currently open for new entries."
              tone="warning"
            />
          ) : null}

          <SectionHeader
            eyebrow="YOUR HIGHLIGHTS"
            title="Choose a highlight"
            subtitle="Select from your uploaded videos."
          />

          {videosLoading ? (
            <View style={styles.centeredInline}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}

          {!videosLoading && videos?.length ? (
            <View style={styles.videoList}>
              {videos.map((video) => {
                const isSelected = selectedVideoId === video.id;

                return (
                  <Pressable
                    key={video.id}
                    onPress={() => setSelectedVideoId(video.id)}
                  >
                    <Surface
                      elevated
                      tone={isSelected ? 'tint' : 'default'}
                      style={styles.videoCard}
                    >
                      <Text variant="title">{video.caption || 'Highlight'}</Text>
                      <Text variant="caption" style={styles.muted}>
                        {video.like_count} likes | {video.view_count} views
                      </Text>
                      <Text variant="caption" style={styles.muted}>
                        Uploaded {new Date(video.created_at).toLocaleDateString()}
                      </Text>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {!videosLoading && !videos?.length ? (
            <StateCard
              title="No uploaded videos yet"
              description="Upload a highlight first, then return to this submission screen."
              tone="tint"
              actionLabel="Upload Video"
              onActionPress={() => router.push('/upload/video')}
            />
          ) : null}

          {errorMessage ? (
            <StateCard title={errorMessage} tone="danger" />
          ) : null}

          <Button
            title={
              submitting
                ? 'Submitting...'
                : existingSubmission
                  ? 'Replace Submission'
                  : 'Submit to Challenge'
            }
            onPress={onSubmit}
            disabled={!challenge.is_open || !videos?.length || submitting}
          />

          <Button
            title="View Leaderboard"
            variant="outline"
            onPress={() => router.push(`/challenges/${id}/leaderboard`)}
          />
        </ScrollView>
      </Screen>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  centeredInline: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  scroll: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  videoList: {
    gap: theme.spacing.md,
  },
  videoCard: {
    gap: theme.spacing.sm,
  },
});
