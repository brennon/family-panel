-- Family Panel - Fix RLS Circular Dependency
-- Migration: 008
-- Description: Remove helper functions that cause circular dependencies in RLS policies
--
-- Problem: Helper functions is_parent() and get_user_role() query the users table,
-- which triggers RLS evaluation, which calls the helper functions again = deadlock/timeout.
--
-- Solution: Drop the existing policies that use helper functions and recreate them
-- with direct queries or simpler logic.

-- ============================================================================
-- 1. Drop problematic helper functions
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS is_parent(UUID);

-- ============================================================================
-- 2. Drop and recreate USERS table policies without helper functions
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can view all users" ON users;
DROP POLICY IF EXISTS "Kids can view their own profile" ON users;
DROP POLICY IF EXISTS "Parents can update users" ON users;
DROP POLICY IF EXISTS "Kids can update their own profile" ON users;

-- Recreate policies with direct checks (no function calls)
-- Note: "Users can read own profile" from migration 007 stays as-is

-- Parents can view all users (check role directly in subquery)
CREATE POLICY "Parents can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users AS parent_check
            WHERE parent_check.id = auth.uid()
            AND parent_check.role = 'parent'
        )
    );

-- Parents can update any user
CREATE POLICY "Parents can update users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users AS parent_check
            WHERE parent_check.id = auth.uid()
            AND parent_check.role = 'parent'
        )
    );

-- Users can update their own profile (simpler than separate kid/parent policies)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================================
-- 3. Update OTHER table policies to not use helper functions
-- ============================================================================

-- CHORE ASSIGNMENTS
DROP POLICY IF EXISTS "Kids can view their own chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Kids can complete their own chores" ON chore_assignments;

CREATE POLICY "Kids can view their own chore assignments"
    ON chore_assignments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Kids can complete their own chores"
    ON chore_assignments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- INCENTIVE LOGS
DROP POLICY IF EXISTS "Kids can view their own incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Kids can create their own incentive logs" ON incentive_logs;

CREATE POLICY "Kids can view their own incentive logs"
    ON incentive_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Kids can create their own incentive logs"
    ON incentive_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- SCREEN TIME SESSIONS
DROP POLICY IF EXISTS "Kids can view their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Kids can create their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Kids can update their own screen time sessions" ON screen_time_sessions;

CREATE POLICY "Kids can view their own screen time sessions"
    ON screen_time_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Kids can create their own screen time sessions"
    ON screen_time_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kids can update their own screen time sessions"
    ON screen_time_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. Keep parent policies that use EXISTS subqueries (these work fine)
-- ============================================================================

-- Note: Policies for parents that use EXISTS subqueries are kept as-is.
-- The key difference is they don't call helper functions, they just check
-- the role directly in a subquery which is evaluated efficiently.
