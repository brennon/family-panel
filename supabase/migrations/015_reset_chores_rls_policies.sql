-- Migration: 015
-- Description: Completely reset and fix all RLS policies for chores table
-- This migration drops all existing policies and recreates them correctly

-- ============================================================================
-- Step 1: Drop ALL existing policies on chores table
-- ============================================================================
DROP POLICY IF EXISTS "Anyone authenticated can view chores" ON chores;
DROP POLICY IF EXISTS "Parents can create chores" ON chores;
DROP POLICY IF EXISTS "Parents can update chores" ON chores;
DROP POLICY IF EXISTS "Parents can delete chores" ON chores;

-- ============================================================================
-- Step 2: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 3: Recreate all policies with correct syntax
-- ============================================================================

-- SELECT policy: Anyone authenticated can view chores
CREATE POLICY "Anyone authenticated can view chores"
    ON chores
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT policy: Only parents can create chores
-- Note: INSERT policies use WITH CHECK, not USING
CREATE POLICY "Parents can create chores"
    ON chores
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'parent'
        )
    );

-- UPDATE policy: Only parents can update chores
CREATE POLICY "Parents can update chores"
    ON chores
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'parent'
        )
    );

-- DELETE policy: Only parents can delete chores
CREATE POLICY "Parents can delete chores"
    ON chores
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'parent'
        )
    );

-- ============================================================================
-- Step 4: Verification - List all policies
-- ============================================================================
-- Run this to verify policies were created correctly:
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'chores'
ORDER BY cmd, policyname;
