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
  const fetchUserProfile = useCallback(async (authUser: User): Promise<AuthUser> => {
    type ProfileData = {
      role: UserRole;
      name: string;
    };

    const { data, error } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      return {
        ...authUser,
        role: undefined,
        name: undefined,
      };
    }

    const profile = data as ProfileData;

    return {
      ...authUser,
      role: profile.role,
      name: profile.name,
    };
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
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
