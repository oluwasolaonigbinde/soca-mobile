import { sortEventsByUpcomingDate, type EventRecord } from '@/lib/events';

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
