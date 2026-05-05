export function buildAvatarImageUri(
  uri: string | null | undefined,
  cacheKey?: string | number | null,
) {
  if (!uri) return null;
  if (cacheKey === null || cacheKey === undefined || cacheKey === '') {
    return uri;
  }

  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}
