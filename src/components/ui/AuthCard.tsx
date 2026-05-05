import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Surface } from './Surface';
import { theme } from './theme';

export interface AuthCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AuthCard({ children, style }: AuthCardProps) {
  return (
    <Surface elevated padded style={[styles.card, style]}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.radius.xl,
    ...theme.shadows.card,
  },
});
