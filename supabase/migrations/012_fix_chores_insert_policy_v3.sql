-- Migration: 012
-- Description: Fix the INSERT policy for chores table (v3)
-- Use is_parent() helper function like other policies

-- Drop the existing policy
DROP POLICY IF EXISTS "Parents can create chores" ON chores;

-- Recreate using is_parent() helper, matching the syntax of working policies
CREATE POLICY "Parents can create chores"
    ON chores FOR INSERT
    TO public
    WITH CHECK (is_parent(auth.uid()));
