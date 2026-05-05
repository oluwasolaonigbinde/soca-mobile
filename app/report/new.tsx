import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Input, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import { createReport } from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import type { ReportContentType } from '@/types/database';

function isSupportedContentType(value: string | undefined): value is ReportContentType {
  return value === 'profile' || value === 'video';
}

export default function ReportContentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { contentId, contentType, label } = useLocalSearchParams<{
    contentId?: string;
    contentType?: string;
    label?: string;
  }>();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!contentId || !isSupportedContentType(contentType)) {
      showMessage('Report failed', 'This report target is invalid.');
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        content_id: contentId,
        content_type: contentType,
        reason,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      showMessage('Report submitted', 'An admin can now review this content.');
      router.back();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to submit report.';
      showMessage('Report failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!contentId || !isSupportedContentType(contentType)) {
    return (
      <Screen style={styles.centered}>
        <StateCard
          title="Invalid report target"
          tone="danger"
          actionLabel="Go back"
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface elevated style={styles.card}>
          <Text variant="overline" style={styles.kicker}>
            MODERATION
          </Text>
          <Text variant="heading">
            Report {contentType === 'profile' ? 'Profile' : 'Video'}
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Describe the issue for review.
          </Text>

          <View style={styles.panel}>
            <Text variant="caption" style={styles.label}>
              Target
            </Text>
            <Text variant="body">{label || contentId}</Text>
          </View>

          <View style={styles.panel}>
            <Text variant="caption" style={styles.label}>
              Reason
            </Text>
            <Input
              placeholder="Explain what should be reviewed"
              multiline
              value={reason}
              onChangeText={setReason}
              style={styles.multilineInput}
            />
          </View>

          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={() => router.back()} style={styles.actionButton} />
            <Button
              title={submitting ? 'Submitting...' : 'Submit Report'}
              onPress={onSubmit}
              disabled={submitting}
              style={styles.actionButton}
            />
          </View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: theme.spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  card: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  panel: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.primary,
  },
  multilineInput: {
    minHeight: 140,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
