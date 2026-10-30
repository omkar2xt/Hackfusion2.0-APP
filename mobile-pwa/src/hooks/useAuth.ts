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
  demoSignIn: (role?: 'student' | 'admin') => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

const DEMO_STUDENT: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@campus.edu',
  full_name: 'Alex Rivera (Campus Student)',
  avatar_url: '',
  campus: 'Main University Campus',
  role: 'student',
  created_at: new Date().toISOString(),
};

const DEMO_ADMIN: User = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'security.admin@campus.edu',
  full_name: 'Officer Jordan Vance (Security Admin)',
  avatar_url: '',
  campus: 'Main University Campus',
  role: 'security_admin',
  created_at: new Date().toISOString(),
};

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
    campus: (supaUser.user_metadata?.campus as string) || 'Main Campus',
    role: (supaUser.user_metadata?.role as string) || 'student',
    created_at: supaUser.created_at,
  };
}

function storeToken(session: Session | null, demoUser?: User | null): void {
  if (session) {
    localStorage.setItem(
      'sb-auth-token',
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    );
  } else if (demoUser) {
    localStorage.setItem(
      'sb-auth-token',
      JSON.stringify({
        access_token: 'demo-jwt-token-campus-valid',
        refresh_token: 'demo-refresh-token',
        user: demoUser,
      })
    );
  } else {
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('signalsafe_demo_user');
  }
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(() => {
    // Check if there is already a demo user stored
    try {
      const stored = localStorage.getItem('signalsafe_demo_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { user: parsed, session: null, loading: false };
      }
    } catch {
      // ignore
    }
    return { user: null, session: null, loading: true };
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            storeToken(session);
            setState({
              user: mapSupabaseUser(session.user),
              session,
              loading: false,
            });
          } else {
            // Check for local demo user
            const storedDemo = localStorage.getItem('signalsafe_demo_user');
            if (storedDemo) {
              const demo = JSON.parse(storedDemo);
              setState({ user: demo, session: null, loading: false });
            } else {
              setState({ user: null, session: null, loading: false });
            }
          }
        }
      } catch {
        if (mounted) {
          const storedDemo = localStorage.getItem('signalsafe_demo_user');
          if (storedDemo) {
            try {
              const demo = JSON.parse(storedDemo);
              setState({ user: demo, session: null, loading: false });
              return;
            } catch {
              // ignore
            }
          }
          setState({ user: null, session: null, loading: false });
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) {
          storeToken(session);
          setState({
            user: session.user ? mapSupabaseUser(session.user) : null,
            session,
            loading: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const demoSignIn = useCallback(async (role: 'student' | 'admin' = 'student'): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    const selectedUser = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    localStorage.setItem('signalsafe_demo_user', JSON.stringify(selectedUser));
    storeToken(null, selectedUser);
    setState({
      user: selectedUser,
      session: null,
      loading: false,
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If Supabase project URL is placeholder or network failed, fallback gracefully to demo campus user
        if (error.message.includes('fetch') || error.message.includes('Failed') || error.status === 0) {
          console.warn('[SignalSafe Auth] Supabase unreachable; signing in with local campus account.');
          const fallbackUser: User = {
            ...DEMO_STUDENT,
            email,
            full_name: email.split('@')[0].replace('.', ' ').toUpperCase(),
          };
          localStorage.setItem('signalsafe_demo_user', JSON.stringify(fallbackUser));
          storeToken(null, fallbackUser);
          setState({ user: fallbackUser, session: null, loading: false });
          return;
        }
        setState((prev) => ({ ...prev, loading: false }));
        throw error as AuthError;
      }
      if (data?.session?.user) {
        storeToken(data.session);
        setState({
          user: mapSupabaseUser(data.session.user),
          session: data.session,
          loading: false,
        });
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('fetch') || err.message.includes('Failed') || err.name === 'TypeError')) {
        console.warn('[SignalSafe Auth] Network fallback to local campus student session.');
        const fallbackUser: User = {
          ...DEMO_STUDENT,
          email,
          full_name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        };
        localStorage.setItem('signalsafe_demo_user', JSON.stringify(fallbackUser));
        storeToken(null, fallbackUser);
        setState({ user: fallbackUser, session: null, loading: false });
        return;
      }
      setState((prev) => ({ ...prev, loading: false }));
      throw err;
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) {
          // If Supabase project URL is placeholder or network failed, fallback gracefully
          if (error.message.includes('fetch') || error.message.includes('Failed') || error.status === 0) {
            console.warn('[SignalSafe Auth] Supabase unreachable; creating local campus account.');
            const newUser: User = {
              id: `user_${Date.now()}`,
              email,
              full_name: fullName,
              avatar_url: '',
              campus: 'Main University Campus',
              role: 'student',
              created_at: new Date().toISOString(),
            };
            localStorage.setItem('signalsafe_demo_user', JSON.stringify(newUser));
            storeToken(null, newUser);
            setState({ user: newUser, session: null, loading: false });
            return;
          }
          setState((prev) => ({ ...prev, loading: false }));
          throw error as AuthError;
        }
        if (data?.session?.user) {
          storeToken(data.session);
          setState({
            user: mapSupabaseUser(data.session.user),
            session: data.session,
            loading: false,
          });
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('fetch') || err.message.includes('Failed') || err.name === 'TypeError')) {
          const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            full_name: fullName,
            avatar_url: '',
            campus: 'Main University Campus',
            role: 'student',
            created_at: new Date().toISOString(),
          };
          localStorage.setItem('signalsafe_demo_user', JSON.stringify(newUser));
          storeToken(null, newUser);
          setState({ user: newUser, session: null, loading: false });
          return;
        }
        setState((prev) => ({ ...prev, loading: false }));
        throw err;
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    storeToken(null);
    setState({ user: null, session: null, loading: false });
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // ignore in offline/demo mode
    }
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    demoSignIn,
  };
}
