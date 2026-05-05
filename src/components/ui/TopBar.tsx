import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BrandWordmark } from './BrandWordmark';
import { Text } from './Text';
import { theme } from './theme';

export interface TopBarProps {
  title?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function TopBar({ title, onMenuPress, showMenu = true }: TopBarProps) {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {showMenu ? (
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
            accessibilityLabel="Open menu"
          >
            <MaterialCommunityIcons
              name="menu"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      {title ? (
        <View style={styles.center}>
          <Text variant="title" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
      ) : showMenu ? (
        <View style={styles.center}>
          <BrandWordmark size="compact" />
        </View>
      ) : (
        <View style={styles.center} />
      )}

      <View style={styles.right}>
        <Pressable
          onPress={() => router.push('/explore')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
          accessibilityLabel="Search"
        >
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.canvasMuted,
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.colors.borderSubtle,
  },
  left: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
  iconPressed: {
    opacity: 0.8,
  },
});
