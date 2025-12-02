-- Migration: 011
-- Description: Fix the INSERT policy for chores table (v2)
-- Using explicit column-level approach for better compatibility

-- Drop the existing policy
DROP POLICY IF EXISTS "Parents can create chores" ON chores;

-- Recreate with explicit syntax
CREATE POLICY "Parents can create chores"
ON chores
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'parent'
  )
);

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chores'
    AND policyname = 'Parents can create chores'
    AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION 'Policy was not created successfully';
  END IF;
END $$;
