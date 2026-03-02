import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenProps extends ViewProps {
  /** When true, renders without SafeAreaView padding. */
  unsafe?: boolean;
}

export function Screen({ unsafe = false, style, children, ...rest }: ScreenProps) {
  const Wrapper = unsafe ? View : SafeAreaView;

  return (
    <Wrapper style={[styles.screen, style]} {...rest}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
