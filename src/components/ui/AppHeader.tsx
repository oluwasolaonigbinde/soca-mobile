import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { theme } from './theme';

export interface AppHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}

export function AppHeader({ badge, title, subtitle, trailing }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {badge ? (
          <Text variant="overline" style={styles.badge}>
            {badge}
          </Text>
        ) : null}
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="body" style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  badge: {
    color: theme.colors.accent,
  },
  subtitle: {
    color: theme.colors.textMuted,
    maxWidth: 560,
  },
  trailing: {
    paddingTop: theme.spacing.sm,
  },
});
