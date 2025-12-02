-- Migration: 010
-- Description: Fix the INSERT policy for chores table
-- The original policy was missing the WITH CHECK clause enforcement

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Parents can create chores" ON chores;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Parents can create chores"
    ON chores FOR INSERT
    WITH CHECK (is_parent(auth.uid()));
