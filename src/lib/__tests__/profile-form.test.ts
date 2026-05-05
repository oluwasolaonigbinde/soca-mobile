import {
  buildProfileFormSchema,
  mapProfileFormValuesToUpdate,
} from '@/lib/profile-form';

const currentYear = new Date().getFullYear();

describe('profile form schema', () => {
  it('requires player football metadata', () => {
    const result = buildProfileFormSchema('player').safeParse({
      display_name: 'Player One',
      location: 'Lagos',
      bio: '',
      position: '',
      birth_year: '',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected player form validation to fail.');
    }
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual([
      'position',
      'birth_year',
    ]);
  });

  it('allows non-player profiles without player metadata', () => {
    const result = buildProfileFormSchema('scout').safeParse({
      display_name: 'Scout One',
      location: 'Abuja',
      bio: '',
      position: '',
      birth_year: '',
    });

    expect(result.success).toBe(true);
  });

  it('normalizes update payloads before persistence', () => {
    expect(
      mapProfileFormValuesToUpdate({
        display_name: '  Player One  ',
        location: '  Lagos  ',
        bio: '  Bio  ',
        position: '  Forward  ',
        birth_year: String(currentYear - 18),
      }),
    ).toEqual({
      display_name: 'Player One',
      location: 'Lagos',
      bio: 'Bio',
      position: 'Forward',
      birth_year: currentYear - 18,
    });
  });
});
