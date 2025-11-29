-- Seed Test Data
-- This migration creates test users with deterministic UUIDs for E2E testing
--
-- IMPORTANT: This should only be run in development/test environments
-- Run this after all other migrations to set up a fresh test database

-- ============================================================================
-- 1. Insert Auth Users
-- ============================================================================
-- We insert directly into auth.users to have deterministic UUIDs
-- This is safe for test/dev environments where we control the data

-- Parent user (John Parent)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'parent@example.com',
  -- Password: parentpassword123
  -- Generated with: SELECT crypt('parentpassword123', gen_salt('bf'));
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- This will be replaced below
  NOW(),
  '',
  '',
  '',
  '',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
) ON CONFLICT (id) DO NOTHING;

-- Kid 1 user (Alice Kid)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'kid1@example.com',
  -- Password: unused-password (kids use PIN, not password)
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- This will be replaced below
  NOW(),
  '',
  '',
  '',
  '',
  NULL,
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
) ON CONFLICT (id) DO NOTHING;

-- Kid 2 user (Bob Kid)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'kid2@example.com',
  -- Password: unused-password (kids use PIN, not password)
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- This will be replaced below
  NOW(),
  '',
  '',
  '',
  '',
  NULL,
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
) ON CONFLICT (id) DO NOTHING;

-- Update passwords with proper bcrypt hashes
-- Parent password: parentpassword123
UPDATE auth.users
SET encrypted_password = crypt('parentpassword123', gen_salt('bf'))
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Kids password: unused-password (they authenticate with PIN)
UPDATE auth.users
SET encrypted_password = crypt('unused-password', gen_salt('bf'))
WHERE id IN (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid
);

-- ============================================================================
-- 2. Insert Email Identities
-- ============================================================================
-- Required for Supabase auth to work properly

INSERT INTO auth.identities (
  provider_id,
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  -- Parent identity
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000001',
      'email', 'parent@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  -- Kid 1 identity
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000002',
      'email', 'kid1@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  -- Kid 2 identity
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000003',
      'email', 'kid2@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Insert Application Users
-- ============================================================================

INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'parent@example.com', 'John Parent', 'parent', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'kid1@example.com', 'Alice Kid', 'kid', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'kid2@example.com', 'Bob Kid', 'kid', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================================
-- 4. Set Kid PINs
-- ============================================================================

-- Update kids with their PINs (stored in pin_hash column on users table)
UPDATE users
SET pin_hash = crypt('1234', gen_salt('bf'))
WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;

UPDATE users
SET pin_hash = crypt('5678', gen_salt('bf'))
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid;

-- ============================================================================
-- 5. Create Test Family and Relationships
-- ============================================================================

-- Create the test family
INSERT INTO families (id, name, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000010'::uuid, 'Test Family', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Add family members
INSERT INTO family_members (family_id, user_id, role, created_at) VALUES
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'parent', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'kid', NOW())
ON CONFLICT (family_id, user_id) DO NOTHING;
