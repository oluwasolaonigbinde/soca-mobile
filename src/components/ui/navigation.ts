import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

import { getRoleHome } from '@/lib/roles';
import type { UserRole } from '@/types/database';

export type AppNavKey =
  | 'home'
  | 'explore'
  | 'challenges'
  | 'events'
  | 'messages'
  | 'profile'
  | 'admin';

export interface AppNavItem {
  key: AppNavKey;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  activeIcon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export const SIDEBAR_NAV_ITEMS: AppNavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { key: 'explore', label: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'challenges', label: 'Challenges', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'events', label: 'Events', icon: 'calendar-blank-outline', activeIcon: 'calendar-star' },
  { key: 'messages', label: 'Messages', icon: 'message-text-outline', activeIcon: 'message-text' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', activeIcon: 'account-circle' },
  { key: 'admin', label: 'Admin', icon: 'shield-crown-outline', activeIcon: 'shield-crown' },
];

export const BOTTOM_NAV_ITEMS = SIDEBAR_NAV_ITEMS.filter((item) => item.key !== 'events');

export function getVisibleNavItems(items: AppNavItem[], isAdmin: boolean) {
  return items.filter((item) => item.key !== 'admin' || isAdmin);
}

export function getActiveNavKey(pathname: string | null): AppNavKey {
  if (!pathname) return 'home';

  if (pathname.startsWith('/explore') || pathname.startsWith('/discover')) {
    return 'explore';
  }

  if (pathname.startsWith('/challenges')) {
    return 'challenges';
  }

  if (pathname.startsWith('/events')) {
    return 'events';
  }

  if (pathname.startsWith('/messages')) {
    return 'messages';
  }

  if (pathname.startsWith('/me')) {
    return 'profile';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  return 'home';
}

export function getMobileActiveNavKey(pathname: string | null): AppNavKey {
  const activeKey = getActiveNavKey(pathname);
  return activeKey === 'events' ? 'explore' : activeKey;
}

export function getNavTarget(key: AppNavKey, role: UserRole | null | undefined): Href {
  switch (key) {
    case 'home':
      return role ? getRoleHome(role) : ('/feed' as Href);
    case 'explore':
      return '/explore';
    case 'challenges':
      return '/challenges';
    case 'events':
      return '/events';
    case 'messages':
      return '/messages';
    case 'profile':
      return '/me' as Href;
    case 'admin':
      return '/admin';
    default:
      return '/feed' as Href;
  }
}
