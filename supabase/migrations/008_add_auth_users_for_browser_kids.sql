-- Add Auth Users for Browser-Specific Kids
-- Migration: 008
-- Description: Creates auth.users and auth.identities entries for browser-specific kids
--
-- Migration 007 created kids in the users table with PINs, but they also need
-- auth.users entries for Supabase sessions to work after PIN authentication.

-- ============================================================================
-- 1. Create Auth Users for Browser-Specific Kids
-- ============================================================================

-- Chromium Kids
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES
  ('00000110-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-chromium-1@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false),
  ('00000120-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-chromium-2@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Firefox Kids
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES
  ('00000210-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-firefox-1@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false),
  ('00000220-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-firefox-2@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- WebKit Kids
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES
  ('00000310-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-webkit-1@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false),
  ('00000320-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-webkit-2@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Mobile Chrome Kids
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES
  ('00000410-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-mobile-chrome-1@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false),
  ('00000420-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-mobile-chrome-2@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Mobile Safari Kids
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, email_change_token_current,
  email_change_confirm_status, banned_until, reauthentication_token,
  reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
) VALUES
  ('00000510-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-mobile-safari-1@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false),
  ('00000520-0000-0000-0000-000000000000'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'kid-mobile-safari-2@example.com',
   '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
   NOW(), '', '', '', '', NULL,
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"email_verified":true}'::jsonb,
   false, NOW(), NOW(), NULL, NULL, '', '', '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Update passwords with unused password (kids authenticate via PIN)
UPDATE auth.users
SET encrypted_password = crypt('unused-password-kids-use-pin', gen_salt('bf'))
WHERE id IN (
  '00000110-0000-0000-0000-000000000000'::uuid,
  '00000120-0000-0000-0000-000000000000'::uuid,
  '00000210-0000-0000-0000-000000000000'::uuid,
  '00000220-0000-0000-0000-000000000000'::uuid,
  '00000310-0000-0000-0000-000000000000'::uuid,
  '00000320-0000-0000-0000-000000000000'::uuid,
  '00000410-0000-0000-0000-000000000000'::uuid,
  '00000420-0000-0000-0000-000000000000'::uuid,
  '00000510-0000-0000-0000-000000000000'::uuid,
  '00000520-0000-0000-0000-000000000000'::uuid
);

-- ============================================================================
-- 2. Create Email Identities for Kids
-- ============================================================================

INSERT INTO auth.identities (provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  -- Chromium kids
  ('00000110-0000-0000-0000-000000000000', '00000110-0000-0000-0000-000000000000'::uuid, '00000110-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000110-0000-0000-0000-000000000000', 'email', 'kid-chromium-1@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000120-0000-0000-0000-000000000000', '00000120-0000-0000-0000-000000000000'::uuid, '00000120-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000120-0000-0000-0000-000000000000', 'email', 'kid-chromium-2@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  -- Firefox kids
  ('00000210-0000-0000-0000-000000000000', '00000210-0000-0000-0000-000000000000'::uuid, '00000210-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000210-0000-0000-0000-000000000000', 'email', 'kid-firefox-1@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000220-0000-0000-0000-000000000000', '00000220-0000-0000-0000-000000000000'::uuid, '00000220-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000220-0000-0000-0000-000000000000', 'email', 'kid-firefox-2@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  -- WebKit kids
  ('00000310-0000-0000-0000-000000000000', '00000310-0000-0000-0000-000000000000'::uuid, '00000310-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000310-0000-0000-0000-000000000000', 'email', 'kid-webkit-1@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000320-0000-0000-0000-000000000000', '00000320-0000-0000-0000-000000000000'::uuid, '00000320-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000320-0000-0000-0000-000000000000', 'email', 'kid-webkit-2@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  -- Mobile Chrome kids
  ('00000410-0000-0000-0000-000000000000', '00000410-0000-0000-0000-000000000000'::uuid, '00000410-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000410-0000-0000-0000-000000000000', 'email', 'kid-mobile-chrome-1@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000420-0000-0000-0000-000000000000', '00000420-0000-0000-0000-000000000000'::uuid, '00000420-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000420-0000-0000-0000-000000000000', 'email', 'kid-mobile-chrome-2@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  -- Mobile Safari kids
  ('00000510-0000-0000-0000-000000000000', '00000510-0000-0000-0000-000000000000'::uuid, '00000510-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000510-0000-0000-0000-000000000000', 'email', 'kid-mobile-safari-1@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW()),
  ('00000520-0000-0000-0000-000000000000', '00000520-0000-0000-0000-000000000000'::uuid, '00000520-0000-0000-0000-000000000000'::uuid,
   jsonb_build_object('sub', '00000520-0000-0000-0000-000000000000', 'email', 'kid-mobile-safari-2@example.com', 'email_verified', true, 'phone_verified', false),
   'email', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
