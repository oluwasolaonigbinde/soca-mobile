import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  initialized: boolean;
  loading: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session });

      if (session?.user) {
        await get().fetchProfile();
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      set({ initialized: true });
    }

    // Subscribe to future auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        const current = get().profile;
        if (!current || current.id !== session.user.id) {
          await get().fetchProfile();
        }
      } else {
        set({ profile: null });
      }
    });
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName ?? '' } },
      });
      if (error) throw error;

      // If email confirmation is disabled, a session is returned immediately.
      // The profiles row is auto-created by the DB trigger (handle_new_user).
      if (data.session) {
        set({ session: data.session });
        await get().fetchProfile();
      }
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ session: data.session });
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },

  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    set({ session: data.session });
  },

  fetchProfile: async () => {
    const session = get().session;
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // PGRST116 = "no rows returned" — user signed up but profile not yet created
    if (error && error.code !== 'PGRST116') throw error;
    set({ profile: (data as Profile) ?? null });
  },

  updateRole: async (role) => {
    set({ loading: true });
    try {
      const session = get().session;
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', session.user.id);

      if (error) throw error;
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },
}));
