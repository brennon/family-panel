-- Add Browser-Specific Test Users
-- Migration: 007
-- Description: Creates unique test users for each browser to prevent cross-browser test interference
--
-- This solves the issue where parallel E2E tests across 5 browsers cause failures
-- due to concurrent access to the same test users.
--
-- UUID Scheme:
-- Parents:  000000X0-0000-0000-0000-000000000000 where X = 1-5 (browser #)
-- Kids 1:   00000X10-0000-0000-0000-000000000000 where X = 1-5 (browser #)
-- Kids 2:   00000X20-0000-0000-0000-000000000000 where X = 1-5 (browser #)
--
-- Browser mapping:
-- 1 = chromium
-- 2 = firefox
-- 3 = webkit
-- 4 = Mobile Chrome
-- 5 = Mobile Safari

-- ============================================================================
-- 1. Create Browser-Specific Auth Users (Parents)
-- ============================================================================

-- Chromium Parent
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES (
  '00000010-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'parent-chromium@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NOW(), '', '', '', '', NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false
) ON CONFLICT (id) DO NOTHING;

-- Firefox Parent
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES (
  '00000020-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'parent-firefox@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NOW(), '', '', '', '', NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false
) ON CONFLICT (id) DO NOTHING;

-- WebKit Parent
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES (
  '00000030-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'parent-webkit@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NOW(), '', '', '', '', NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false
) ON CONFLICT (id) DO NOTHING;

-- Mobile Chrome Parent
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES (
  '00000040-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'parent-mobile-chrome@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NOW(), '', '', '', '', NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false
) ON CONFLICT (id) DO NOTHING;

-- Mobile Safari Parent
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES (
  '00000050-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'parent-mobile-safari@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NOW(), '', '', '', '', NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false
) ON CONFLICT (id) DO NOTHING;

-- Update passwords with proper bcrypt hashes (same password for all: parentpassword123)
UPDATE auth.users
SET encrypted_password = crypt('parentpassword123', gen_salt('bf'))
WHERE id IN (
  '00000010-0000-0000-0000-000000000000'::uuid,
  '00000020-0000-0000-0000-000000000000'::uuid,
  '00000030-0000-0000-0000-000000000000'::uuid,
  '00000040-0000-0000-0000-000000000000'::uuid,
  '00000050-0000-0000-0000-000000000000'::uuid
);

-- ============================================================================
-- 2. Create Email Identities for Parents
-- ============================================================================

INSERT INTO auth.identities (provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  ('00000010-0000-0000-0000-000000000000', '00000010-0000-0000-0000-000000000000'::uuid, '00000010-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000010-0000-0000-0000-000000000000', 'email', 'parent-chromium@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000020-0000-0000-0000-000000000000', '00000020-0000-0000-0000-000000000000'::uuid, '00000020-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000020-0000-0000-0000-000000000000', 'email', 'parent-firefox@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000030-0000-0000-0000-000000000000', '00000030-0000-0000-0000-000000000000'::uuid, '00000030-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000030-0000-0000-0000-000000000000', 'email', 'parent-webkit@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000040-0000-0000-0000-000000000000', '00000040-0000-0000-0000-000000000000'::uuid, '00000040-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000040-0000-0000-0000-000000000000', 'email', 'parent-mobile-chrome@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000050-0000-0000-0000-000000000000', '00000050-0000-0000-0000-000000000000'::uuid, '00000050-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000050-0000-0000-0000-000000000000', 'email', 'parent-mobile-safari@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Create Application Users (Parents)
-- ============================================================================

INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
  ('00000010-0000-0000-0000-000000000000'::uuid, 'parent-chromium@example.com', 'Chromium Parent', 'parent', NOW(), NOW()),
  ('00000020-0000-0000-0000-000000000000'::uuid, 'parent-firefox@example.com', 'Firefox Parent', 'parent', NOW(), NOW()),
  ('00000030-0000-0000-0000-000000000000'::uuid, 'parent-webkit@example.com', 'WebKit Parent', 'parent', NOW(), NOW()),
  ('00000040-0000-0000-0000-000000000000'::uuid, 'parent-mobile-chrome@example.com', 'Mobile Chrome Parent', 'parent', NOW(), NOW()),
  ('00000050-0000-0000-0000-000000000000'::uuid, 'parent-mobile-safari@example.com', 'Mobile Safari Parent', 'parent', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================================
-- 4. Create Browser-Specific Kid Users (2 per browser)
-- ============================================================================

-- Note: Kids use PIN login via API, not direct auth.users authentication
-- These users are created in the users table with PIN hashes

INSERT INTO users (id, email, name, role, pin_hash, created_at, updated_at) VALUES
  -- Chromium kids
  ('00000110-0000-0000-0000-000000000000'::uuid, 'kid-chromium-1@example.com', 'Chromium Kid 1', 'kid', crypt('1234', gen_salt('bf')), NOW(), NOW()),
  ('00000120-0000-0000-0000-000000000000'::uuid, 'kid-chromium-2@example.com', 'Chromium Kid 2', 'kid', crypt('5678', gen_salt('bf')), NOW(), NOW()),
  -- Firefox kids
  ('00000210-0000-0000-0000-000000000000'::uuid, 'kid-firefox-1@example.com', 'Firefox Kid 1', 'kid', crypt('1234', gen_salt('bf')), NOW(), NOW()),
  ('00000220-0000-0000-0000-000000000000'::uuid, 'kid-firefox-2@example.com', 'Firefox Kid 2', 'kid', crypt('5678', gen_salt('bf')), NOW(), NOW()),
  -- WebKit kids
  ('00000310-0000-0000-0000-000000000000'::uuid, 'kid-webkit-1@example.com', 'WebKit Kid 1', 'kid', crypt('1234', gen_salt('bf')), NOW(), NOW()),
  ('00000320-0000-0000-0000-000000000000'::uuid, 'kid-webkit-2@example.com', 'WebKit Kid 2', 'kid', crypt('5678', gen_salt('bf')), NOW(), NOW()),
  -- Mobile Chrome kids
  ('00000410-0000-0000-0000-000000000000'::uuid, 'kid-mobile-chrome-1@example.com', 'Mobile Chrome Kid 1', 'kid', crypt('1234', gen_salt('bf')), NOW(), NOW()),
  ('00000420-0000-0000-0000-000000000000'::uuid, 'kid-mobile-chrome-2@example.com', 'Mobile Chrome Kid 2', 'kid', crypt('5678', gen_salt('bf')), NOW(), NOW()),
  -- Mobile Safari kids
  ('00000510-0000-0000-0000-000000000000'::uuid, 'kid-mobile-safari-1@example.com', 'Mobile Safari Kid 1', 'kid', crypt('1234', gen_salt('bf')), NOW(), NOW()),
  ('00000520-0000-0000-0000-000000000000'::uuid, 'kid-mobile-safari-2@example.com', 'Mobile Safari Kid 2', 'kid', crypt('5678', gen_salt('bf')), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  pin_hash = EXCLUDED.pin_hash,
  updated_at = NOW();

-- ============================================================================
-- 5. Add Browser-Specific Users to Test Family
-- ============================================================================

INSERT INTO family_members (family_id, user_id, role, created_at) VALUES
  -- Parents
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000010-0000-0000-0000-000000000000'::uuid, 'parent', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000020-0000-0000-0000-000000000000'::uuid, 'parent', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000030-0000-0000-0000-000000000000'::uuid, 'parent', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000040-0000-0000-0000-000000000000'::uuid, 'parent', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000050-0000-0000-0000-000000000000'::uuid, 'parent', NOW()),
  -- Kids
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000110-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000120-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000210-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000220-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000310-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000320-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000410-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000420-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000510-0000-0000-0000-000000000000'::uuid, 'kid', NOW()),
  ('00000000-0000-0000-0000-000000000010'::uuid, '00000520-0000-0000-0000-000000000000'::uuid, 'kid', NOW())
ON CONFLICT (family_id, user_id) DO NOTHING;
