-- Migration: 006_grant_permissions.sql
-- Description: Grant necessary permissions to service_role and anon roles
-- This is required for the API routes and client queries to work correctly

-- ============================================================================
-- Service Role Permissions
-- ============================================================================
-- The service role is used by API routes with the service role key
-- It needs full access to all tables, sequences, and functions

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant access to future tables/sequences/functions as well
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- ============================================================================
-- Anonymous Role Permissions
-- ============================================================================
-- The anon role is used by client-side queries (with RLS enabled)
-- Grant SELECT on tables that authenticated users need to read

GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT ON families TO anon, authenticated;
GRANT SELECT ON family_members TO anon, authenticated;

-- Grant usage on sequences for inserting data
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- Authenticated Role Permissions
-- ============================================================================
-- Additional permissions for authenticated users

-- Users can update their own profile
GRANT UPDATE ON users TO authenticated;

-- Users can insert/update/delete their family data (controlled by RLS)
GRANT INSERT, UPDATE, DELETE ON families TO authenticated;
GRANT INSERT, UPDATE, DELETE ON family_members TO authenticated;

COMMENT ON SCHEMA public IS 'Standard public schema with proper role permissions for Supabase';
