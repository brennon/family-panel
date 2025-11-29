-- Family Panel - Cleanup RLS Policies
-- Migration: 010
-- Description: Remove ALL policies with circular dependencies and keep only simple auth.uid() checks
--
-- Problem: Migrations 008 and 009 didn't fully clean up the original policies from migration 002.
-- The database still has policies using get_user_role() and is_parent() helper functions which
-- cause infinite recursion when querying the users table.
--
-- Solution: Drop ALL existing policies and helper functions, then create only the minimal
-- policies needed for users to manage their own profiles.

-- ============================================================================
-- 1. Drop ALL existing policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Kids can update their own profile" ON users;
DROP POLICY IF EXISTS "Kids can view their own profile" ON users;
DROP POLICY IF EXISTS "Parents can create users" ON users;
DROP POLICY IF EXISTS "Parents can delete users" ON users;
DROP POLICY IF EXISTS "Parents can view all users" ON users;
DROP POLICY IF EXISTS "Parents can update users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ============================================================================
-- 2. Drop helper functions that cause circular dependencies
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS is_parent(UUID);

-- ============================================================================
-- 3. Create minimal policies with NO subqueries on users table
-- ============================================================================

-- Users can read their own profile (no role check, no subqueries)
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (no role check, no subqueries)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- Note: Parent-specific permissions (view all users, create users, etc.)
-- will need to be implemented via RPC functions with SECURITY DEFINER.
-- This ensures no circular dependency during RLS evaluation.
-- ============================================================================
