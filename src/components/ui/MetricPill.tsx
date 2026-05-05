import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { alpha, theme } from './theme';

export interface MetricPillProps {
  value: number | string;
  label: string;
  dark?: boolean;
  compact?: boolean;
}

export function MetricPill({
  value,
  label,
  dark = false,
  compact = false,
}: MetricPillProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact, dark && styles.containerDark]}>
      <Text variant="title" style={[styles.value, compact && styles.valueCompact, dark && styles.valueDark]}>
        {value}
      </Text>
      <Text
        variant="caption"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.label, compact && styles.labelCompact, dark && styles.labelDark]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: theme.border.regular,
    borderColor: theme.colors.borderSubtle,
    gap: 2,
  },
  containerDark: {
    backgroundColor: alpha(theme.colors.white, 0.08),
    borderColor: alpha(theme.colors.white, 0.08),
  },
  containerCompact: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  value: {
    color: theme.colors.text,
  },
  valueCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  valueDark: {
    color: theme.colors.textOnDark,
  },
  label: {
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelCompact: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
  },
  labelDark: {
    color: theme.colors.textOnDarkMuted,
  },
});
