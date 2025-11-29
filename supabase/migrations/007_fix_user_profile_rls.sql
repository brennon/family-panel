-- Family Panel - Fix User Profile RLS Policy
-- Migration: 007
-- Description: Add policy allowing users to read their own profile without circular dependency
--
-- Problem: Existing policies use helper functions that query the users table,
-- creating a circular dependency when a user tries to read their own profile.
-- Solution: Add a direct policy that allows any authenticated user to read their own record.

-- Add policy for users to read their own profile (highest priority, no function calls)
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Note: This policy will be evaluated alongside the existing "Parents can view all users"
-- and "Kids can view their own profile" policies. Multiple policies combine with OR logic,
-- so this simpler policy will succeed immediately for own-profile reads without needing
-- to call is_parent() or get_user_role() functions.
