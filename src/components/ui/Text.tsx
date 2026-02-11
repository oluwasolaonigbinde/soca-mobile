import React from 'react';
import {
    Text as RNText,
    StyleSheet,
    type TextProps as RNTextProps,
} from 'react-native';

export type TextVariant = 'heading' | 'subheading' | 'body' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  return <RNText style={[styles.base, variantStyles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    color: '#111',
  },
});

const variantStyles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
