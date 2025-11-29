# Fixes needed on fp-7

---

## ✅ COMPLETED WORK (2025-11-29)

### Build & CI Fixes - ALL PASSING ✓

**What Was Fixed:**

1. **Jest Test Failures** ✅
   - Added `ts-node` devDependency for TypeScript Jest config parsing
   - All 12 unit tests now passing in CI
   - Commit: `97ffeb9` - fix(test): add ts-node to parse TypeScript Jest config

2. **Next.js Build Failures** ✅
   - Added placeholder Supabase client for build-time SSR when env vars unavailable
   - Added SSR guards (`typeof document === 'undefined'`) in cookie handlers
   - Added build-time env var check in middleware
   - Build now completes successfully in CI
   - Commits:
     - `579a50a` - fix(build): add SSR guards for Supabase client and middleware
     - `11a38b7` - fix(build): add placeholder client for build-time SSR

3. **E2E Test CI Configuration** ✅
   - Fixed duplicate dev server startup (workflow + Playwright both starting servers)
   - Removed redundant "Start dev server" step from workflow
   - Updated Playwright config to use port 3000 in CI, port 3001 locally
   - E2E tests now run without dev server conflicts
   - Commit: `63034a3` - fix(ci): remove duplicate dev server startup in E2E tests

**Current CI Status:**
- ✅ Build Verification: PASSING
- ✅ Quality Checks (Lint & Type Check): PASSING
- ✅ Unit & Integration Tests: PASSING (12/12)
- ✅ E2E Tests (Chromium): PASSING (20/20 tests)
- ❌ E2E Tests (Firefox/WebKit/Mobile Safari): 30 failures

**PR Status:** https://github.com/brennon/family-panel/pull/14

---

## 🚨 REMAINING WORK - CRITICAL

### Issue fp-zcv: Restore Removed RLS Policies

**The Problem:**

During debugging of E2E test failures, RLS policies were incorrectly removed via migrations 007-011 under the mistaken belief they were causing timeout issues. **This was wrong** - the real issues were:
1. Missing cookie handlers in the Supabase browser client
2. Premature `SIGNED_IN` event firing before client initialization

The RLS policies were NOT the cause and should never have been removed.

**What Was Removed (Migration 011):**

All RLS policies using `get_user_role()` and `is_parent()` helper functions were dropped, including:
- Parent permissions to view/update/delete ALL users in their family
- Parent permissions to create/update/delete chores, assignments, incentives, screen time
- Family-scoped access controls

**Current State:**
- Only basic `auth.uid() = id` policies remain
- Parents cannot manage family data
- Security is compromised - users can only see their own records

**Impact:**
- ✅ Chromium E2E tests pass (20/20) - basic auth flows work
- ❌ Firefox/WebKit/Mobile Safari tests fail (30/30) - likely due to missing permissions
- 🔒 **SECURITY RISK**: Production would be insecure without proper RLS

**Required Actions:**

1. **Remove destructive migrations 007-011** ✅ (Best Practice)
   - These migrations should not exist in version control
   - They drop critical security policies
   - File: `supabase/migrations/011_drop_all_rls_dependencies.sql` and related

2. **Create migration to restore RLS policies**
   - Based on original policies before removal
   - Use RPC functions or safer approaches than removed helper functions
   - File: `supabase/migrations/012_restore_rls_policies.sql` (or similar)

3. **Verify all E2E tests pass across all browsers**
   - Run full test suite: `npm run test:e2e`
   - All 50 tests must pass (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
   - Verify parent can manage family data
   - Verify kids can only see their own data

4. **Document the mistake in migration comments**
   - Explain why policies were removed (incorrect debugging)
   - Explain why they're being restored (they weren't the issue)
   - Reference commit `0921f85` which fixed the real issue (event timing)

**Beads Issue:** `fp-zcv` - "Restore RLS policies removed during test debugging"
- Status: Open
- Priority: P1 (Critical)
- Blocks: fp-7 completion
- Dependency: fp-ig4 (E2E tests) depends on this

---

## Context (Original Task - COMPLETED)

The authentication implementation in `feature/fp-7-implement-auth` has a critical blocking issue: **PIN authentication for kids validates the PIN but doesn't create an authenticated session**. This means kids can successfully validate their PIN, but the middleware immediately redirects them back to login because no Supabase session exists.

See the comment in `app/api/auth/pin-login/route.ts:74-78`:
```typescript
// For now, we validate the PIN but don't create a full Supabase Auth session
// In production, you would:
// 1. Use Supabase custom tokens, OR
// 2. Set up kids with magic link auth, OR
// 3. Use a session cookie with JWT
```

## Your Task

Implement **Option 1: Supabase Custom Tokens via Magic Links** to create proper authenticated sessions for kids after PIN validation.

## Why This Approach?

- Uses native Supabase Auth (existing middleware/RLS works without changes)
- Security handled by Supabase (CSRF, refresh tokens, etc.)
- Unified auth system for both parents and kids
- No need for kids to check email (tokens generated server-side)
- Production-ready and maintainable

## Implementation Steps

### 1. Create the Flexible Family Schema Migration

Create `supabase/migrations/004_add_family_relationships.sql`:

```sql
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

-- Update seed data: create a family and add members
INSERT INTO families (id, name) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'The Example Family')
ON CONFLICT (id) DO NOTHING;

INSERT INTO family_members (family_id, user_id, role) VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'parent'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'kid'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'kid')
ON CONFLICT (family_id, user_id) DO NOTHING;

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
```

### 2. Update the PIN Login API Route

Modify `app/api/auth/pin-login/route.ts` to use the admin client to generate magic link tokens:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * API Route: PIN Login for Kids
 * Validates kid's PIN and creates an authenticated session via magic link token
 */

export async function POST(request: NextRequest) {
  try {
    const { userId, pin } = await request.json();

    // Validate input
    if (!userId || !pin) {
      return NextResponse.json(
        { error: 'User ID and PIN are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate PIN using database function
    const { data: isValid, error } = await supabase.rpc('validate_kid_pin', {
      p_user_id: userId,
      p_pin: pin,
    } as any);

    if (error) {
      console.error('PIN validation error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN or user ID' },
        { status: 401 }
      );
    }

    // Get user details including email
    type UserProfile = {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    const { data, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (userError || !data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = data as UserProfile;

    // Verify user is a kid
    if (user.role !== 'kid') {
      return NextResponse.json(
        { error: 'PIN login is only for kids' },
        { status: 403 }
      );
    }

    // Generate magic link token using admin client
    const adminClient = createAdminClient();
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    if (linkError || !linkData) {
      console.error('Magic link generation error:', linkError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return token to client for session creation
    return NextResponse.json({
      success: true,
      token: linkData.properties.hashed_token,
      email: user.email,
    });
  } catch (error) {
    console.error('PIN login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Update the Auth Context

Modify `lib/auth/context.tsx` to use the token for session creation:

```typescript
// Sign in with PIN (for kids)
const signInWithPin = async (userId: string, pin: string) => {
  try {
    // Call API route to validate PIN and get magic link token
    const response = await fetch('/api/auth/pin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, pin }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || 'PIN login failed') };
    }

    // Use the magic link token to create a Supabase session
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.token,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('Session creation error:', verifyError);
      return { error: verifyError };
    }

    // Session will be automatically picked up by onAuthStateChange listener
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

### 4. Create Supabase Auth Accounts for Test Users

You need to manually create Supabase Auth accounts for the test users in your seed data. Run these SQL commands in the Supabase SQL Editor:

**Note:** If `auth.admin_create_user` function doesn't exist in your Supabase instance, use the Dashboard UI instead (Authentication → Users → Add User).

```sql
-- Create Supabase Auth account for parent
-- This will fail if the user already exists, which is fine
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'parent@example.com',
  crypt('parentpassword123', gen_salt('bf')),
  NOW(),
  '{"name": "John Parent", "role": "parent"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create Supabase Auth account for Alice Kid
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'kid1@example.com',
  crypt('unused-password', gen_salt('bf')),
  NOW(),
  '{"name": "Alice Kid", "role": "kid"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create Supabase Auth account for Bob Kid
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'kid2@example.com',
  crypt('unused-password', gen_salt('bf')),
  NOW(),
  '{"name": "Bob Kid", "role": "kid"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Set PINs for the kids (Alice: 1234, Bob: 5678)
SELECT set_kid_pin('00000000-0000-0000-0000-000000000002', '1234');
SELECT set_kid_pin('00000000-0000-0000-0000-000000000003', '5678');
```

**Alternative: Use Supabase Dashboard**
1. Go to Authentication → Users
2. Add User for each test account
3. Use the emails and IDs from seed_data.sql
4. Check "Auto Confirm User"
5. Add user metadata: `{"name": "...", "role": "..."}`

### 5. Verify Environment Variables

Ensure your `.env.local` has the service role key:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin operations
```

The service role key is available in your Supabase project settings under API → Project API keys → service_role.

### 6. Update Documentation

Update `docs/AUTH.md` to include:

1. **New section explaining the magic link token approach:**
   - How PIN validation triggers server-side token generation
   - Why kids don't need to check email
   - That email addresses are just identifiers in Supabase Auth

2. **Dummy email strategy for kids without real emails:**
   ```
   For kids without email addresses, use internal dummy emails:
   kid-{uuid}@family-panel.internal

   These satisfy Supabase's email requirement but never need to be checked.
   Parents manage PIN resets through the admin UI (future feature).
   ```

3. **Updated setup instructions:**
   - How to create Supabase Auth accounts for kids
   - SQL commands or Dashboard steps
   - How to set PINs

4. **Security notes:**
   - Service role key must be kept secure (server-only)
   - Magic link tokens are generated server-side and never emailed
   - Tokens are single-use and time-limited

5. **Family relationships section:**
   - Explain the families and family_members tables
   - Benefits of the flexible schema (multiple parents, blended families)
   - How to query family relationships

### 7. Set Up Testing Infrastructure

Authentication is too critical to ship untested. Set up comprehensive testing infrastructure with auth as the example (this establishes patterns for fp-30).

#### 7.1. Install Testing Dependencies

```bash
npm install --save-dev jest @jest/globals jest-environment-jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev msw @mswjs/http-middleware
npm install --save-dev @types/jest
```

#### 7.2. Configure Jest

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
};

export default createJestConfig(config);
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### 7.3. Create Test Utilities

Create `lib/test-utils/supabase-mock.ts`:

```typescript
/**
 * Mock Supabase client for testing
 */

export const createMockSupabaseClient = () => {
  const mockAuth = {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    verifyOtp: jest.fn(),
  };

  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  }));

  const mockRpc = jest.fn();

  return {
    auth: mockAuth,
    from: mockFrom,
    rpc: mockRpc,
  };
};

export const mockSupabaseUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockKidUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'kid1@example.com',
  name: 'Alice Kid',
  role: 'kid',
};

export const mockParentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'parent@example.com',
  name: 'John Parent',
  role: 'parent',
};
```

#### 7.4. Unit Tests

Create `app/api/auth/pin-login/__tests__/route.test.ts`:

```typescript
import { POST } from '../route';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe('PIN Login API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without userId', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID and PIN are required');
  });

  it('should reject request without PIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test-id' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID and PIN are required');
  });

  it('should reject non-4-digit PIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test-id', pin: '123' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('PIN must be 4 digits');
  });

  it('should reject invalid PIN', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: false, error: null }),
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000002',
        pin: '9999',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid PIN or user ID');
  });

  it('should reject PIN login for non-kid users', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'parent@example.com',
            name: 'John Parent',
            role: 'parent',
          },
          error: null,
        }),
      })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001',
        pin: '1234',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('PIN login is only for kids');
  });

  it('should generate magic link token for valid kid PIN', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'kid1@example.com',
            name: 'Alice Kid',
            role: 'kid',
          },
          error: null,
        }),
      })),
    };

    const mockAdminClient = {
      auth: {
        admin: {
          generateLink: jest.fn().mockResolvedValue({
            data: {
              properties: {
                hashed_token: 'mock-token-hash',
              },
            },
            error: null,
          }),
        },
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000002',
        pin: '1234',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe('mock-token-hash');
    expect(data.email).toBe('kid1@example.com');
    expect(mockAdminClient.auth.admin.generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'kid1@example.com',
    });
  });
});
```

#### 7.5. Component Tests

Create `app/login/__tests__/page.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { useAuth } from '@/lib/auth/context';

// Mock auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: jest.fn(),
}));

describe('Login Page', () => {
  const mockSignIn = jest.fn();
  const mockSignInWithPin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signInWithPin: mockSignInWithPin,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  it('renders parent login form by default', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome to Family Panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches to kid login mode', async () => {
    render(<LoginPage />);

    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument();
  });

  it('validates parent login form', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'parent@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('parent@example.com', 'password123');
    });
  });

  it('validates kid PIN login form', async () => {
    mockSignInWithPin.mockResolvedValue({ error: null });

    render(<LoginPage />);

    // Switch to kid mode
    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    const userIdInput = screen.getByLabelText(/your name/i);
    const pinInput = screen.getByLabelText(/pin code/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(userIdInput, '00000000-0000-0000-0000-000000000002');
    await userEvent.type(pinInput, '1234');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPin).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000002',
        '1234'
      );
    });
  });

  it('displays error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('restricts PIN input to 4 digits', async () => {
    render(<LoginPage />);

    // Switch to kid mode
    const kidButton = screen.getByRole('button', { name: /kid login/i });
    await userEvent.click(kidButton);

    const pinInput = screen.getByLabelText(/pin code/i) as HTMLInputElement;

    await userEvent.type(pinInput, '123456');

    // Should only accept first 4 digits
    expect(pinInput.value).toBe('1234');
  });
});
```

#### 7.6. E2E Tests with Playwright

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('parent can log in with email and password', async ({ page }) => {
    // Fill in parent login form
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show parent's name
    await expect(page.getByText(/john parent/i)).toBeVisible();
  });

  test('kid can log in with PIN', async ({ page }) => {
    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Fill in kid login form
    await page.getByLabel(/your name/i).fill('00000000-0000-0000-0000-000000000002');
    await page.getByLabel(/pin code/i).fill('1234');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show kid's name
    await expect(page.getByText(/alice kid/i)).toBeVisible();
  });

  test('session persists after page refresh', async ({ page }) => {
    // Log in as parent
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/john parent/i)).toBeVisible();
  });

  test('invalid PIN shows error', async ({ page }) => {
    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Fill in with wrong PIN
    await page.getByLabel(/your name/i).fill('00000000-0000-0000-0000-000000000002');
    await page.getByLabel(/pin code/i).fill('9999');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error
    await expect(page.getByText(/invalid pin/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('sign out works correctly', async ({ page }) => {
    // Log in
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByLabel('Password').fill('parentpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected back to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

#### 7.7. Create Testing Documentation

Create `docs/TESTING.md`:

```markdown
# Testing Guide

This document explains how to write and run tests for Family Panel.

## Test Types

### Unit Tests
Test individual functions and components in isolation.

**Location**: `__tests__` directories next to the code
**Run**: `npm test`
**Example**: Testing PIN validation logic

### Integration Tests
Test API routes and interactions between components.

**Location**: `__tests__` directories in API route folders
**Run**: `npm test`
**Example**: Testing the PIN login API endpoint

### Component Tests
Test React components with React Testing Library.

**Location**: `__tests__` directories next to components
**Run**: `npm test`
**Example**: Testing the login form

### E2E Tests
Test complete user flows with Playwright.

**Location**: `e2e/` directory
**Run**: `npm run test:e2e`
**Example**: Testing full login flow with real browser

## Running Tests

```bash
# Run all unit/integration/component tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

## Writing Tests

### Unit Test Example

```typescript
// lib/utils/__tests__/format.test.ts
import { formatCurrency } from '../format';

describe('formatCurrency', () => {
  it('formats cents as dollars', () => {
    expect(formatCurrency(100)).toBe('$1.00');
  });
});
```

### Component Test Example

```typescript
// components/ChoreCard/__tests__/ChoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import ChoreCard from '../ChoreCard';

describe('ChoreCard', () => {
  it('displays chore name and value', () => {
    render(<ChoreCard name="Make Bed" value={50} />);

    expect(screen.getByText('Make Bed')).toBeInTheDocument();
    expect(screen.getByText('$0.50')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
// e2e/chores.spec.ts
import { test, expect } from '@playwright/test';

test('kid can complete a chore', async ({ page }) => {
  await page.goto('/login');
  // ... login flow
  await page.goto('/dashboard');
  await page.getByText('Make Bed').click();
  await page.getByRole('button', { name: /complete/i }).click();

  await expect(page.getByText(/completed/i)).toBeVisible();
});
```

## Test Utilities

### Mocking Supabase

```typescript
import { createMockSupabaseClient } from '@/lib/test-utils/supabase-mock';

const mockSupabase = createMockSupabaseClient();
mockSupabase.from.mockReturnValue({
  select: jest.fn().mockResolvedValue({ data: [...], error: null }),
});
```

## CI Integration

Tests run automatically on every PR via GitHub Actions. The workflow:
1. Runs `npm run type-check`
2. Runs `npm run lint`
3. Runs `npm test` (unit/integration/component tests)
4. Runs `npm run test:e2e` (E2E tests)

All must pass before merging.
```

#### 7.8. Add CI Integration

Update `.github/workflows/test.yml` (or create if it doesn't exist):

```yaml
name: Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload E2E test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Manual Testing Instructions

### Manual Testing:

1. **Apply the migration:**
   - Run `supabase/migrations/004_add_family_relationships.sql` in Supabase SQL Editor

2. **Create Auth accounts:**
   - Run the SQL commands above OR use the Dashboard UI

3. **Set test PINs:**
   - Alice (kid1@example.com): PIN 1234
   - Bob (kid2@example.com): PIN 5678

4. **Test parent login:**
   - Go to http://localhost:3001/login
   - Select "Parent Login"
   - Email: parent@example.com
   - Password: parentpassword123
   - Should redirect to /dashboard
   - Verify user info displays correctly

5. **Test kid PIN login:**
   - Sign out, go back to /login
   - Select "Kid Login"
   - User ID: `00000000-0000-0000-0000-000000000002`
   - PIN: 1234
   - Should redirect to /dashboard
   - Verify Alice's info displays correctly
   - Check browser cookies - should see Supabase auth cookies

6. **Test session persistence:**
   - While logged in as Alice, refresh the page
   - Should stay logged in (not redirect to /login)

7. **Test middleware protection:**
   - Sign out
   - Try to access /dashboard directly
   - Should redirect to /login

8. **Test invalid PIN:**
   - Try logging in with wrong PIN
   - Should show error message
   - Should not create session

### Expected Behavior:

- ✅ Kids can log in with User ID + PIN
- ✅ Session persists across page refreshes
- ✅ Middleware recognizes kid sessions
- ✅ Dashboard shows kid's information
- ✅ Sign out works properly
- ✅ Invalid PINs are rejected

## Acceptance Criteria

### From fp-7 (Auth Implementation):
- [x] Parents can login with email/password
- [x] Kids can login with simplified method ← **THIS IS THE FIX**
- [x] User role is accessible throughout app
- [x] Protected routes redirect unauthenticated users
- [x] Session persists across page refreshes ← **THIS IS THE FIX**

### From fp-30 (Testing Infrastructure):
- [x] Jest is configured and running with TypeScript
- [x] React Testing Library is set up
- [x] MSW is configured for API mocking
- [x] Supabase test utilities exist
- [x] Example unit tests exist for auth
- [x] Example integration tests exist for auth API routes
- [x] Example component tests exist for auth UI
- [x] E2E tests exist for auth flows (Playwright)
- [x] Test coverage reporting works
- [x] npm test command runs all tests
- [x] Tests can run in CI/CD pipeline
- [x] Documentation on writing new tests (with auth examples)

## Notes:

- The existing middleware and auth context don't need changes beyond the `signInWithPin` function
- The admin client (`createAdminClient()`) already exists in `lib/supabase/server.ts`
- Kids never need to check email - tokens are generated and consumed server-side
- Future work will add a parent UI for creating kids and setting PINs (not in scope for this fix; see issue fp-93y)
- This work establishes testing patterns for the entire project (completes fp-30 infrastructure)
- Service/repository layer tests will be added later when those layers are built (fp-8)

## ISSUES RESOLVED - READY FOR VERIFICATION

Both critical issues have been resolved. The implementation is now ready for verification before commit.

### Issue 1: Auth Implementation - RESOLVED ✓

**What Was Done**:
1. ✓ Reverted `app/api/auth/pin-login/route.ts` to use `generateLink()` approach
   - Extracts `hashed_token` directly from response properties
   - Returns token to client for verification
2. ✓ Reverted `lib/auth/context.tsx` to use `verifyOtp()` approach
   - Verifies magic link token to create session
3. ✓ Updated unit tests to match new implementation
   - All 12 unit tests passing
4. ✓ Verified magic link generation works with properly-created auth users
   - Tested via curl: successfully generates token and returns user data

**Files Updated**:
- `app/api/auth/pin-login/route.ts` (now using `generateLink` with `hashed_token`)
- `lib/auth/context.tsx` (now using `verifyOtp`)
- `app/api/auth/pin-login/__tests__/route.test.ts` (updated mocks)

### Issue 2: Seed Data and Tests - RESOLVED ✓

**What Was Done**:
1. ✓ Created comprehensive seed data migration: `supabase/migrations/005_seed_test_data.sql`
   - Inserts auth users with deterministic UUIDs directly into `auth.users`
   - Creates email identities in `auth.identities`
   - Populates application users in `users` table
   - Sets PINs for kids (Alice: 1234, Bob: 5678)
   - Creates test family and relationships
   - Uses bcrypt password hashing with `crypt()` and `gen_salt('bf')`
2. ✓ Updated E2E tests to use seed data UUIDs
   - Changed from manual UUIDs to seed UUIDs (00000000-0000-0000-0000-000000000002, etc.)
   - Updated test prerequisites documentation

**Files Updated**:
- `supabase/migrations/005_seed_test_data.sql` (new file)
- `e2e/auth.spec.ts` (updated UUIDs and prerequisites)

**Test Users**:
- Parent: `00000000-0000-0000-0000-000000000001` (parent@example.com, password: parentpassword123)
- Kid 1: `00000000-0000-0000-0000-000000000002` (kid1@example.com, PIN: 1234)
- Kid 2: `00000000-0000-0000-0000-000000000003` (kid2@example.com, PIN: 5678)

### Verification Steps Before Commit

**IMPORTANT**: These steps must be completed before committing to ensure the migrations and tests work correctly on a fresh database.

1. **Wipe and rebuild database**:
   ```sql
   -- In Supabase SQL Editor
   DROP SCHEMA IF EXISTS public CASCADE;
   DROP SCHEMA IF EXISTS auth CASCADE;
   CREATE SCHEMA public;
   CREATE SCHEMA auth;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   GRANT ALL ON SCHEMA auth TO postgres;
   ```

2. **Run all migrations in order**:
   - `001_initial_schema.sql`
   - `002_add_role_to_users.sql`
   - `003_add_kid_pin.sql`
   - `004_add_family_relationships.sql`
   - `005_seed_test_data.sql` (creates test users with deterministic UUIDs)
   - `006_grant_permissions.sql` (NEW - grants service_role and anon permissions)

3. **Verify seed data was created**:
   ```sql
   -- Check auth users exist
   SELECT id, email FROM auth.users ORDER BY email;

   -- Check application users exist
   SELECT id, email, name, role FROM users ORDER BY email;

   -- Check PINs were set
   SELECT user_id, pin_hash IS NOT NULL as has_pin FROM user_pins;

   -- Check family relationships
   SELECT * FROM family_members;
   ```

4. **Run quality checks**:
   ```bash
   npm run lint        # Must pass
   npm run type-check  # Must pass
   ```

5. **Run unit/integration tests**:
   ```bash
   npm test            # All 12 tests should pass
   ```

6. **Run E2E tests**:
   ```bash
   npm run test:e2e -- --project=chromium --workers=1
   ```

7. **Verify all 6 E2E tests pass**:
   - ✓ Parent can log in with email and password
   - ✓ Kid can log in with PIN
   - ✓ Session persists after page refresh
   - ✓ Invalid PIN shows error
   - ✓ Protected routes redirect to login
   - ✓ Sign out works correctly

## Questions or Issues?

If you encounter any problems during verification:
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Verify the Supabase Auth accounts were created by migration 005
3. Check browser console for errors during login
4. Check server logs for API route errors
5. Verify the PINs were set correctly in the database
6. Run `npm test` to verify all unit tests pass
7. Check test coverage with `npm run test:coverage`

**IMPORTANT**: Complete all verification steps above before committing. The migrations and tests must work on a fresh database.
