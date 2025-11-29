-- Cleanup Auto-Created Kid Auth Users
-- Migration: 007b
-- Description: Removes auto-created auth.users entries that were created by PIN login attempts
--
-- When migration 007 created kids without auth.users entries, the PIN login API's
-- generateLink() call auto-created auth.users entries with random UUIDs.
-- We need to remove these before migration 008 can insert the correct ones.

-- ============================================================================
-- Delete Auto-Created Auth Users for Kids
-- ============================================================================

-- Delete auth.identities entries first (foreign key constraint)
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'kid-chromium-1@example.com',
    'kid-chromium-2@example.com',
    'kid-firefox-1@example.com',
    'kid-firefox-2@example.com',
    'kid-webkit-1@example.com',
    'kid-webkit-2@example.com',
    'kid-mobile-chrome-1@example.com',
    'kid-mobile-chrome-2@example.com',
    'kid-mobile-safari-1@example.com',
    'kid-mobile-safari-2@example.com'
  )
  -- Only delete if UUID doesn't match our intended UUIDs (i.e., auto-created ones)
  AND id NOT IN (
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
  )
);

-- Delete auto-created auth.users entries
DELETE FROM auth.users
WHERE email IN (
  'kid-chromium-1@example.com',
  'kid-chromium-2@example.com',
  'kid-firefox-1@example.com',
  'kid-firefox-2@example.com',
  'kid-webkit-1@example.com',
  'kid-webkit-2@example.com',
  'kid-mobile-chrome-1@example.com',
  'kid-mobile-chrome-2@example.com',
  'kid-mobile-safari-1@example.com',
  'kid-mobile-safari-2@example.com'
)
-- Only delete if UUID doesn't match our intended UUIDs (i.e., auto-created ones)
AND id NOT IN (
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
