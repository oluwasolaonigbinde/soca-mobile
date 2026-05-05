import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { alpha, theme } from './theme';

export interface BrandWordmarkProps {
  size?: 'compact' | 'sidebar';
}

export function BrandWordmark({ size = 'sidebar' }: BrandWordmarkProps) {
  const compact = size === 'compact';

  return (
    <View style={[styles.wordmark, compact && styles.wordmarkCompact]}>
      <Text variant={compact ? 'title' : 'heading'} style={styles.wordmarkText}>
        S
      </Text>
      <View style={[styles.ballWrap, compact && styles.ballWrapCompact]}>
        <MaterialCommunityIcons
          name="soccer"
          size={compact ? 16 : 20}
          color={theme.colors.textInverse}
        />
      </View>
      <Text variant={compact ? 'title' : 'heading'} style={styles.wordmarkText}>
        CA
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wordmarkCompact: {
    gap: 1,
  },
  wordmarkText: {
    color: theme.colors.textPrimary,
    letterSpacing: -0.8,
  },
  ballWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    backgroundColor: theme.colors.accent,
    borderWidth: theme.border.regular,
    borderColor: alpha(theme.colors.white, 0.12),
  },
  ballWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
