import {
  canSubmitChallengeVideos,
  canUploadHighlights,
  getRoleHome,
} from '@/lib/roles';

describe('role capabilities', () => {
  it('maps roles to their home routes', () => {
    expect(getRoleHome('player')).toBe('/(player)/home');
    expect(getRoleHome('scout')).toBe('/(scout)/home');
  });

  it('keeps highlight publishing player-only', () => {
    expect(canUploadHighlights('player')).toBe(true);
    expect(canUploadHighlights('club')).toBe(false);
    expect(canSubmitChallengeVideos('player')).toBe(true);
    expect(canSubmitChallengeVideos('org')).toBe(false);
  });
});
