import type { Href } from 'expo-router';

import type { UserRole } from '@/types/database';

const ROLE_HOME_MAP: Record<UserRole, Href> = {
  player: '/(player)/home',
  scout: '/(scout)/home',
  club: '/(club)/home',
  org: '/(org)/home',
};

export function getRoleHome(role: UserRole): Href {
  return ROLE_HOME_MAP[role];
}

export function canUploadHighlights(role: UserRole | null | undefined): boolean {
  return role === 'player';
}

export function canSubmitChallengeVideos(
  role: UserRole | null | undefined,
): boolean {
  return role === 'player';
}
