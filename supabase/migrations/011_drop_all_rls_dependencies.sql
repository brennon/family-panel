-- Family Panel - Drop ALL RLS Dependencies
-- Migration: 011
-- Description: Remove all policies using helper functions across all tables, then drop the functions
--
-- Problem: get_user_role() and is_parent() functions are used by policies across multiple tables.
-- Cannot drop functions until all dependent policies are removed.
--
-- Solution: Drop all dependent policies across all tables, then drop functions, then recreate
-- minimal policies without circular dependencies.

-- ============================================================================
-- 1. Drop ALL policies that depend on get_user_role() or is_parent()
-- ============================================================================

-- USERS table policies
DROP POLICY IF EXISTS "Kids can update their own profile" ON users;
DROP POLICY IF EXISTS "Kids can view their own profile" ON users;
DROP POLICY IF EXISTS "Parents can create users" ON users;
DROP POLICY IF EXISTS "Parents can delete users" ON users;
DROP POLICY IF EXISTS "Parents can view all users" ON users;
DROP POLICY IF EXISTS "Parents can update users" ON users;

-- CHORE_ASSIGNMENTS table policies (from migration 002)
DROP POLICY IF EXISTS "Parents can view all chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Kids can view their own chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Parents can create chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Parents can update chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Kids can complete their own chores" ON chore_assignments;
DROP POLICY IF EXISTS "Parents can delete chore assignments" ON chore_assignments;

-- INCENTIVE_LOGS table policies (from migration 002)
DROP POLICY IF EXISTS "Parents can view all incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Kids can view their own incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Parents can create incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Kids can create their own incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Parents can update incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Parents can delete incentive logs" ON incentive_logs;

-- SCREEN_TIME_SESSIONS table policies (from migration 002)
DROP POLICY IF EXISTS "Parents can view all screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Kids can view their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Parents can create screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Kids can create their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Parents can update screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Kids can update their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Parents can delete screen time sessions" ON screen_time_sessions;

-- CHORES table policies (from migration 002)
DROP POLICY IF EXISTS "Anyone authenticated can view chores" ON chores;
DROP POLICY IF EXISTS "Parents can create chores" ON chores;
DROP POLICY IF EXISTS "Parents can update chores" ON chores;
DROP POLICY IF EXISTS "Parents can delete chores" ON chores;

-- INCENTIVE_TYPES table policies (from migration 002)
DROP POLICY IF EXISTS "Anyone authenticated can view incentive types" ON incentive_types;
DROP POLICY IF EXISTS "Parents can create incentive types" ON incentive_types;
DROP POLICY IF EXISTS "Parents can update incentive types" ON incentive_types;
DROP POLICY IF EXISTS "Parents can delete incentive types" ON incentive_types;

-- ============================================================================
-- 2. Now we can safely drop the helper functions
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS is_parent(UUID);

-- ============================================================================
-- 3. Recreate USERS table policies without circular dependencies
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
-- 4. Recreate OTHER table policies without helper functions
-- ============================================================================

-- CHORES: Everyone can view, no modification for now (parent features via RPC later)
CREATE POLICY "Anyone authenticated can view chores"
    ON chores FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- CHORE_ASSIGNMENTS: Users can only view/update their own assignments
CREATE POLICY "Users can view their own chore assignments"
    ON chore_assignments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chore assignments"
    ON chore_assignments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- INCENTIVE_TYPES: Everyone can view
CREATE POLICY "Anyone authenticated can view incentive types"
    ON incentive_types FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INCENTIVE_LOGS: Users can view/create their own logs
CREATE POLICY "Users can view their own incentive logs"
    ON incentive_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incentive logs"
    ON incentive_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- SCREEN_TIME_SESSIONS: Users can manage their own sessions
CREATE POLICY "Users can view their own screen time sessions"
    ON screen_time_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screen time sessions"
    ON screen_time_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screen time sessions"
    ON screen_time_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Note: Parent-specific permissions (create/update/delete chores, manage other
-- users' data, etc.) will be implemented via RPC functions with SECURITY DEFINER.
-- ============================================================================
