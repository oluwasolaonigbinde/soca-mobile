import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';

import { Text } from './Text';
import {
  BOTTOM_NAV_ITEMS,
  getMobileActiveNavKey,
  getNavTarget,
  getVisibleNavItems,
} from './navigation';
import { theme } from './theme';
import { isSessionAdmin } from '@/lib/admin';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.profile?.role);
  const session = useAuthStore((state) => state.session);
  const activeTab = getMobileActiveNavKey(pathname);
  const navItems = getVisibleNavItems(BOTTOM_NAV_ITEMS, isSessionAdmin(session));

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        {navItems.map((item) => {
          const active = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              onPress={() => router.replace(getNavTarget(item.key, role))}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={active ? item.activeIcon : item.icon}
                size={22}
                color={active ? theme.colors.accent : theme.colors.textMuted}
              />
              <Text
                variant="caption"
                numberOfLines={1}
                style={[styles.label, active && styles.labelActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: theme.colors.canvasMuted,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: theme.border.hairline,
    borderColor: theme.colors.borderSubtle,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.xs,
  },
  itemActive: {
    backgroundColor: theme.colors.surfaceTint,
  },
  itemPressed: {
    opacity: 0.9,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  labelActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
});
