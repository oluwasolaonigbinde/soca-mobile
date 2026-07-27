import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';
import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

export type ProfileStatus = 'loading' | 'missing' | 'ready' | 'error';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  authLoaded: boolean;
  profileCreationAttempted: boolean;
  pendingEmailVerification: boolean;
  loading: boolean;

  initialize: () => Promise<void>;
  dispose: () => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (data: {
    display_name: string;
    location: string;
    bio?: string | null;
    position?: string | null;
    birth_year?: number | null;
  }) => Promise<void>;
  retryProfileCreation: () => Promise<void>;
}

// Module-level guards so initialize() is idempotent across fast-refresh /
// double-mounts and the auth listener subscription is disposable on unmount.
let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  profileStatus: 'loading',
  authLoaded: false,
  profileCreationAttempted: false,
  pendingEmailVerification: false,
  loading: false,

  initialize: async () => {
    if (authInitialized) return;
    authInitialized = true;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session });

      if (session?.user) {
        set({ profileStatus: 'loading' });
        await get().fetchProfile();
      } else {
        set({ profileStatus: 'ready', profile: null });
      }
    } catch {
      set({ profileStatus: 'error' });
    } finally {
      set({ authLoaded: true });
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, pendingEmailVerification: false });
      if (session?.user) {
        set({ profileCreationAttempted: false, profileStatus: 'loading' });
        void Promise.resolve()
          .then(() => get().fetchProfile())
          .catch(() => {
            // fetchProfile sets profileStatus before throwing.
          });
      } else {
        set({
          profile: null,
          profileStatus: 'ready',
          profileCreationAttempted: false,
        });
      }
    });
    authSubscription = data.subscription;
  },

  dispose: () => {
    authSubscription?.unsubscribe();
    authSubscription = null;
    authInitialized = false;
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, pendingEmailVerification: false });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName ?? '' },
          ...(typeof window !== 'undefined' && window.location?.origin
            ? { emailRedirectTo: `${window.location.origin}/auth/callback` }
            : {}),
        },
      });
      if (error) throw error;

      if (data.session) {
        set({ session: data.session, pendingEmailVerification: false, profileStatus: 'loading' });
        await get().fetchProfile();
      } else if (data.user) {
        set({ pendingEmailVerification: true });
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
      set({ session: data.session, pendingEmailVerification: false, profileStatus: 'loading' });
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
      set({
        session: null,
        profile: null,
        profileStatus: 'ready',
        profileCreationAttempted: false,
        pendingEmailVerification: false,
      });
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
    if (!session?.user) {
      set({ profile: null, profileStatus: 'ready' });
      return;
    }

    const { profileCreationAttempted } = get();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      set({ profileStatus: 'error' });
      throw error;
    }

    if (error?.code === 'PGRST116') {
      if (profileCreationAttempted) {
        set({ profileStatus: 'error', profile: null });
        return;
      }

      set({ profileCreationAttempted: true });

      const now = new Date().toISOString();
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: session.user.id,
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        set({ profileStatus: 'error', profile: null });
        throw upsertError;
      }

      const { data: refetchData, error: refetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (refetchError?.code === 'PGRST116' || !refetchData) {
        set({ profileStatus: 'error', profile: null });
        return;
      }

      set({ profile: refetchData as Profile, profileStatus: 'ready' });
      return;
    }

    set({ profile: (data as Profile) ?? null, profileStatus: 'ready' });
  },

  retryProfileCreation: async () => {
    set({ profileCreationAttempted: false, profileStatus: 'loading' });
    await get().fetchProfile();
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

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No auth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (!result || result.type !== 'success' || !result.url) {
        // User cancelled or the OS dismissed the auth session — surface so the
        // caller can show feedback instead of silently doing nothing.
        if (result?.type === 'cancel' || result?.type === 'dismiss') return;
        throw new Error('Google sign-in did not complete.');
      }

      const hash = result.url.split('#')[1];
      const params = new URLSearchParams(hash ?? '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        throw new Error('Google sign-in returned no tokens.');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      const { data: sessionData } = await supabase.auth.getSession();
      set({ session: sessionData.session, profileStatus: 'loading' });
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async ({
    display_name,
    location,
    bio,
    position,
    birth_year,
  }) => {
    set({ loading: true });
    try {
      const session = get().session;
      if (!session?.user) throw new Error('Not authenticated');

      const updates: Record<string, unknown> = {
        display_name,
        location,
        updated_at: new Date().toISOString(),
      };
      if (bio !== undefined) updates.bio = bio;
      if (position !== undefined) updates.position = position;
      if (birth_year !== undefined) updates.birth_year = birth_year;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },
}));
