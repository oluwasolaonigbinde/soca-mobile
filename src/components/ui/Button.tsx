import React, { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Text } from './Text';
import { alpha, theme } from './theme';

export type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ title, variant = 'solid', size = 'default', style, textStyle, disabled, ...rest }, ref) => {
    const isSolid = variant === 'solid';
    const isOutline = variant === 'outline';
    const isSoft = variant === 'soft';
    const small = size === 'small';

    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.base,
          small ? styles.small : styles.defaultSize,
          isSolid ? styles.solid : null,
          isOutline ? styles.outline : null,
          isSoft ? styles.soft : null,
          variant === 'ghost' ? styles.ghost : null,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        disabled={disabled}
        {...rest}
      >
        <Text
          variant={small ? 'caption' : 'label'}
          style={[
            isSolid ? styles.solidText : styles.outlineText,
            isSoft ? styles.softText : null,
            variant === 'ghost' ? styles.ghostText : null,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderWidth: theme.border.regular,
    borderColor: 'transparent',
  },
  defaultSize: {
    minHeight: 48,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  solid: {
    backgroundColor: theme.colors.accent,
    ...theme.shadows.accentGlow,
  },
  outline: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderStrong,
  },
  soft: {
    backgroundColor: theme.colors.surfaceTintStrong,
    borderColor: alpha(theme.colors.accent, 0.3),
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
  solidText: {
    color: theme.colors.textInverse,
  },
  outlineText: {
    color: theme.colors.textPrimary,
  },
  softText: {
    color: theme.colors.accent,
  },
  ghostText: {
    color: theme.colors.accent,
  },
});
