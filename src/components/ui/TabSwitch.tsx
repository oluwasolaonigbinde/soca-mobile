import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { theme } from './theme';

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
}

export interface TabSwitchProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabSwitch<T extends string = string>({
  options,
  value,
  onChange,
}: TabSwitchProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text
              variant="label"
              style={[styles.label, active && styles.labelActive]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: 4,
    borderRadius: theme.radius.pill,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceRaised,
  },
  label: {
    color: theme.colors.textMuted,
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
});
