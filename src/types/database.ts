export type UserRole = 'player' | 'scout' | 'club' | 'org';

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  verified: boolean | null;
  verified_at: string | null;
  /** Discovery: playing position (e.g. striker, midfielder). */
  position: string | null;
  /** Discovery: year of birth; age can be derived. */
  birth_year: number | null;
  created_at: string;
  updated_at: string;
}

/** Allowed entity types for featured_items. */
export type FeaturedItemType = 'profile' | 'video' | 'challenge' | 'event';

export interface FeaturedItem {
  id: string;
  item_type: FeaturedItemType;
  item_id: string;
  section: string;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  followee_id: string;
  created_at: string;
}

export interface ProfileView {
  id: string;
  viewer_id: string | null;
  profile_id: string;
  created_at: string;
}

export interface Video {
  id: string;
  owner_id: string;
  storage_path: string;
  caption: string | null;
  duration: number | null;
  created_at: string;
}

export interface VideoLike {
  video_id: string;
  user_id: string;
  created_at: string;
}

export interface VideoView {
  id: string;
  video_id: string;
  viewer_id: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  owner_id: string;
  body: string | null;
  video_id: string | null;
  image_path: string | null;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  month: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by_admin: string | null;
  created_at: string;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  video_id: string;
  admin_score: number | null;
  created_at: string;
}

export interface ProfileAchievement {
  id: string;
  profile_id: string;
  challenge_id: string | null;
  event_id: string | null;
  title: string;
  description: string | null;
  awarded_at: string;
  created_by_admin: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  description: string | null;
  organizer_id: string | null;
  created_at: string;
}

export interface EventInterest {
  event_id: string;
  user_id: string;
  created_at: string;
}

export type ReportContentType = 'profile' | 'video';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  content_type: ReportContentType;
  content_id: string;
  reason: string;
  status: ReportStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface VideoWithCounts extends Video {
  like_count: number;
  view_count: number;
  owner_profile: Pick<Profile, 'id' | 'display_name' | 'full_name' | 'avatar_url' | 'role'> | null;
  playback_url: string;
}

export interface PostWithContent extends Post {
  owner_profile: Pick<Profile, 'id' | 'display_name' | 'full_name' | 'avatar_url' | 'role'> | null;
  video: VideoWithCounts | null;
  image_url: string | null;
  like_count: number;
  is_liked: boolean;
  source: 'post' | 'video';
}

export interface ProfileWithCounts extends Profile {
  follower_count: number;
  following_count: number;
  profile_views_count: number;
  achievements?: ProfileAchievement[];
}

export type ProfilePreview = Pick<
  Profile,
  'id' | 'display_name' | 'full_name' | 'avatar_url' | 'role'
>;

export interface ConversationSummary extends Conversation {
  other_profile: ProfilePreview | null;
  last_message_text: string | null;
  unread_count: number;
}

export interface ConversationThread {
  conversation: Conversation;
  other_profile: ProfilePreview | null;
  messages: Message[];
  unread_count: number;
}
