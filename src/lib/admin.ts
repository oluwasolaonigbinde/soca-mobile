import {
  getChallengeById,
  listChallengeLeaderboard,
  listChallenges,
  type ChallengeLeaderboardEntry,
  type ChallengeWithStatus,
} from '@/lib/challenges';
import { listEvents, type EventRecord } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type {
  ChallengeSubmission,
  Event,
  FeaturedItem,
  FeaturedItemType,
  Profile,
  ProfileAchievement,
  Report,
  ReportContentType,
  ReportStatus,
  Video,
} from '@/types/database';
import type { Session } from '@supabase/supabase-js';

type RawRow = Record<string, unknown>;

export const ADMIN_SCHEMA_SETUP_MESSAGE =
  'Admin moderation schema is not available yet. Run docs/schema-08-admin.sql in Supabase first.';

export interface AdminOverview {
  challenge_count: number;
  event_count: number;
  open_report_count: number;
  featured_item_count: number;
  verified_profile_count: number;
  achievement_count: number;
}

export interface AdminReportRecord extends Report {
  reporter_name: string | null;
  target_label: string | null;
}

export interface AdminFeaturedItemRecord extends FeaturedItem {
  target_label: string | null;
}

export interface AdminChallengeSubmissionRecord extends ChallengeLeaderboardEntry {
  rank: number;
}

export interface ChallengeMutationInput {
  title: string;
  description: string;
  month: string;
  starts_at: string;
  ends_at: string;
}

function getString(row: RawRow, key: string) {
  const value = row[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getNullableBoolean(row: RawRow, key: string) {
  const value = row[key];
  if (typeof value === 'boolean') return value;
  return null;
}

function getNullableNumber(row: RawRow, key: string) {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isMissingSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    candidate.message?.includes('does not exist') === true ||
    candidate.message?.includes('Could not find the table') === true ||
    candidate.message?.includes('column') === true
  );
}

function toActionError(error: unknown, fallbackMessage: string) {
  if (isMissingSchemaError(error)) {
    return new Error(ADMIN_SCHEMA_SETUP_MESSAGE);
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
}

function normalizeDateInput(value: string, fieldLabel: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} must be a valid date or ISO timestamp.`);
  }

  return new Date(parsed).toISOString();
}

export function prepareChallengeMutation(input: ChallengeMutationInput) {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Challenge title is required.');
  }

  const startsAt = normalizeDateInput(input.starts_at, 'Start date');
  const endsAt = normalizeDateInput(input.ends_at, 'End date');

  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new Error('End date must be after the start date.');
  }

  return {
    title,
    description: input.description.trim() || null,
    month: input.month.trim() || null,
    starts_at: startsAt,
    ends_at: endsAt,
  };
}

function normalizeSortOrder(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    throw new Error('Sort order must be a whole number.');
  }

  return parsed;
}

function isReportContentType(value: string | null): value is ReportContentType {
  return value === 'profile' || value === 'video';
}

function isReportStatus(value: string | null): value is ReportStatus {
  return value === 'open' || value === 'reviewing' || value === 'resolved' || value === 'dismissed';
}

function normalizeReport(row: RawRow): Report | null {
  const id = getString(row, 'id');
  const reporterId = getString(row, 'reporter_id');
  const contentType = getString(row, 'content_type');
  const contentId = getString(row, 'content_id');
  const createdAt = getString(row, 'created_at');
  const reason = getString(row, 'reason');
  const status = getString(row, 'status');

  if (
    !id ||
    !reporterId ||
    !isReportContentType(contentType) ||
    !contentId ||
    !createdAt ||
    !reason ||
    !isReportStatus(status)
  ) {
    return null;
  }

  return {
    id,
    reporter_id: reporterId,
    content_type: contentType,
    content_id: contentId,
    reason,
    status,
    review_note: getString(row, 'review_note'),
    reviewed_by: getString(row, 'reviewed_by'),
    reviewed_at: getString(row, 'reviewed_at'),
    created_at: createdAt,
  };
}

export function isSessionAdmin(session: Session | null | undefined): boolean {
  const metadata = session?.user?.app_metadata;
  if (!metadata || typeof metadata !== 'object') return false;

  const flag = (metadata as Record<string, unknown>).is_admin;
  return flag === true || flag === 'true';
}

export async function requireAdminAccess(action: string) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.user) throw new Error('Sign in to continue.');
  if (!isSessionAdmin(session)) {
    throw new Error(`Only admin accounts can ${action}.`);
  }

  return session.user.id;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    challengeResult,
    eventResult,
    reportResult,
    featuredResult,
    verifiedResult,
    achievementResult,
  ] = await Promise.all([
    supabase.from('challenges').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('featured_items').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('profile_achievements').select('*', { count: 'exact', head: true }),
  ]);

  return {
    challenge_count: challengeResult.error && isMissingSchemaError(challengeResult.error)
      ? 0
      : (challengeResult.count ?? 0),
    event_count: eventResult.error && isMissingSchemaError(eventResult.error)
      ? 0
      : (eventResult.count ?? 0),
    open_report_count: reportResult.error && isMissingSchemaError(reportResult.error)
      ? 0
      : (reportResult.count ?? 0),
    featured_item_count: featuredResult.error && isMissingSchemaError(featuredResult.error)
      ? 0
      : (featuredResult.count ?? 0),
    verified_profile_count: verifiedResult.error && isMissingSchemaError(verifiedResult.error)
      ? 0
      : (verifiedResult.count ?? 0),
    achievement_count: achievementResult.error && isMissingSchemaError(achievementResult.error)
      ? 0
      : (achievementResult.count ?? 0),
  };
}

export async function listAdminChallenges(limit = 24): Promise<ChallengeWithStatus[]> {
  return listChallenges(limit);
}

export async function listAdminEvents(limit = 50): Promise<EventRecord[]> {
  return listEvents(limit);
}

export async function createChallenge(input: ChallengeMutationInput) {
  const adminUserId = await requireAdminAccess('create challenges');
  const challenge = prepareChallengeMutation(input);

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      ...challenge,
      created_by_admin: adminUserId,
    })
    .select('id')
    .single();

  if (error) throw toActionError(error, 'Unable to create challenge.');

  return getChallengeById((data as { id: string }).id);
}

export async function updateChallenge(challengeId: string, input: ChallengeMutationInput) {
  await requireAdminAccess('edit challenges');
  const challenge = prepareChallengeMutation(input);
  const { error } = await supabase.from('challenges').update(challenge).eq('id', challengeId);

  if (error) throw toActionError(error, 'Unable to update challenge.');

  return getChallengeById(challengeId);
}

export async function closeChallenge(challengeId: string) {
  await requireAdminAccess('close challenges');
  const challenge = await getChallengeById(challengeId);

  if (!challenge) {
    throw new Error('Challenge not found.');
  }
  if (!challenge.is_open) {
    throw new Error('Only an open challenge can be closed.');
  }

  const { error } = await supabase
    .from('challenges')
    .update({ ends_at: new Date().toISOString() })
    .eq('id', challengeId);

  if (error) throw toActionError(error, 'Unable to close challenge.');

  return getChallengeById(challengeId);
}

export async function createEvent(input: {
  title: string;
  description: string;
  date: string;
  location: string;
  organizer_id: string;
}) {
  await requireAdminAccess('create events');
  const title = input.title.trim();

  if (!title) {
    throw new Error('Event title is required.');
  }

  const eventDate = normalizeDateInput(input.date, 'Event date');

  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      description: input.description.trim() || null,
      date: eventDate,
      location: input.location.trim() || null,
      organizer_id: input.organizer_id.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw toActionError(error, 'Unable to create event.');

  return data as Event;
}

export async function listAdminChallengeSubmissions(
  challengeId: string,
): Promise<AdminChallengeSubmissionRecord[]> {
  return listChallengeLeaderboard(challengeId);
}

export async function updateChallengeSubmissionScore(submissionId: string, score: string) {
  await requireAdminAccess('score challenge submissions');

  const trimmed = score.trim();
  const parsed = trimmed ? Number(trimmed) : null;
  if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0 || parsed > 100)) {
    throw new Error('Score must be a whole number from 0 to 100.');
  }

  const { error } = await supabase
    .from('challenge_submissions')
    .update({ admin_score: parsed })
    .eq('id', submissionId);

  if (error) throw toActionError(error, 'Unable to update challenge score.');
}

export async function awardChallengeWinner(input: {
  challenge_id: string;
  submission_id: string;
  profile_id: string;
  challenge_title: string;
  player_name: string;
}) {
  const adminUserId = await requireAdminAccess('assign challenge winners');
  const title = `Winner: ${input.challenge_title}`;
  const description = `${input.player_name} won ${input.challenge_title}.`;

  const { error } = await supabase.from('profile_achievements').upsert(
    {
      profile_id: input.profile_id,
      challenge_id: input.challenge_id,
      event_id: null,
      title,
      description,
      awarded_at: new Date().toISOString(),
      created_by_admin: adminUserId,
    },
    { onConflict: 'challenge_id,profile_id' },
  );

  if (error) throw toActionError(error, 'Unable to assign winner.');

  const { data: submission, error: submissionError } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('id', input.submission_id)
    .maybeSingle();

  if (submissionError) throw toActionError(submissionError, 'Unable to confirm winner submission.');
  return submission as ChallengeSubmission | null;
}

export async function listProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
  const { data, error } = await supabase
    .from('profile_achievements')
    .select('*')
    .eq('profile_id', profileId)
    .order('awarded_at', { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data as ProfileAchievement[] | null) ?? [];
}

export async function createReport(input: {
  content_type: ReportContentType;
  content_id: string;
  reason: string;
}) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Sign in to submit a report.');

  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('Add a reason so the admin team knows what to review.');
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      content_type: input.content_type,
      content_id: input.content_id,
      reason,
      status: 'open',
    })
    .select('*')
    .single();

  if (error) throw toActionError(error, 'Unable to submit report.');

  return normalizeReport((data as RawRow) ?? {});
}

export async function listReports(limit = 50): Promise<AdminReportRecord[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  const reports = ((data as RawRow[] | null) ?? []).map(normalizeReport).filter((row): row is Report => !!row);
  if (reports.length === 0) return [];

  const reporterIds = Array.from(new Set(reports.map((report) => report.reporter_id)));
  const profileTargetIds = Array.from(
    new Set(
      reports
        .filter((report) => report.content_type === 'profile')
        .map((report) => report.content_id),
    ),
  );
  const videoTargetIds = Array.from(
    new Set(
      reports.filter((report) => report.content_type === 'video').map((report) => report.content_id),
    ),
  );

  const [reporterProfiles, profileTargets, videoTargets] = await Promise.all([
    reporterIds.length > 0
      ? supabase.from('profiles').select('id, display_name, full_name').in('id', reporterIds)
      : Promise.resolve({ data: [], error: null }),
    profileTargetIds.length > 0
      ? supabase.from('profiles').select('id, display_name, full_name').in('id', profileTargetIds)
      : Promise.resolve({ data: [], error: null }),
    videoTargetIds.length > 0
      ? supabase.from('videos').select('id, caption').in('id', videoTargetIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (reporterProfiles.error) throw reporterProfiles.error;
  if (profileTargets.error) throw profileTargets.error;
  if (videoTargets.error) throw videoTargets.error;

  const reporterNameMap = new Map(
    (((reporterProfiles.data as Pick<Profile, 'id' | 'display_name' | 'full_name'>[] | null) ?? []).map(
      (profile) => [profile.id, profile.display_name || profile.full_name || null],
    )),
  );
  const profileLabelMap = new Map(
    (((profileTargets.data as Pick<Profile, 'id' | 'display_name' | 'full_name'>[] | null) ?? []).map(
      (profile) => [profile.id, profile.display_name || profile.full_name || 'Profile'],
    )),
  );
  const videoLabelMap = new Map(
    (((videoTargets.data as Pick<Video, 'id' | 'caption'>[] | null) ?? []).map((video) => [
      video.id,
      video.caption || 'Highlight',
    ])),
  );

  return reports.map((report) => ({
    ...report,
    reporter_name: reporterNameMap.get(report.reporter_id) ?? null,
    target_label:
      report.content_type === 'profile'
        ? profileLabelMap.get(report.content_id) ?? 'Profile'
        : videoLabelMap.get(report.content_id) ?? 'Video',
  }));
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const adminUserId = await requireAdminAccess('review reports');

  const { error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw toActionError(error, 'Unable to update report status.');
}

export async function listFeaturedItemsAdmin(limit = 50): Promise<AdminFeaturedItemRecord[]> {
  const { data, error } = await supabase
    .from('featured_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  const items = (data as FeaturedItem[] | null) ?? [];
  if (items.length === 0) return [];

  const profileIds = Array.from(new Set(items.filter((item) => item.item_type === 'profile').map((item) => item.item_id)));
  const videoIds = Array.from(new Set(items.filter((item) => item.item_type === 'video').map((item) => item.item_id)));
  const challengeIds = Array.from(new Set(items.filter((item) => item.item_type === 'challenge').map((item) => item.item_id)));
  const eventIds = Array.from(new Set(items.filter((item) => item.item_type === 'event').map((item) => item.item_id)));

  const [profileResult, videoResult, challengeResult, eventResult] = await Promise.all([
    profileIds.length > 0
      ? supabase.from('profiles').select('id, display_name, full_name').in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    videoIds.length > 0
      ? supabase.from('videos').select('id, caption').in('id', videoIds)
      : Promise.resolve({ data: [], error: null }),
    challengeIds.length > 0
      ? supabase.from('challenges').select('id, title').in('id', challengeIds)
      : Promise.resolve({ data: [], error: null }),
    eventIds.length > 0
      ? supabase.from('events').select('id, title').in('id', eventIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (videoResult.error) throw videoResult.error;
  if (challengeResult.error) throw challengeResult.error;
  if (eventResult.error) throw eventResult.error;

  const profileMap = new Map(
    (((profileResult.data as Pick<Profile, 'id' | 'display_name' | 'full_name'>[] | null) ?? []).map(
      (profile) => [profile.id, profile.display_name || profile.full_name || 'Profile'],
    )),
  );
  const videoMap = new Map(
    (((videoResult.data as Pick<Video, 'id' | 'caption'>[] | null) ?? []).map((video) => [
      video.id,
      video.caption || 'Highlight',
    ])),
  );
  const challengeMap = new Map(
    (((challengeResult.data as { id: string; title: string | null }[] | null) ?? []).map((challenge) => [
      challenge.id,
      challenge.title || 'Challenge',
    ])),
  );
  const eventMap = new Map(
    (((eventResult.data as { id: string; title: string | null }[] | null) ?? []).map((event) => [
      event.id,
      event.title || 'Event',
    ])),
  );

  return items.map((item) => ({
    ...item,
    target_label:
      item.item_type === 'profile'
        ? profileMap.get(item.item_id) ?? 'Profile'
        : item.item_type === 'video'
          ? videoMap.get(item.item_id) ?? 'Video'
          : item.item_type === 'challenge'
            ? challengeMap.get(item.item_id) ?? 'Challenge'
            : eventMap.get(item.item_id) ?? 'Event',
  }));
}

export async function createFeaturedItem(input: {
  item_type: FeaturedItemType;
  item_id: string;
  section: string;
  sort_order: string;
  starts_at: string;
  ends_at: string;
}) {
  await requireAdminAccess('feature content');

  const itemId = input.item_id.trim();
  if (!itemId) {
    throw new Error('Item id is required.');
  }

  const startsAt = normalizeDateInput(input.starts_at, 'Start date');
  const endsAt = normalizeDateInput(input.ends_at, 'End date');
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new Error('End date must be after the start date.');
  }

  const { error } = await supabase.from('featured_items').upsert(
    {
      item_type: input.item_type,
      item_id: itemId,
      section: input.section.trim(),
      sort_order: normalizeSortOrder(input.sort_order),
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: true,
    },
    { onConflict: 'item_type,item_id,section' },
  );

  if (error) throw toActionError(error, 'Unable to feature item.');
}

export async function deleteFeaturedItem(featuredItemId: string) {
  await requireAdminAccess('remove featured items');

  const { error } = await supabase.from('featured_items').delete().eq('id', featuredItemId);
  if (error) throw toActionError(error, 'Unable to remove featured item.');
}

export async function listVerificationProfiles(limit = 40): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  return (data as Profile[] | null) ?? [];
}

export async function setProfileVerification(profileId: string, verified: boolean) {
  await requireAdminAccess(verified ? 'verify profiles' : 'remove verification badges');

  const { error } = await supabase
    .from('profiles')
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq('id', profileId);

  if (error) throw toActionError(error, 'Unable to update profile verification.');
}

export function getProfileDisplayName(profile: Pick<Profile, 'display_name' | 'full_name'>) {
  return profile.display_name || profile.full_name || 'Unknown user';
}

export function getProfileVerificationState(row: RawRow | Profile) {
  return getNullableBoolean(row as RawRow, 'verified') ?? false;
}

export function getProfileVerificationDate(row: RawRow | Profile) {
  return getString(row as RawRow, 'verified_at');
}

export function getReportTargetDescription(report: Pick<AdminReportRecord, 'content_type' | 'target_label'>) {
  const label = report.target_label || (report.content_type === 'profile' ? 'Profile' : 'Video');
  return `${report.content_type === 'profile' ? 'Profile' : 'Video'}: ${label}`;
}

export function getFeaturedItemDescription(
  item: Pick<AdminFeaturedItemRecord, 'item_type' | 'target_label' | 'item_id'>,
) {
  return `${item.item_type}: ${item.target_label || item.item_id}`;
}

export function getVerificationBadgeCopy(profile: Pick<Profile, 'verified' | 'verified_at'>) {
  if (!profile.verified) return null;

  return profile.verified_at ? `Verified on ${new Date(profile.verified_at).toLocaleDateString()}` : 'Verified';
}

export function getReportStatusLabel(status: ReportStatus) {
  if (status === 'open') return 'Open';
  if (status === 'reviewing') return 'Reviewing';
  if (status === 'resolved') return 'Resolved';
  return 'Dismissed';
}

export function getVerificationStatusLabel(profile: Pick<Profile, 'verified'>) {
  return profile.verified ? 'Verified' : 'Not verified';
}

export function getFeaturedSortOrder(item: Pick<FeaturedItem, 'sort_order'>) {
  return getNullableNumber(item as RawRow, 'sort_order') ?? 0;
}
