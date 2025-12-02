-- Migration: 013
-- Description: Fix the INSERT policy for chores table (correct version)
-- INSERT policies need WITH CHECK clause, not USING clause

-- Drop any existing policy
DROP POLICY IF EXISTS "Parents can create chores" ON chores;

-- Create INSERT policy with WITH CHECK
-- Note: INSERT policies don't use USING, only WITH CHECK
CREATE POLICY "Parents can create chores"
    ON chores
    FOR INSERT
    WITH CHECK (is_parent(auth.uid()));

-- Verify it was created correctly
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'chores' AND policyname = 'Parents can create chores';
