import {
  DEMO_MODE_ENABLED,
  getDemoProfileById,
  listDemoFeedVideos,
  listDemoProfileVideos,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Post, PostWithContent, Profile, VideoWithCounts } from '@/types/database';
import * as ImagePicker from 'expo-image-picker';

import { listFeedVideos, listProfileVideos, listVideosByIds } from './videos';

type PostOwnerProfile = Pick<Profile, 'id' | 'display_name' | 'full_name' | 'avatar_url' | 'role'>;

const demoTextPosts = new Map<string, PostWithContent[]>();
const demoPostLikeState = new Map<string, Set<string>>();

const POST_IMAGES_BUCKET = 'post-images';

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === '42P01' ||
    candidate.message?.includes('does not exist') === true ||
    candidate.message?.includes('Could not find the table') === true
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

function getCurrentProfile() {
  return useAuthStore.getState().profile;
}

function toOwnerProfile(profile: Profile | null | undefined): PostOwnerProfile | null {
  if (!profile) return null;

  return {
    id: profile.id,
    display_name: profile.display_name,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
  };
}

function toVirtualVideoPost(video: VideoWithCounts): PostWithContent {
  return {
    id: `video:${video.id}`,
    owner_id: video.owner_id,
    body: video.caption,
    video_id: video.id,
    image_path: null,
    created_at: video.created_at,
    owner_profile: video.owner_profile,
    video,
    image_url: null,
    like_count: video.like_count,
    is_liked: false,
    source: 'video',
  };
}

function sortPosts(posts: PostWithContent[]) {
  return [...posts].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  );
}

function trimToLimit(posts: PostWithContent[], limit: number) {
  return sortPosts(posts).slice(0, limit);
}

async function buildOwnerProfiles(ownerIds: string[]) {
  const uniqueOwnerIds = Array.from(new Set(ownerIds.filter(Boolean)));
  if (uniqueOwnerIds.length === 0) {
    return new Map<string, PostOwnerProfile>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, full_name, avatar_url, role')
    .in('id', uniqueOwnerIds);

  if (error) throw error;

  return new Map(
    (((data as PostOwnerProfile[] | null) ?? [])).map((profile) => [profile.id, profile]),
  );
}

function buildPostImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(imagePath);

  return publicUrl;
}

function getImageExtension(uri: string, mimeType: string | null | undefined) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic') return 'heic';
  if (mimeType === 'image/heif') return 'heif';

  const extFromUri = uri.split('.').pop()?.toLowerCase();
  if (extFromUri && /^[a-z0-9]+$/.test(extFromUri)) return extFromUri;

  return 'jpg';
}

function ensureDemoPostLikeSet(currentUserId: string) {
  const existing = demoPostLikeState.get(currentUserId);
  if (existing) return existing;

  const next = new Set<string>();
  demoPostLikeState.set(currentUserId, next);
  return next;
}

function withDemoPostLikeState(post: PostWithContent, currentUserId: string | undefined) {
  if (!currentUserId || post.video_id) {
    return post;
  }

  const likedPosts = ensureDemoPostLikeSet(currentUserId);
  const isLiked = likedPosts.has(post.id);
  return {
    ...post,
    is_liked: isLiked,
    like_count: post.like_count + (isLiked ? 1 : 0),
  };
}

function isRealPostId(postId: string) {
  return !postId.startsWith('video:');
}

async function buildPostsWithContent(rows: Post[]) {
  if (rows.length === 0) return [];

  const currentUserId = await getCurrentUserId();
  const postIds = rows.map((row) => row.id).filter(isRealPostId);
  const videoIds = rows
    .map((row) => row.video_id)
    .filter((videoId): videoId is string => !!videoId);
  const [ownerProfiles, videos, likeRows, likedRows] = await Promise.all([
    buildOwnerProfiles(rows.map((row) => row.owner_id)),
    listVideosByIds(videoIds),
    postIds.length
      ? supabase.from('post_likes').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
    currentUserId && postIds.length
      ? supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (likeRows.error && !isMissingRelationError(likeRows.error)) throw likeRows.error;
  if (likedRows.error && !isMissingRelationError(likedRows.error)) throw likedRows.error;

  const videoMap = new Map(videos.map((video) => [video.id, video]));
  const likeCounts = (((likeRows.data as { post_id?: string }[] | null) ?? [])).reduce(
    (counts, row) => {
      if (!row.post_id) return counts;
      counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
      return counts;
    },
    new Map<string, number>(),
  );
  const likedPostIds = new Set(
    (((likedRows.data as { post_id?: string }[] | null) ?? []))
      .map((row) => row.post_id)
      .filter((postId): postId is string => !!postId),
  );

  return rows.map<PostWithContent>((row) => ({
    ...row,
    owner_profile: ownerProfiles.get(row.owner_id) ?? null,
    video: row.video_id ? videoMap.get(row.video_id) ?? null : null,
    image_url: buildPostImageUrl(row.image_path),
    like_count: row.video_id ? 0 : likeCounts.get(row.id) ?? 0,
    is_liked: row.video_id ? false : likedPostIds.has(row.id),
    source: 'post',
  }));
}

function getInitialDemoTextPosts(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
): PostWithContent[] {
  const selfProfile = currentUserId
    ? getDemoProfileById(currentUserId, currentUserId, currentProfile)
    : null;
  const rubyProfile = getDemoProfileById('demo-player-ruby', currentUserId, currentProfile);

  return [
    {
      id: 'demo-post-self-signed',
      owner_id: currentUserId ?? 'demo-self',
      body:
        'Proud to share that I have joined Northbridge FC Academy for the spring showcase window. New chapter, same hunger.',
      video_id: null,
      image_path: null,
      created_at: new Date('2026-03-14T09:30:00.000Z').toISOString(),
      owner_profile: toOwnerProfile(selfProfile),
      video: null,
      image_url: null,
      like_count: 8,
      is_liked: false,
      source: 'post',
    },
    {
      id: 'demo-post-ruby-photo',
      owner_id: 'demo-player-ruby',
      body:
        'Recovery session after the showcase. Felt sharp in the final finishing block.',
      video_id: null,
      image_path: 'demo/ruby-recovery.jpg',
      created_at: new Date('2026-03-13T18:45:00.000Z').toISOString(),
      owner_profile: toOwnerProfile(rubyProfile),
      video: null,
      image_url:
        'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
      like_count: 21,
      is_liked: false,
      source: 'post',
    },
    {
      id: 'demo-post-ruby-selection',
      owner_id: 'demo-player-ruby',
      body:
        'Selected for the regional U17 camp this month. Grateful for the coaches and teammates pushing the standard every session.',
      video_id: null,
      image_path: null,
      created_at: new Date('2026-03-13T16:15:00.000Z').toISOString(),
      owner_profile: toOwnerProfile(rubyProfile),
      video: null,
      image_url: null,
      like_count: 14,
      is_liked: false,
      source: 'post',
    },
  ];
}

function listDemoPosts(
  currentUserId: string | undefined,
  currentProfile: Profile | null | undefined,
  limit: number,
  profileId?: string,
) {
  const initialPosts = getInitialDemoTextPosts(currentUserId, currentProfile);
  const createdPosts = currentUserId ? demoTextPosts.get(currentUserId) ?? [] : [];
  const textPosts = [...createdPosts, ...initialPosts].filter((post) =>
    profileId ? post.owner_id === profileId : true,
  ).map((post) => withDemoPostLikeState(post, currentUserId));
  const videos = profileId
    ? listDemoProfileVideos(profileId, currentUserId, currentProfile, limit)
    : listDemoFeedVideos(currentUserId, currentProfile, limit);

  return trimToLimit([...textPosts, ...videos.map(toVirtualVideoPost)], limit);
}

async function listStoredPosts(limit: number, profileId?: string) {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (profileId) {
    query = query.eq('owner_id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }

    throw error;
  }

  return buildPostsWithContent((data as Post[] | null) ?? []);
}

export async function listFeedPosts(limit = 20): Promise<PostWithContent[]> {
  if (DEMO_MODE_ENABLED) {
    const currentUserId = await getCurrentUserId();
    return listDemoPosts(currentUserId ?? undefined, getCurrentProfile(), limit);
  }

  const storedPosts = await listStoredPosts(limit);
  const videos = await listFeedVideos(limit);

  if (!storedPosts) {
    return videos.map(toVirtualVideoPost);
  }

  const linkedVideoIds = new Set(
    storedPosts.map((post) => post.video_id).filter((videoId): videoId is string => !!videoId),
  );
  const virtualVideoPosts = videos
    .filter((video) => !linkedVideoIds.has(video.id))
    .map(toVirtualVideoPost);

  return trimToLimit([...storedPosts, ...virtualVideoPosts], limit);
}

export async function listProfilePosts(profileId: string, limit = 20): Promise<PostWithContent[]> {
  if (DEMO_MODE_ENABLED) {
    const currentUserId = await getCurrentUserId();
    return listDemoPosts(currentUserId ?? undefined, getCurrentProfile(), limit, profileId);
  }

  const storedPosts = await listStoredPosts(limit, profileId);
  const videos = await listProfileVideos(profileId, limit);

  if (!storedPosts) {
    return videos.map(toVirtualVideoPost);
  }

  const linkedVideoIds = new Set(
    storedPosts.map((post) => post.video_id).filter((videoId): videoId is string => !!videoId),
  );
  const virtualVideoPosts = videos
    .filter((video) => !linkedVideoIds.has(video.id))
    .map(toVirtualVideoPost);

  return trimToLimit([...storedPosts, ...virtualVideoPosts], limit);
}

export async function createTextPost(body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('Write something before posting.');
  }

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('You must be signed in to create a post.');
  }

  if (DEMO_MODE_ENABLED) {
    const currentProfile = getCurrentProfile();
    const post: PostWithContent = {
      id: `demo-post-${Date.now()}`,
      owner_id: currentUserId,
      body: trimmedBody,
      video_id: null,
      image_path: null,
      created_at: new Date().toISOString(),
      owner_profile: toOwnerProfile(
        getDemoProfileById(currentUserId, currentUserId, currentProfile),
      ),
      video: null,
      image_url: null,
      like_count: 0,
      is_liked: false,
      source: 'post',
    };
    demoTextPosts.set(currentUserId, [post, ...(demoTextPosts.get(currentUserId) ?? [])]);
    return post;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      owner_id: currentUserId,
      body: trimmedBody,
      video_id: null,
    })
    .select('*')
    .single();

  if (error) throw error;

  const [post] = await buildPostsWithContent([data as Post]);
  return post ?? null;
}

export async function createImagePost(body: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('You must be signed in to create a post.');
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to upload an image.');
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.86,
  });

  if (pickerResult.canceled) {
    return null;
  }

  const asset = pickerResult.assets[0];
  const extension = getImageExtension(asset.uri, asset.mimeType);
  const filePath = `${currentUserId}/${Date.now()}.${extension}`;
  const response = await fetch(asset.uri);
  const imageBlob = await response.blob();
  const trimmedBody = body.trim();

  if (DEMO_MODE_ENABLED) {
    const currentProfile = getCurrentProfile();
    const post: PostWithContent = {
      id: `demo-post-${Date.now()}`,
      owner_id: currentUserId,
      body: trimmedBody ? trimmedBody : null,
      video_id: null,
      image_path: filePath,
      created_at: new Date().toISOString(),
      owner_profile: toOwnerProfile(
        getDemoProfileById(currentUserId, currentUserId, currentProfile),
      ),
      video: null,
      image_url: asset.uri,
      like_count: 0,
      is_liked: false,
      source: 'post',
    };
    demoTextPosts.set(currentUserId, [post, ...(demoTextPosts.get(currentUserId) ?? [])]);
    return post;
  }

  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(filePath, imageBlob, {
      contentType: asset.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('posts')
    .insert({
      owner_id: currentUserId,
      body: trimmedBody ? trimmedBody : null,
      video_id: null,
      image_path: filePath,
    })
    .select('*')
    .single();

  if (error) throw error;

  const [post] = await buildPostsWithContent([data as Post]);
  return post ?? null;
}

export async function createVideoAttachmentPost(videoId: string, body: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('You must be signed in to create a post.');
  }

  if (DEMO_MODE_ENABLED) {
    return null;
  }

  const trimmedBody = body.trim();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      owner_id: currentUserId,
      body: trimmedBody ? trimmedBody : null,
      video_id: videoId,
      image_path: null,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }

    throw error;
  }

  const [post] = await buildPostsWithContent([data as Post]);
  return post ?? null;
}

export async function isPostLiked(postId: string, userId: string | undefined): Promise<boolean> {
  if (!userId || !isRealPostId(postId)) return false;

  if (DEMO_MODE_ENABLED && postId.startsWith('demo-post-')) {
    return ensureDemoPostLikeSet(userId).has(postId);
  }

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return false;
    throw error;
  }

  return !!data;
}

export async function likePost(postId: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('You must be signed in to like a post.');
  }

  if (!isRealPostId(postId)) {
    throw new Error('Video posts use video likes.');
  }

  if (DEMO_MODE_ENABLED && postId.startsWith('demo-post-')) {
    ensureDemoPostLikeSet(currentUserId).add(postId);
    return;
  }

  const { error } = await supabase.from('post_likes').upsert(
    {
      post_id: postId,
      user_id: currentUserId,
    },
    { onConflict: 'post_id,user_id' },
  );

  if (error) throw error;
}

export async function unlikePost(postId: string) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('You must be signed in to unlike a post.');
  }

  if (!isRealPostId(postId)) {
    throw new Error('Video posts use video likes.');
  }

  if (DEMO_MODE_ENABLED && postId.startsWith('demo-post-')) {
    ensureDemoPostLikeSet(currentUserId).delete(postId);
    return;
  }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', currentUserId);

  if (error) throw error;
}
