import {
  getFallbackFootballThumbnail,
  getVideoThumbnailUri,
} from '@/lib/video-thumbnails';

describe('video thumbnail helpers', () => {
  it('returns a provided thumbnail before using football fallbacks', () => {
    expect(
      getVideoThumbnailUri({
        videoId: 'video-1',
        caption: 'Top bins finish',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      }),
    ).toBe('https://example.com/thumb.jpg');
  });

  it('selects a deterministic football fallback per video key', () => {
    const first = getFallbackFootballThumbnail('video-9', 'Late winner');
    const second = getFallbackFootballThumbnail('video-9', 'Late winner');
    const third = getFallbackFootballThumbnail('video-10', 'Late winner');

    expect(first).toBe(second);
    expect(typeof first).toBe('string');
    expect(third).not.toBe('');
  });
});
