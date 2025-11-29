-- Family Panel - Remove Circular RLS Policies
-- Migration: 009
-- Description: Remove policies with EXISTS subqueries that still cause circular dependencies
--
-- Problem: Even with aliases, EXISTS subqueries on the users table trigger RLS evaluation,
-- which evaluates the same policy again, causing infinite recursion.
--
-- Solution: Temporarily remove "Parents can view all users" policy that has EXISTS subquery.
-- Parents will only be able to read their own profile through the users table for now.
-- Parent viewing other users will be implemented later via RPC functions or views that
-- bypass RLS using SECURITY DEFINER.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view all users" ON users;
DROP POLICY IF EXISTS "Parents can update users" ON users;

-- Note: We keep "Users can read own profile" and "Users can update own profile"
-- which have no subqueries and work correctly.

-- For now, parents can only read/update their own profile.
-- Future: Implement get_all_users() RPC function with SECURITY DEFINER for parent access.
