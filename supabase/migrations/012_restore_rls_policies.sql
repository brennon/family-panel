-- Family Panel - Restore RLS Policies
-- Migration: 012
-- Description: Restore comprehensive RLS policies that were incorrectly removed in migrations 007-011
--
-- CRITICAL CONTEXT:
-- Migrations 007-011 removed RLS policies under the mistaken belief they were causing E2E test timeouts.
-- The real issues were:
--   1. Missing cookie handlers in lib/supabase/client.ts (couldn't read session cookies)
--   2. Premature SIGNED_IN event firing before client initialization in lib/auth/context.tsx
--
-- These were fixed in commit 0921f85: "fix(auth): ignore early SIGNED_IN event during initialization"
--
-- The RLS policies with helper functions were NOT the problem and must be restored for production security.
--
-- This migration restores the original RLS security model from migration 002.

-- ============================================================================
-- 1. Drop the minimal policies created in migration 011
-- ============================================================================

-- USERS table policies (from migration 011)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- CHORES table policies (from migration 011)
DROP POLICY IF EXISTS "Anyone authenticated can view chores" ON chores;

-- CHORE_ASSIGNMENTS table policies (from migration 011)
DROP POLICY IF EXISTS "Users can view their own chore assignments" ON chore_assignments;
DROP POLICY IF EXISTS "Users can update their own chore assignments" ON chore_assignments;

-- INCENTIVE_TYPES table policies (from migration 011)
DROP POLICY IF EXISTS "Anyone authenticated can view incentive types" ON incentive_types;

-- INCENTIVE_LOGS table policies (from migration 011)
DROP POLICY IF EXISTS "Users can view their own incentive logs" ON incentive_logs;
DROP POLICY IF EXISTS "Users can create their own incentive logs" ON incentive_logs;

-- SCREEN_TIME_SESSIONS table policies (from migration 011)
DROP POLICY IF EXISTS "Users can view their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Users can create their own screen time sessions" ON screen_time_sessions;
DROP POLICY IF EXISTS "Users can update their own screen time sessions" ON screen_time_sessions;

-- ============================================================================
-- 2. Restore helper functions (originally from migration 002)
-- ============================================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if current user is a parent
CREATE OR REPLACE FUNCTION is_parent(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user_id AND role = 'parent');
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- 3. Restore USERS table policies (originally from migration 002)
-- ============================================================================

-- Parents can view all users
CREATE POLICY "Parents can view all users"
    ON users FOR SELECT
    USING (is_parent(auth.uid()));

-- Kids can only view their own profile
CREATE POLICY "Kids can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id AND get_user_role(id) = 'kid');

-- Parents can insert users (create new accounts)
CREATE POLICY "Parents can create users"
    ON users FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Parents can update any user
CREATE POLICY "Parents can update users"
    ON users FOR UPDATE
    USING (is_parent(auth.uid()));

-- Kids can update their own profile (limited fields would be enforced at app level)
CREATE POLICY "Kids can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id AND get_user_role(id) = 'kid');

-- Only parents can delete users
CREATE POLICY "Parents can delete users"
    ON users FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- 4. Restore CHORES table policies (originally from migration 002)
-- ============================================================================

-- Everyone can view chores
CREATE POLICY "Anyone authenticated can view chores"
    ON chores FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only parents can create chores
CREATE POLICY "Parents can create chores"
    ON chores FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Only parents can update chores
CREATE POLICY "Parents can update chores"
    ON chores FOR UPDATE
    USING (is_parent(auth.uid()));

-- Only parents can delete chores
CREATE POLICY "Parents can delete chores"
    ON chores FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- 5. Restore CHORE ASSIGNMENTS table policies (originally from migration 002)
-- ============================================================================

-- Parents can view all chore assignments
CREATE POLICY "Parents can view all chore assignments"
    ON chore_assignments FOR SELECT
    USING (is_parent(auth.uid()));

-- Kids can view their own chore assignments
CREATE POLICY "Kids can view their own chore assignments"
    ON chore_assignments FOR SELECT
    USING (auth.uid() = user_id AND get_user_role(user_id) = 'kid');

-- Only parents can create chore assignments
CREATE POLICY "Parents can create chore assignments"
    ON chore_assignments FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Parents can update any chore assignment
CREATE POLICY "Parents can update chore assignments"
    ON chore_assignments FOR UPDATE
    USING (is_parent(auth.uid()));

-- Kids can mark their own chores as complete (update only)
CREATE POLICY "Kids can complete their own chores"
    ON chore_assignments FOR UPDATE
    USING (auth.uid() = user_id AND get_user_role(user_id) = 'kid')
    WITH CHECK (auth.uid() = user_id);

-- Only parents can delete chore assignments
CREATE POLICY "Parents can delete chore assignments"
    ON chore_assignments FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- 6. Restore INCENTIVE TYPES table policies (originally from migration 002)
-- ============================================================================

-- Everyone can view incentive types
CREATE POLICY "Anyone authenticated can view incentive types"
    ON incentive_types FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only parents can create incentive types
CREATE POLICY "Parents can create incentive types"
    ON incentive_types FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Only parents can update incentive types
CREATE POLICY "Parents can update incentive types"
    ON incentive_types FOR UPDATE
    USING (is_parent(auth.uid()));

-- Only parents can delete incentive types
CREATE POLICY "Parents can delete incentive types"
    ON incentive_types FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- 7. Restore INCENTIVE LOGS table policies (originally from migration 002)
-- ============================================================================

-- Parents can view all incentive logs
CREATE POLICY "Parents can view all incentive logs"
    ON incentive_logs FOR SELECT
    USING (is_parent(auth.uid()));

-- Kids can view their own incentive logs
CREATE POLICY "Kids can view their own incentive logs"
    ON incentive_logs FOR SELECT
    USING (auth.uid() = user_id AND get_user_role(user_id) = 'kid');

-- Parents can create incentive logs for anyone
CREATE POLICY "Parents can create incentive logs"
    ON incentive_logs FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Kids can create their own incentive logs
CREATE POLICY "Kids can create their own incentive logs"
    ON incentive_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id AND get_user_role(user_id) = 'kid');

-- Only parents can update incentive logs
CREATE POLICY "Parents can update incentive logs"
    ON incentive_logs FOR UPDATE
    USING (is_parent(auth.uid()));

-- Only parents can delete incentive logs
CREATE POLICY "Parents can delete incentive logs"
    ON incentive_logs FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- 8. Restore SCREEN TIME SESSIONS table policies (originally from migration 002)
-- ============================================================================

-- Parents can view all screen time sessions
CREATE POLICY "Parents can view all screen time sessions"
    ON screen_time_sessions FOR SELECT
    USING (is_parent(auth.uid()));

-- Kids can view their own screen time sessions
CREATE POLICY "Kids can view their own screen time sessions"
    ON screen_time_sessions FOR SELECT
    USING (auth.uid() = user_id AND get_user_role(user_id) = 'kid');

-- Parents can create screen time sessions for anyone
CREATE POLICY "Parents can create screen time sessions"
    ON screen_time_sessions FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Kids can create their own screen time sessions (when they start using screen time)
CREATE POLICY "Kids can create their own screen time sessions"
    ON screen_time_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id AND get_user_role(user_id) = 'kid');

-- Parents can update any screen time session
CREATE POLICY "Parents can update screen time sessions"
    ON screen_time_sessions FOR UPDATE
    USING (is_parent(auth.uid()));

-- Kids can update their own active screen time sessions (to end them)
CREATE POLICY "Kids can update their own screen time sessions"
    ON screen_time_sessions FOR UPDATE
    USING (auth.uid() = user_id AND get_user_role(user_id) = 'kid')
    WITH CHECK (auth.uid() = user_id);

-- Only parents can delete screen time sessions
CREATE POLICY "Parents can delete screen time sessions"
    ON screen_time_sessions FOR DELETE
    USING (is_parent(auth.uid()));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All RLS policies have been restored to their original secure state.
-- The helper functions get_user_role() and is_parent() are back in place.
-- Parents now have full family management permissions.
-- Kids are restricted to their own data.
--
-- Note: The destructive migrations 007-011 should be removed from version control
-- as a best practice. They will remain in git history for audit purposes.
-- ============================================================================
