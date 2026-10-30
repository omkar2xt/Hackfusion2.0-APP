import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '../types';
import type { Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

function mapSupabaseUser(supaUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  created_at: string;
}): User {
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    full_name: (supaUser.user_metadata?.full_name as string) || '',
    avatar_url: (supaUser.user_metadata?.avatar_url as string) || '',
    campus: (supaUser.user_metadata?.campus as string) || '',
    role: (supaUser.user_metadata?.role as string) || 'student',
    created_at: supaUser.created_at,
  };
}

function storeToken(session: Session | null): void {
  if (session) {
    localStorage.setItem(
      'sb-auth-token',
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    );
  } else {
    localStorage.removeItem('sb-auth-token');
  }
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          storeToken(session);
          setState({
            user: session?.user ? mapSupabaseUser(session.user) : null,
            session,
            loading: false,
          });
        }
      } catch {
        if (mounted) {
          setState({ user: null, session: null, loading: false });
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        storeToken(session);
        setState({
          user: session?.user ? mapSupabaseUser(session.user) : null,
          session,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error as AuthError;
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        setState((prev) => ({ ...prev, loading: false }));
        throw error as AuthError;
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    storeToken(null);
    if (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error as AuthError;
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw error as AuthError;
    }
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
