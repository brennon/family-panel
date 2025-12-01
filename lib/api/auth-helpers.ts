/**
 * Authentication helpers for API routes
 * Provides common authentication and authorization utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * User profile with role information
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'kid';
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Get authenticated user and their profile from Supabase
 * Verifies the user has a valid session and retrieves their role
 *
 * @param supabase - Supabase client instance
 * @returns AuthResult with user profile or error message
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient<Database>
): Promise<AuthResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Authentication required' };
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, error: 'User profile not found' };
  }

  return { user: profile as AuthenticatedUser, error: null };
}

/**
 * Verify user is a parent
 * Returns true if user has parent role, false otherwise
 *
 * @param user - Authenticated user profile
 * @returns true if user is a parent
 */
export function isParent(user: AuthenticatedUser | null): boolean {
  return user?.role === 'parent';
}

/**
 * Verify user is a kid
 * Returns true if user has kid role, false otherwise
 *
 * @param user - Authenticated user profile
 * @returns true if user is a kid
 */
export function isKid(user: AuthenticatedUser | null): boolean {
  return user?.role === 'kid';
}
