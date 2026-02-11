import React, { forwardRef } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    type PressableProps,
    type TextStyle,
    type ViewStyle,
} from 'react-native';

export type ButtonVariant = 'solid' | 'outline';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ title, variant = 'solid', style, textStyle, disabled, ...rest }, ref) => {
    const isSolid = variant === 'solid';

    return (
      <Pressable
        ref={ref}
        style={({ pressed }) => [
          styles.base,
          isSolid ? styles.solid : styles.outline,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        disabled={disabled}
        {...rest}
      >
        <Text
          style={[
            styles.text,
            isSolid ? styles.solidText : styles.outlineText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  solid: {
    backgroundColor: '#111',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#111',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  solidText: {
    color: '#fff',
  },
  outlineText: {
    color: '#111',
  },
});
