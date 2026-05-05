import {
  DEMO_MODE_ENABLED,
  getDemoEventById,
  isDemoEventId,
  isDemoEventInterested,
  listDemoEvents,
  setDemoEventInterested,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { Event, EventInterest, Profile } from '@/types/database';

type RawRow = Record<string, unknown>;

const EVENT_FETCH_LIMIT = 200;

export interface EventRecord extends Event {
  event_date: string | null;
  organizer_name: string | null;
  interested_count: number;
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === '42P01' ||
    candidate.message?.includes('does not exist') === true ||
    candidate.message?.includes('Could not find the table') === true
  );
}

function isDuplicateKeyError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string };
  return candidate.code === '23505';
}

function getString(row: RawRow, key: string) {
  const value = row[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toEventTimestamp(eventDate: string | null) {
  if (!eventDate) return Number.POSITIVE_INFINITY;

  const parsed = Date.parse(eventDate);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function sortEventsByUpcomingDate<T extends Pick<EventRecord, 'event_date' | 'created_at'>>(
  events: T[],
) {
  return [...events].sort((a, b) => {
    const dateDelta = toEventTimestamp(a.event_date) - toEventTimestamp(b.event_date);
    if (dateDelta !== 0) return dateDelta;

    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

function normalizeEvent(row: RawRow): EventRecord | null {
  const id = getString(row, 'id');
  const createdAt = getString(row, 'created_at');

  if (!id || !createdAt) return null;

  const eventDate = getString(row, 'date') ?? getString(row, 'event_date') ?? getString(row, 'starts_at');

  return {
    id,
    title: getString(row, 'title') ?? getString(row, 'name') ?? 'Event',
    date: eventDate,
    event_date: eventDate,
    location: getString(row, 'location'),
    description: getString(row, 'description'),
    organizer_id: getString(row, 'organizer_id'),
    organizer_name: getString(row, 'organizer_name') ?? getString(row, 'organizer'),
    created_at: createdAt,
    interested_count: 0,
  };
}

async function enrichEvents(events: EventRecord[]) {
  if (events.length === 0) return [] as EventRecord[];

  const organizerIds = Array.from(
    new Set(
      events
        .filter((event) => !event.organizer_name && event.organizer_id)
        .map((event) => event.organizer_id as string),
    ),
  );
  const eventIds = events.map((event) => event.id);

  const [profileResult, interestResult] = await Promise.all([
    organizerIds.length > 0
      ? supabase.from('profiles').select('id, display_name, full_name').in('id', organizerIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('event_interest').select('event_id').in('event_id', eventIds),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profileMap = new Map(
    (((profileResult.data as Pick<Profile, 'id' | 'display_name' | 'full_name'>[] | null) ?? []).map(
      (profile) => [profile.id, profile.display_name || profile.full_name || null],
    )),
  );

  let interestCountMap = new Map<string, number>();
  if (interestResult.error) {
    if (!isMissingRelationError(interestResult.error)) {
      throw interestResult.error;
    }
  } else {
    interestCountMap = (((interestResult.data as Pick<EventInterest, 'event_id'>[] | null) ?? []).reduce(
      (map, interest) => {
        map.set(interest.event_id, (map.get(interest.event_id) ?? 0) + 1);
        return map;
      },
      new Map<string, number>(),
    ));
  }

  return sortEventsByUpcomingDate(
    events.map((event) => ({
      ...event,
      organizer_name:
        event.organizer_name || (event.organizer_id ? profileMap.get(event.organizer_id) ?? null : null),
      interested_count: interestCountMap.get(event.id) ?? 0,
    })),
  );
}

export async function listEvents(limit = 12): Promise<EventRecord[]> {
  if (DEMO_MODE_ENABLED) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return listDemoEvents(limit, user?.id ?? undefined) as EventRecord[];
  }

  const { data, error } = await supabase.from('events').select('*').limit(Math.max(limit, EVENT_FETCH_LIMIT));

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  const events = ((data as RawRow[] | null) ?? []).map(normalizeEvent).filter((row): row is EventRecord => !!row);
  const enriched = await enrichEvents(events);

  return enriched.slice(0, limit);
}

export async function getEventById(eventId: string): Promise<EventRecord | null> {
  if (DEMO_MODE_ENABLED && isDemoEventId(eventId)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return getDemoEventById(eventId, user?.id ?? undefined) as EventRecord | null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  if (!data) return null;

  const normalized = normalizeEvent(data as RawRow);
  if (!normalized) return null;

  const [event] = await enrichEvents([normalized]);
  return event ?? null;
}

export async function getCurrentUserEventInterest(eventId: string): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (DEMO_MODE_ENABLED && isDemoEventId(eventId)) {
    return isDemoEventInterested(eventId, user?.id ?? undefined);
  }
  if (!user) return false;

  const { data, error } = await supabase
    .from('event_interest')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return false;
    throw error;
  }

  return !!data;
}

export async function setEventInterested(eventId: string, interested: boolean) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Sign in to mark an event as Interested.');

  if (DEMO_MODE_ENABLED && isDemoEventId(eventId)) {
    setDemoEventInterested(eventId, user.id, interested);
    return;
  }

  if (!interested) {
    const { error } = await supabase
      .from('event_interest')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
    return;
  }

  const { data: existingRow, error: existingError } = await supabase
    .from('event_interest')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingRow) return;

  const { error } = await supabase.from('event_interest').insert({
    event_id: eventId,
    user_id: user.id,
  });

  if (error && !isDuplicateKeyError(error)) throw error;
}
