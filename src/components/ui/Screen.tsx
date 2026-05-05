import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { theme } from './theme';

export interface ScreenProps extends ViewProps {
  /** When true, renders without SafeAreaView padding. */
  unsafe?: boolean;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}

export function Screen({
  unsafe = false,
  style,
  children,
  edges,
  ...rest
}: ScreenProps) {
  const Wrapper = unsafe ? View : SafeAreaView;
  const safeAreaProps = unsafe ? {} : { edges };

  return (
    <Wrapper style={[styles.screen, style]} {...safeAreaProps} {...rest}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
});
