import React from 'react';
import {
    Text as RNText,
    StyleSheet,
    type StyleProp,
    type TextProps as RNTextProps,
    type TextStyle,
} from 'react-native';

import { theme } from './theme';

export type TextVariant =
  | 'hero'
  | 'heading'
  | 'subheading'
  | 'title'
  | 'body'
  | 'label'
  | 'caption'
  | 'overline';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  return <RNText style={[styles.base, variantStyles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
  },
});

const variantStyles = StyleSheet.create({
  hero: {
    ...theme.typography.hero,
  },
  heading: {
    ...theme.typography.heading,
  },
  subheading: {
    ...theme.typography.subheading,
  },
  title: {
    ...theme.typography.title,
  },
  body: {
    ...theme.typography.body,
  },
  label: {
    ...theme.typography.label,
  },
  caption: {
    ...theme.typography.caption,
  },
  overline: {
    ...theme.typography.overline,
  },
});
