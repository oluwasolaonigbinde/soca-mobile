import {
  prepareOrganizerEventInsert,
  sortEventsByUpcomingDate,
  type EventRecord,
} from '@/lib/events';

jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: 'event-1',
    title: 'Showcase',
    date: '2026-05-01T09:00:00.000Z',
    event_date: '2026-05-01T09:00:00.000Z',
    location: 'Lagos',
    description: null,
    organizer_id: null,
    organizer_name: null,
    created_at: '2026-01-01T00:00:00.000Z',
    interested_count: 0,
    ...overrides,
  };
}

describe('events ordering', () => {
  it('sorts upcoming events by soonest date first', () => {
    const sorted = sortEventsByUpcomingDate([
      makeEvent({ id: 'event-3', event_date: '2026-06-01T09:00:00.000Z', date: '2026-06-01T09:00:00.000Z' }),
      makeEvent({ id: 'event-1', event_date: '2026-04-01T09:00:00.000Z', date: '2026-04-01T09:00:00.000Z' }),
      makeEvent({ id: 'event-2', event_date: null, date: null }),
    ]);

    expect(sorted.map((event) => event.id)).toEqual(['event-1', 'event-3', 'event-2']);
  });
});

describe('organizer event creation', () => {
  it('forces the signed-in club profile to be the organizer', () => {
    expect(
      prepareOrganizerEventInsert(
        { id: 'club-1', role: 'club' },
        {
          title: '  Academy trials  ',
          date: '2026-08-15T10:00:00.000Z',
          location: '  Lagos  ',
          description: '  Open registration  ',
        },
      ),
    ).toEqual({
      title: 'Academy trials',
      date: '2026-08-15T10:00:00.000Z',
      location: 'Lagos',
      description: 'Open registration',
      organizer_id: 'club-1',
    });
  });

  it.each(['player', 'scout'] as const)('denies the %s role', (role) => {
    expect(() =>
      prepareOrganizerEventInsert(
        { id: `${role}-1`, role },
        { title: 'Trials', date: '2026-08-15T10:00:00.000Z' },
      ),
    ).toThrow('Only club and organization accounts can create events.');
  });

  it('rejects an invalid date', () => {
    expect(() =>
      prepareOrganizerEventInsert(
        { id: 'org-1', role: 'org' },
        { title: 'Community cup', date: 'not-a-date' },
      ),
    ).toThrow('Enter a valid event date and time.');
  });
});
