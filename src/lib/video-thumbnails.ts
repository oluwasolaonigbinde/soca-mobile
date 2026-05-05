const FOOTBALL_THUMBNAIL_URIS = [
  'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
] as const;

export interface VideoThumbnailOptions {
  videoId: string;
  caption?: string | null;
  thumbnailUrl?: string | null;
}

export function getVideoThumbnailUri({
  videoId,
  caption,
  thumbnailUrl,
}: VideoThumbnailOptions) {
  const realThumbnail = sanitizeImageUrl(thumbnailUrl);
  if (realThumbnail) {
    return realThumbnail;
  }

  return getFallbackFootballThumbnail(videoId, caption);
}

export function getFallbackFootballThumbnail(videoId: string, caption?: string | null) {
  const key = `${videoId}:${caption?.trim().toLowerCase() ?? ''}`;
  const hash = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);
  const index = hash % FOOTBALL_THUMBNAIL_URIS.length;
  return FOOTBALL_THUMBNAIL_URIS[index];
}

function sanitizeImageUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
