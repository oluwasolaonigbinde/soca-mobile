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
  created_at: string;
  updated_at: string;
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

export interface ProfileWithCounts extends Profile {
  follower_count: number;
  following_count: number;
  profile_views_count: number;
}
