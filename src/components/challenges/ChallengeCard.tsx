import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Surface, Text, alpha, theme } from '@/components/ui';

interface ChallengeCardData {
  id: string;
  title: string;
  description: string | null;
  month_label?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_open: boolean;
  submission_count?: number;
}

export interface ChallengeCardProps {
  challenge: ChallengeCardData;
  onPress: () => void;
}

function formatWindow(startsAt?: string | null, endsAt?: string | null) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const startLabel = startsAt ? formatter.format(new Date(startsAt)) : null;
  const endLabel = endsAt ? formatter.format(new Date(endsAt)) : null;

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel ?? endLabel ?? null;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const windowLabel = formatWindow(challenge.starts_at, challenge.ends_at);

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Surface elevated style={[styles.card, pressed && styles.cardPressed]}>
          <View style={styles.topRow}>
            <View style={styles.kickerRow}>
              {challenge.month_label ? (
                <Text variant="overline" style={styles.kicker}>
                  {challenge.month_label}
                </Text>
              ) : null}
            </View>
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
                {challenge.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={styles.copy}>
            <Text variant="subheading" numberOfLines={2}>
              {challenge.title}
            </Text>
            <Text variant="body" style={styles.description} numberOfLines={2}>
              {challenge.description || 'Open the challenge to view the full brief and leaderboard.'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {windowLabel ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text variant="caption" style={styles.metaText}>
                  {windowLabel}
                </Text>
              </View>
            ) : null}
            {typeof challenge.submission_count === 'number' ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="play-box-multiple-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text variant="caption" style={styles.metaText}>
                  {challenge.submission_count} entries
                </Text>
              </View>
            ) : null}
          </View>
        </Surface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardPressed: {
    opacity: 0.94,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  kickerRow: {
    flex: 1,
  },
  kicker: {
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
  copy: {
    gap: theme.spacing.xs,
  },
  description: {
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: theme.colors.textMuted,
  },
});
