import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { BrandWordmark } from './BrandWordmark';
import { Text } from './Text';
import { theme } from './theme';

import { useAuthStore } from '@/store/auth';
import type { AppNavKey } from './navigation';
import {
  SIDEBAR_NAV_ITEMS,
  getActiveNavKey,
  getNavTarget,
  getVisibleNavItems,
} from './navigation';
import { isSessionAdmin } from '@/lib/admin';

export interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function Drawer({ visible, onClose }: DrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.profile?.role);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const activeKey = getActiveNavKey(pathname);
  const navItems = getVisibleNavItems(SIDEBAR_NAV_ITEMS, isSessionAdmin(session));
  const { width } = useWindowDimensions();
  const slideAnim = React.useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, width, slideAnim]);

  const handleNav = (key: AppNavKey) => {
    router.replace(getNavTarget(key, role));
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.replace('/welcome');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.panel,
            {
              width: Math.min(280, width * 0.85),
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.brand}>
            <BrandWordmark />
            <Text variant="caption" style={styles.brandCaption}>
              Football discovery
            </Text>
          </View>

          <View style={styles.navList}>
            {navItems.map((item) => {
              const active = item.key === activeKey;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleNav(item.key)}
                  style={({ pressed }) => [
                    styles.navItem,
                    active && styles.navItemActive,
                    pressed && styles.navItemPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={active ? item.activeIcon : item.icon}
                    size={22}
                    color={active ? theme.colors.accent : theme.colors.textMuted}
                  />
                  <Text
                    variant="label"
                    style={[styles.navLabel, active && styles.navLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.navItemPressed]}
            >
              <MaterialCommunityIcons
                name="logout"
                size={22}
                color={theme.colors.textMuted}
              />
              <Text variant="label" style={styles.logoutLabel}>
                Log out
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    flex: 0,
    backgroundColor: theme.colors.surfaceDark,
    borderRightWidth: theme.border.hairline,
    borderRightColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  brand: {
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  brandCaption: {
    color: theme.colors.textSoft,
  },
  navList: {
    gap: theme.spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.regular,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: theme.colors.surfaceTint,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  navItemPressed: {
    opacity: 0.85,
  },
  navLabel: {
    color: theme.colors.textMuted,
  },
  navLabelActive: {
    color: theme.colors.accent,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xxl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  logoutLabel: {
    color: theme.colors.textMuted,
  },
});
