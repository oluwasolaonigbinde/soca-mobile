import type { Profile } from '@/types/database';

const CURRENT_YEAR = new Date().getFullYear();

function hasValue(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function isValidBirthYear(
  birthYear: number | null | undefined,
): birthYear is number {
  if (typeof birthYear !== 'number' || !Number.isInteger(birthYear)) {
    return false;
  }
  return birthYear >= CURRENT_YEAR - 100 && birthYear <= CURRENT_YEAR;
}

export function getAgeFromBirthYear(birthYear: number | null): number | null {
  if (!isValidBirthYear(birthYear)) return null;

  const age = CURRENT_YEAR - birthYear;
  return age >= 0 ? age : null;
}

const POSITION_LABELS: Record<string, string> = {
  striker: 'ST',
  'centre forward': 'ST',
  'center forward': 'ST',
  forward: 'FW',
  winger: 'WG',
  'left winger': 'LW',
  'right winger': 'RW',
  'attacking midfielder': 'CAM',
  'central attacking midfielder': 'CAM',
  midfielder: 'CM',
  'central midfielder': 'CM',
  'defensive midfielder': 'CDM',
  'left midfielder': 'LM',
  'right midfielder': 'RM',
  'wing back': 'WB',
  'left wing back': 'LWB',
  'right wing back': 'RWB',
  'full back': 'FB',
  'left back': 'LB',
  'right back': 'RB',
  'centre back': 'CB',
  'center back': 'CB',
  defender: 'DEF',
  sweeper: 'SW',
  goalkeeper: 'GK',
  keeper: 'GK',
};

export function getShortPositionLabel(position: string | null | undefined) {
  if (typeof position !== 'string' || position.trim().length === 0) return null;

  const trimmedPosition = position.trim();
  const normalized = trimmedPosition.toLowerCase();
  return POSITION_LABELS[normalized] ?? trimmedPosition;
}

export function getMissingProfileFields(profile: Profile | null): string[] {
  if (!profile) return ['role', 'display_name', 'location'];

  const missing: string[] = [];

  if (!hasValue(profile.role)) missing.push('role');
  if (!hasValue(profile.display_name)) missing.push('display_name');
  if (!hasValue(profile.location)) missing.push('location');

  if (profile.role === 'player') {
    if (!hasValue(profile.position)) missing.push('position');
    if (!isValidBirthYear(profile.birth_year)) missing.push('birth_year');
  }

  return missing;
}

/**
 * Profile is complete when the base public profile exists.
 * Player profiles also require football metadata used by discovery.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  return getMissingProfileFields(profile).length === 0;
}
