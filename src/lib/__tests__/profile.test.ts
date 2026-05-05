import {
  getAgeFromBirthYear,
  getMissingProfileFields,
  getShortPositionLabel,
  isProfileComplete,
} from '@/lib/profile';
import type { Profile } from '@/types/database';

const currentYear = new Date().getFullYear();

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    role: 'player',
    full_name: 'Player One',
    username: 'player-one',
    avatar_url: null,
    display_name: 'Player One',
    bio: null,
    location: 'Lagos',
    verified: false,
    verified_at: null,
    position: 'Forward',
    birth_year: currentYear - 20,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('profile completeness', () => {
  it('requires football metadata for player profiles', () => {
    const incompletePlayer = makeProfile({ position: null, birth_year: null });

    expect(isProfileComplete(incompletePlayer)).toBe(false);
    expect(getMissingProfileFields(incompletePlayer)).toEqual([
      'position',
      'birth_year',
    ]);
  });

  it('keeps non-player completion rules lightweight', () => {
    const scoutProfile = makeProfile({
      role: 'scout',
      position: null,
      birth_year: null,
    });

    expect(isProfileComplete(scoutProfile)).toBe(true);
  });

  it('derives ages from valid birth years only', () => {
    expect(getAgeFromBirthYear(currentYear - 18)).toBe(18);
    expect(getAgeFromBirthYear(currentYear + 1)).toBeNull();
  });

  it('maps common football positions to shorter labels for display', () => {
    expect(getShortPositionLabel('Striker')).toBe('ST');
    expect(getShortPositionLabel('Center Back')).toBe('CB');
    expect(getShortPositionLabel('Goalkeeper')).toBe('GK');
    expect(getShortPositionLabel('Second Striker')).toBe('Second Striker');
    expect(getShortPositionLabel(null)).toBeNull();
  });
});
