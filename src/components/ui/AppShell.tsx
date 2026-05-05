import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from './BottomNav';
import { BrandWordmark } from './BrandWordmark';
import { Drawer } from './Drawer';
import { Screen } from './Screen';
import { TopBar } from './TopBar';
import {
  SIDEBAR_NAV_ITEMS,
  getActiveNavKey,
  getNavTarget,
  getVisibleNavItems,
} from './navigation';
import { Text } from './Text';
import { alpha, theme } from './theme';

import { useAuthStore } from '@/store/auth';
import { isSessionAdmin } from '@/lib/admin';

export interface AppShellProps {
  header?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.profile?.role);
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const activeKey = getActiveNavKey(pathname);
  const navItems = getVisibleNavItems(SIDEBAR_NAV_ITEMS, isSessionAdmin(session));

  const handleLogout = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <BrandWordmark />
        <Text variant="caption" style={styles.sidebarBrandCaption}>
          Football discovery
        </Text>
      </View>

      <View style={styles.sidebarList}>
        {navItems.map((item) => {
          const active = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              onPress={() => router.replace(getNavTarget(item.key, role))}
              style={({ pressed }) => [
                styles.sidebarItem,
                active && styles.sidebarItemActive,
                pressed && styles.sidebarItemPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? theme.colors.accent : theme.colors.textMuted}
              />
              <Text variant="label" style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.sidebarItem, pressed && styles.sidebarItemPressed]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={theme.colors.textMuted} />
          <Text variant="label" style={styles.sidebarLabel}>
            Log out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AppShell({ header, title, children, contentStyle }: AppShellProps) {
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Screen unsafe style={styles.screen}>
      <SafeAreaView edges={showSidebar ? ['top', 'bottom'] : ['top']} style={styles.safeArea}>
        <View style={styles.shell}>
          {showSidebar ? <SidebarNav /> : null}

          <View style={styles.main}>
            <TopBar
              title={title}
              showMenu={!showSidebar}
              onMenuPress={!showSidebar ? () => setDrawerOpen(true) : undefined}
            />
            <View style={[styles.content, showSidebar && styles.contentWide, contentStyle]}>
              {header ? <View style={styles.header}>{header}</View> : null}
              <View style={styles.body}>{children}</View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {!showSidebar ? (
        <>
          <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
          <BottomNav />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.canvasMuted,
  },
  safeArea: {
    flex: 1,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 244,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    borderRightWidth: theme.border.hairline,
    borderRightColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceDark,
  },
  sidebarBrand: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  sidebarBrandCaption: {
    color: theme.colors.textSoft,
  },
  sidebarList: {
    gap: theme.spacing.xs,
    flex: 1,
    marginTop: theme.spacing.xl,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.regular,
    borderColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: theme.colors.surfaceTint,
    borderColor: alpha(theme.colors.accent, 0.2),
  },
  sidebarItemPressed: {
    opacity: 0.85,
  },
  sidebarLabel: {
    color: theme.colors.textMuted,
  },
  sidebarLabelActive: {
    color: theme.colors.accent,
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
  main: {
    flex: 1,
    backgroundColor: theme.colors.canvasMuted,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  contentWide: {
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  body: {
    flex: 1,
    width: '100%',
  },
});
