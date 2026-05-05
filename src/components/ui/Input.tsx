import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from './theme';

export interface InputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** Show search icon on the left (for SearchInput-style usage) */
  searchIcon?: boolean;
}

export function Input({
  style,
  containerStyle,
  searchIcon = false,
  ...rest
}: InputProps) {
  const input = (
    <TextInput
      style={[styles.input, searchIcon && styles.searchInput, style]}
      placeholderTextColor={theme.colors.textSoft}
      {...rest}
    />
  );

  if (searchIcon) {
    return (
      <View style={[styles.searchWrap, containerStyle]}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.textSoft}
          style={styles.searchIcon}
        />
        {input}
      </View>
    );
  }

  return input;
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.regular,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 0,
    paddingLeft: 0,
    backgroundColor: 'transparent',
  },
  searchWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.regular,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  searchIcon: {
    flexShrink: 0,
  },
});
