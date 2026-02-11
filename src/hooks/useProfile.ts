import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Profile } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as Profile) ?? null;
    },
    enabled: !!userId,
  });
}
