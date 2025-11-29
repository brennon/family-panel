'use client';

/**
 * Auth Context Provider
 * Manages authentication state and provides user session information
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/supabase/types';

interface AuthUser extends User {
  role?: UserRole;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPin: (userId: string, pin: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile data including role
  const fetchUserProfile = useCallback(async (authUser: User, retries = 2): Promise<AuthUser> => {
    type ProfileData = {
      role: UserRole;
      name: string;
    };

    try {
      console.log('[Auth] Fetching profile for user:', authUser.id);
      const startTime = Date.now();

      // 5 second timeout for profile fetch
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 5s')), 5000);
      });

      const queryPromise = supabase
        .from('users')
        .select('role, name')
        .eq('id', authUser.id)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;

      const elapsed = Date.now() - startTime;
      console.log(`[Auth] Profile fetch completed in ${elapsed}ms`);

      if (error) {
        console.error('[Auth] Supabase error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No profile data returned');
      }

      const profile = data as ProfileData;
      console.log('[Auth] Profile loaded:', { role: profile.role, name: profile.name });

      return {
        ...authUser,
        role: profile.role,
        name: profile.name,
      };
    } catch (error) {
      console.error(`[Auth] Error fetching user profile (${retries} retries left):`, error);

      // Retry if we have retries left
      if (retries > 0) {
        console.log(`[Auth] Retrying profile fetch in 200ms...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        return fetchUserProfile(authUser, retries - 1);
      }

      // Final fallback: return user without profile data
      console.warn('[Auth] Failed to fetch user profile after retries, using fallback');
      return {
        ...authUser,
        role: undefined,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      };
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    // Set a timeout to prevent infinite loading state
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timed out after 10s');
        setLoading(false);
      }
    }, 10000);

    // Listen for auth changes - this is the primary way to get session after refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);
        if (!mounted) return;

        // Only handle INITIAL_SESSION for the first load, ignore early SIGNED_IN
        if (!isInitialized) {
          if (event !== 'INITIAL_SESSION') {
            console.log('[Auth] Ignoring', event, 'during initialization');
            return;
          }
          isInitialized = true;
        }

        if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userWithProfile);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, supabase.auth]);

  // Sign in with email/password (for parents)
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const userWithProfile = await fetchUserProfile(data.user);
        setUser(userWithProfile);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with PIN (for kids)
  const signInWithPin = async (userId: string, pin: string) => {
    try {
      // Call API route to validate PIN and get session tokens
      const response = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'PIN login failed') };
      }

      // Verify the magic link token to create a session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'magiclink',
      });

      if (verifyError) {
        console.error('Token verification error:', verifyError);
        return { error: verifyError };
      }

      // Session will be automatically picked up by onAuthStateChange listener
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Refresh user data
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userWithProfile = await fetchUserProfile(session.user);
      setUser(userWithProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithPin,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
