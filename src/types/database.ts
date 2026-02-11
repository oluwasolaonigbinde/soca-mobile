export type UserRole = 'player' | 'scout' | 'club';

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
