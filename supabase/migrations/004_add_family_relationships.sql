-- Migration: 004_add_family_relationships.sql
-- Description: Add flexible family relationship schema supporting multiple parents, blended families, and guardians

-- Families table - represents a household
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Family members junction table - links users to families with roles
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'kid', 'guardian')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can only be in a family once
  UNIQUE(family_id, user_id)
);

CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

-- RLS policies for families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Parents and guardians can see their family
CREATE POLICY "Family members can view their family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Only parents can update family settings
CREATE POLICY "Parents can update their family"
  ON families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- RLS policies for family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Family members can see other members in their family
CREATE POLICY "Family members can view other members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Only parents can add/remove family members
CREATE POLICY "Parents can manage family members"
  ON family_members FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- Helper function: Get user's family role
CREATE OR REPLACE FUNCTION get_user_family_role(p_user_id UUID, p_family_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM family_members
  WHERE user_id = p_user_id AND family_id = p_family_id
  LIMIT 1;
$$;

-- Helper function: Check if user is parent in any family
CREATE OR REPLACE FUNCTION is_user_parent(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM family_members
    WHERE user_id = p_user_id AND role = 'parent'
  );
$$;

-- Helper function: Get user's families
CREATE OR REPLACE FUNCTION get_user_families(p_user_id UUID)
RETURNS TABLE(family_id UUID, family_name TEXT, user_role TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT f.id, f.name, fm.role
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE fm.user_id = p_user_id;
$$;

COMMENT ON TABLE families IS 'Family/household units that contain parents and kids';
COMMENT ON TABLE family_members IS 'Junction table linking users to families with their role';
