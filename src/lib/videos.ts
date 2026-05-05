import { mergeUniqueById, sortNetworkFeedVideos } from '@/lib/ai-assist';
import { requireCurrentUserRole } from '@/lib/authorization';
import {
  DEMO_MODE_ENABLED,
  getDemoVideoById,
  isDemoVideoId,
  isDemoVideoLiked,
  listDemoFeedVideos,
  listDemoProfileVideos,
  recordDemoVideoView,
  setDemoVideoLiked,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Profile, Video, VideoWithCounts } from '@/types/database';
import * as ImagePicker from 'expo-image-picker';

function getVideoExtension(uri: string, mimeType: string | null | undefined) {
  if (mimeType === 'video/quicktime') return 'mov';
  if (mimeType === 'video/x-matroska') return 'mkv';
  if (mimeType === 'video/webm') return 'webm';
  if (mimeType === 'video/mp4') return 'mp4';

  const extFromUri = uri.split('.').pop()?.toLowerCase();
  if (extFromUri && /^[a-z0-9]+$/.test(extFromUri)) return extFromUri;

  return 'mp4';
}

type RawRow = Record<string, unknown>;

const FEED_VIDEO_LIMIT_MULTIPLIER = 3;
const MIN_NETWORK_VIDEO_POOL = 40;
const FEED_LIKE_SIGNAL_LIMIT = 80;
const FEED_VIEW_SIGNAL_LIMIT = 120;
const FEED_MESSAGE_SIGNAL_LIMIT = 80;

function buildCountMap(rows: RawRow[], key: string) {
  return rows.reduce<Map<string, number>>((map, row) => {
    const rawKey = row[key];
    if (typeof rawKey !== 'string' || rawKey.length === 0) {
      return map;
    }

    map.set(rawKey, (map.get(rawKey) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
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

function addOwnerScore(ownerScores: Map<string, number>, ownerId: string | null | undefined, score: number) {
  if (!ownerId) {
    return;
  }

  ownerScores.set(ownerId, (ownerScores.get(ownerId) ?? 0) + score);
}

function buildPlaybackUrl(storagePath: string) {
  const {
    data: { publicUrl },
  } = supabase.storage.from('videos').getPublicUrl(storagePath);
  return publicUrl;
}

async function buildVideosWithCounts(videos: Video[]): Promise<VideoWithCounts[]> {
  if (videos.length === 0) {
    return [];
  }

  const videoIds = videos.map((video) => video.id);
  const ownerIds = Array.from(new Set(videos.map((video) => video.owner_id)));

  const [
    { data: likeRows, error: likeError },
    { data: viewRows, error: viewError },
    { data: ownerRows, error: ownerError },
  ] = await Promise.all([
    supabase.from('video_likes').select('video_id').in('video_id', videoIds),
    supabase.from('video_views').select('video_id').in('video_id', videoIds),
    supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, role')
      .in('id', ownerIds),
  ]);

  if (likeError) throw likeError;
  if (viewError) throw viewError;
  if (ownerError) throw ownerError;

  const likeCounts = buildCountMap((likeRows as RawRow[] | null) ?? [], 'video_id');
  const viewCounts = buildCountMap((viewRows as RawRow[] | null) ?? [], 'video_id');
  const ownerProfiles = new Map(
    (
      ((ownerRows as Pick<
        Profile,
        'id' | 'display_name' | 'full_name' | 'avatar_url' | 'role'
      >[] | null) ?? [])
    ).map((profile) => [profile.id, profile]),
  );

  return videos.map((video) => ({
    ...video,
    like_count: likeCounts.get(video.id) ?? 0,
    view_count: viewCounts.get(video.id) ?? 0,
    owner_profile: ownerProfiles.get(video.owner_id) ?? null,
    playback_url: buildPlaybackUrl(video.storage_path),
  }));
}

export async function getVideoOwnerMap(videoIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(videoIds.filter((videoId) => videoId.trim().length > 0)));
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.from('videos').select('id, owner_id').in('id', uniqueIds);
  if (error) throw error;

  return (((data as Pick<Video, 'id' | 'owner_id'>[] | null) ?? [])).reduce(
    (videoOwners, video) => {
      videoOwners.set(video.id, video.owner_id);
      return videoOwners;
    },
    new Map<string, string>(),
  );
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user?.id ?? null;
}

function getDemoContext(currentUserId: string | undefined) {
  return {
    currentUserId,
    currentProfile: useAuthStore.getState().profile,
  };
}

export async function listLatestVideos(limit = 20): Promise<VideoWithCounts[]> {
  if (DEMO_MODE_ENABLED) {
    const currentUserId = await getCurrentUserId();
    const { currentProfile } = getDemoContext(currentUserId ?? undefined);
    return listDemoFeedVideos(currentUserId ?? undefined, currentProfile, limit);
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const videos = (data as Video[] | null) ?? [];
  return buildVideosWithCounts(videos);
}

export async function listFeedVideos(limit = 20): Promise<VideoWithCounts[]> {
  const currentUserId = await getCurrentUserId();
  if (DEMO_MODE_ENABLED) {
    const { currentProfile } = getDemoContext(currentUserId ?? undefined);
    return listDemoFeedVideos(currentUserId ?? undefined, currentProfile, limit);
  }

  if (!currentUserId) {
    return listLatestVideos(limit);
  }

  const [
    { data: followRows, error: followError },
    { data: likeRows, error: likeError },
    { data: viewRows, error: viewError },
    { data: messageRows, error: messageError },
  ] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', currentUserId),
    supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(FEED_LIKE_SIGNAL_LIMIT),
    supabase
      .from('video_views')
      .select('video_id')
      .eq('viewer_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(FEED_VIEW_SIGNAL_LIMIT),
    supabase
      .from('messages')
      .select('sender_id, recipient_id')
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(FEED_MESSAGE_SIGNAL_LIMIT),
  ]);

  if (followError) throw followError;
  if (likeError) throw likeError;
  if (viewError) throw viewError;
  if (messageError && !isMissingRelationError(messageError)) throw messageError;

  const ownerScores = new Map<string, number>();
  const likeVideoIds = ((likeRows as RawRow[] | null) ?? [])
    .map((row) => (typeof row.video_id === 'string' ? row.video_id : null))
    .filter((videoId): videoId is string => !!videoId);
  const viewVideoIds = ((viewRows as RawRow[] | null) ?? [])
    .map((row) => (typeof row.video_id === 'string' ? row.video_id : null))
    .filter((videoId): videoId is string => !!videoId);
  const videoOwnerMap = await getVideoOwnerMap([...likeVideoIds, ...viewVideoIds]);

  (((followRows as RawRow[] | null) ?? [])).forEach((row) => {
    const followeeId = typeof row.followee_id === 'string' ? row.followee_id : null;
    if (followeeId && followeeId !== currentUserId) {
      addOwnerScore(ownerScores, followeeId, 6);
    }
  });

  (((messageRows as RawRow[] | null) ?? [])).forEach((row) => {
    const senderId = typeof row.sender_id === 'string' ? row.sender_id : null;
    const recipientId = typeof row.recipient_id === 'string' ? row.recipient_id : null;
    const otherParticipantId = senderId === currentUserId ? recipientId : senderId;
    if (otherParticipantId && otherParticipantId !== currentUserId) {
      addOwnerScore(ownerScores, otherParticipantId, 5);
    }
  });

  likeVideoIds.forEach((videoId) => {
    const ownerId = videoOwnerMap.get(videoId);
    if (ownerId && ownerId !== currentUserId) {
      addOwnerScore(ownerScores, ownerId, 4);
    }
  });

  viewVideoIds.forEach((videoId) => {
    const ownerId = videoOwnerMap.get(videoId);
    if (ownerId && ownerId !== currentUserId) {
      addOwnerScore(ownerScores, ownerId, 2);
    }
  });

  const prioritizedOwnerIds = Array.from(ownerScores.keys());
  if (prioritizedOwnerIds.length === 0) {
    return listLatestVideos(limit);
  }

  const networkPoolSize = Math.max(limit * FEED_VIDEO_LIMIT_MULTIPLIER, MIN_NETWORK_VIDEO_POOL);
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .in('owner_id', prioritizedOwnerIds)
    .order('created_at', { ascending: false })
    .limit(networkPoolSize);

  if (error) throw error;

  const networkVideos = await buildVideosWithCounts((data as Video[] | null) ?? []);
  const sortedNetworkVideos = sortNetworkFeedVideos(networkVideos, ownerScores);

  if (sortedNetworkVideos.length >= limit) {
    return sortedNetworkVideos.slice(0, limit);
  }

  const latestVideos = await listLatestVideos(limit);
  return mergeUniqueById(sortedNetworkVideos, latestVideos, limit);
}

export async function listProfileVideos(profileId: string, limit = 12): Promise<VideoWithCounts[]> {
  if (DEMO_MODE_ENABLED) {
    const currentUserId = await getCurrentUserId();
    const { currentProfile } = getDemoContext(currentUserId ?? undefined);
    return listDemoProfileVideos(profileId, currentUserId ?? undefined, currentProfile, limit);
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('owner_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const videos = (data as Video[] | null) ?? [];
  return buildVideosWithCounts(videos);
}

export async function listVideosByIds(videoIds: string[]): Promise<VideoWithCounts[]> {
  if (videoIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from('videos').select('*').in('id', videoIds);

  if (error) throw error;

  const videos = (data as Video[] | null) ?? [];
  const videoMap = new Map(videos.map((video) => [video.id, video]));
  const orderedVideos = videoIds
    .map((videoId) => videoMap.get(videoId))
    .filter((video): video is Video => !!video);

  return buildVideosWithCounts(orderedVideos);
}

export async function getVideoById(videoId: string): Promise<VideoWithCounts | null> {
  if (DEMO_MODE_ENABLED && isDemoVideoId(videoId)) {
    const currentUserId = await getCurrentUserId();
    const { currentProfile } = getDemoContext(currentUserId ?? undefined);
    return getDemoVideoById(videoId, currentUserId ?? undefined, currentProfile);
  }

  const { data, error } = await supabase.from('videos').select('*').eq('id', videoId).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [video] = await buildVideosWithCounts([data as Video]);
  return video ?? null;
}

export async function uploadVideo(caption: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to upload a video.');
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 0.8,
    videoMaxDuration: 180,
  });

  if (pickerResult.canceled) {
    return null;
  }

  const asset = pickerResult.assets[0];
  const profile = await requireCurrentUserRole('player', 'upload highlight videos');

  const extension = getVideoExtension(asset.uri, asset.mimeType);
  const filePath = `${profile.id}/${Date.now()}.${extension}`;
  const response = await fetch(asset.uri);
  const videoBlob = await response.blob();

  const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, videoBlob, {
    contentType: asset.mimeType ?? 'video/mp4',
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const payload = {
    owner_id: profile.id,
    storage_path: filePath,
    caption: caption.trim() ? caption.trim() : null,
    duration: asset.duration ?? null,
  };

  const { data, error } = await supabase.from('videos').insert(payload).select('*').single();

  if (error) throw error;

  const [video] = await buildVideosWithCounts([data as Video]);
  return video ?? null;
}

export async function recordVideoView(videoId: string) {
  if (DEMO_MODE_ENABLED && isDemoVideoId(videoId)) {
    recordDemoVideoView(videoId);
    return;
  }

  // Anonymous views are policy-permitted (viewer_id NULL), but in practice we
  // only want to record when the caller has a session — otherwise repeated
  // anonymous mounts inflate counts and there's no signal value.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('video_views').insert({
    video_id: videoId,
    viewer_id: user.id,
  });

  if (error) throw error;
}

export async function isVideoLiked(videoId: string, userId: string | undefined): Promise<boolean> {
  if (DEMO_MODE_ENABLED && isDemoVideoId(videoId)) {
    return isDemoVideoLiked(videoId, userId);
  }

  if (!userId) return false;

  const { data, error } = await supabase
    .from('video_likes')
    .select('video_id')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function likeVideo(videoId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (DEMO_MODE_ENABLED && isDemoVideoId(videoId)) {
    setDemoVideoLiked(videoId, user.id, true);
    return;
  }

  const { error } = await supabase.from('video_likes').upsert(
    {
      video_id: videoId,
      user_id: user.id,
    },
    { onConflict: 'video_id,user_id' },
  );

  if (error) throw error;
}

export async function unlikeVideo(videoId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (DEMO_MODE_ENABLED && isDemoVideoId(videoId)) {
    setDemoVideoLiked(videoId, user.id, false);
    return;
  }

  const { error } = await supabase
    .from('video_likes')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', user.id);

  if (error) throw error;
}
