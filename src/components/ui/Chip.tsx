import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { alpha, theme } from './theme';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, active ? styles.active : styles.inactive, style]}
    >
      <Text variant="caption" style={active ? styles.activeText : styles.inactiveText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 38,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    borderWidth: theme.border.regular,
  },
  active: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: alpha(theme.colors.accent, 0.4),
  },
  inactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
  },
  activeText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  inactiveText: {
    color: theme.colors.textMuted,
  },
});
