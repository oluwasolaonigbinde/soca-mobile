import { prepareChallengeMutation } from '@/lib/admin';

jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));

describe('admin challenge mutations', () => {
  it('normalizes editable challenge fields without changing ownership', () => {
    expect(
      prepareChallengeMutation({
        title: '  August skills challenge  ',
        description: '  Best first touch  ',
        month: '  August  ',
        starts_at: '2026-08-01T00:00:00.000Z',
        ends_at: '2026-08-31T23:59:59.000Z',
      }),
    ).toEqual({
      title: 'August skills challenge',
      description: 'Best first touch',
      month: 'August',
      starts_at: '2026-08-01T00:00:00.000Z',
      ends_at: '2026-08-31T23:59:59.000Z',
    });
  });

  it('requires an end date after the start date', () => {
    expect(() =>
      prepareChallengeMutation({
        title: 'August skills challenge',
        description: '',
        month: '',
        starts_at: '2026-08-10T00:00:00.000Z',
        ends_at: '2026-08-01T00:00:00.000Z',
      }),
    ).toThrow('End date must be after the start date.');
  });

  it('requires a title', () => {
    expect(() =>
      prepareChallengeMutation({
        title: ' ',
        description: '',
        month: '',
        starts_at: '',
        ends_at: '',
      }),
    ).toThrow('Challenge title is required.');
  });
});
