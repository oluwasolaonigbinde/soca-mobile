import React from 'react';
import { LinearGradient, type LinearGradientPoint } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from './theme';

export interface GradientCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors: readonly [string, string, ...string[]];
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
}

export function GradientCard({
  children,
  style,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientCardProps) {
  const flattenedStyle = StyleSheet.flatten(style);
  const borderRadius =
    typeof flattenedStyle?.borderRadius === 'number'
      ? flattenedStyle.borderRadius
      : theme.radius.lg;

  return (
    <View style={[styles.shadowFrame, { borderRadius }]}>
      <LinearGradient
        colors={[...colors]}
        start={start}
        end={end}
        style={[styles.gradient, { borderRadius }, style]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowFrame: {
    ...theme.shadows.card,
  },
  gradient: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    padding: theme.spacing.xl,
  },
});
