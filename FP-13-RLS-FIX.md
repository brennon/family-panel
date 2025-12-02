# FP-13: RLS Policy Fix for Chores Table

## Root Cause Analysis

After extensive debugging with Playwright and server logs, I've identified the issue:

### What I Found
1. **Authentication Works**: The session is valid, user ID is correct (`00000000-0000-0000-0000-000000000001`)
2. **Session Token Exists**: The JWT access token is properly stored in cookies
3. **Database Queries Fail**: All queries to `chores` table return "permission denied"

### The Problem
The RLS (Row Level Security) policies on the `chores` table in your Supabase database are not working correctly. Even though migrations 010-013 were created to fix the INSERT policy, the policies are still not functioning.

Debug logs show:
```
[DEBUG] Session exists: true
[DEBUG] Session user ID: 00000000-0000-0000-0000-000000000001
Error: Failed to fetch chores: permission denied for table chores
```

This confirms that `auth.uid()` is returning NULL in the database RLS policies, even though we have a valid authenticated session.

## The Fix

I've created **migration 015** (`supabase/migrations/015_reset_chores_rls_policies.sql`) which:

1. **Drops all existing policies** on the chores table
2. **Recreates them** with correct syntax
3. **Uses explicit EXISTS subqueries** instead of helper functions to avoid any function-related issues
4. **Includes verification** query to confirm policies are created correctly

## How to Apply

### In Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `supabase/migrations/015_reset_chores_rls_policies.sql`
4. **Verify the output** from the SELECT query at the end - you should see 4 policies:
   - `Anyone authenticated can view chores` (SELECT) - has `qual` clause
   - `Parents can create chores` (INSERT) - has `with_check` clause
   - `Parents can update chores` (UPDATE) - has `qual` clause
   - `Parents can delete chores` (DELETE) - has `qual` clause

### Expected Output:
```
| policyname                           | cmd    | qual                                              | with_check |
|--------------------------------------|--------|---------------------------------------------------|------------|
| Parents can delete chores            | DELETE | (EXISTS ( SELECT 1... WHERE role = 'parent'))     | NULL       |
| Parents can create chores            | INSERT | NULL                                               | (EXISTS...) |
| Anyone authenticated can view chores | SELECT | (auth.uid() IS NOT NULL)                          | NULL       |
| Parents can update chores            | UPDATE | (EXISTS ( SELECT 1... WHERE role = 'parent'))     | NULL       |
```

## Other Changes in This PR

### Fixed: proxy.ts (Next.js 16 Authentication)
- Changed `getSession()` to `getUser()` for proper token validation
- This ensures the JWT is refreshed and validated on every request
- **Critical for RLS to work** - without this, `auth.uid()` returns NULL

### Why This Matters
Next.js 16 uses `proxy.ts` instead of `middleware.ts`. The proxy must call `getUser()` (not `getSession()`) to:
1. Validate the JWT with Supabase auth server
2. Refresh expired tokens
3. Ensure `auth.uid()` works in RLS policies

## Testing After Migration

Once migration 015 is applied:

1. **Local testing**:
   ```bash
   npm run dev
   ```
   - Navigate to http://localhost:3001/admin/chores
   - You should see the chores list (even if empty)
   - Click "Create Chore" and create a test chore
   - It should succeed without "Failed to create chore" error

2. **E2E tests** (should now pass):
   ```bash
   npm run test:e2e
   ```
   The tests in `e2e/admin-chores.spec.ts` and `e2e/admin-assignments.spec.ts` should pass.

3. **Vercel preview**: After deploying, test creating a chore as parent@example.com

## Summary

**Files Changed:**
- `proxy.ts` - Fixed auth token validation (getUser instead of getSession)
- `supabase/migrations/015_reset_chores_rls_policies.sql` - Comprehensive RLS policy fix

**Action Required:**
Apply migration 015 in Supabase dashboard and verify policies are created correctly.
