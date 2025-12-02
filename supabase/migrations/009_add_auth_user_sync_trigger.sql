-- Migration: 009
-- Description: Auto-sync auth.users to public.users
-- Ensures that when a new user signs up via Supabase Auth, a corresponding
-- row is created in public.users with the same ID and role information.

-- ============================================================================
-- Function: Handle New User Signup
-- ============================================================================
-- This function is called automatically when a new user is created in auth.users
-- It creates a corresponding entry in public.users so RLS policies work correctly

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users
  -- Default role is 'parent' - this can be changed later if needed
  -- Email and name are extracted from the auth user metadata
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'parent', -- Default to parent role for new signups
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Sync Auth Users to Public Users
-- ============================================================================
-- Automatically creates a public.users row when a new auth.users row is created

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Backfill: Sync Existing Auth Users
-- ============================================================================
-- For any existing auth.users that don't have a corresponding public.users entry

INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'parent', -- Default existing users to parent role
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;
