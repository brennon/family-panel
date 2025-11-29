# Authentication System

This document describes the authentication implementation for Family Panel, including role-based access for parents and kids.

## Overview

The authentication system uses Supabase Auth with custom role-based access control. Parents use traditional email/password authentication, while kids can use a simplified 4-digit PIN system.

## Architecture

### Components

1. **Auth Context** (`lib/auth/context.tsx`)
   - Provides authentication state throughout the app
   - Handles sign in/out operations
   - Manages user session and profile data
   - Exposes `useAuth()` hook for components

2. **Middleware** (`middleware.ts`)
   - Protects routes from unauthenticated access
   - Refreshes sessions automatically
   - Redirects to login when needed
   - Redirects authenticated users away from login

3. **Login Page** (`app/login/page.tsx`)
   - Dual-mode login (Parent/Kid)
   - Parent: email + password
   - Kid: user ID + 4-digit PIN
   - Handles redirects after successful login

4. **PIN Login API** (`app/api/auth/pin-login/route.ts`)
   - Validates kid's PIN using database function
   - Uses admin client to bypass RLS for authentication
   - Generates magic link token via `auth.admin.generateLink()`
   - Returns token hash for client-side session creation
   - Security: Verifies role is 'kid', validates PIN format (4 digits)

5. **Dashboard** (`app/dashboard/page.tsx`)
   - Protected route requiring authentication
   - Shows user information and role-specific actions
   - Sign out functionality

### Database Schema

The authentication system includes several schema additions:

**User Roles** (migration 002):
```sql
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'kid';
CREATE INDEX idx_users_role ON users(role);
```

**PIN Authentication** (migration 003):
```sql
ALTER TABLE users ADD COLUMN pin_hash TEXT;
```

**Family Relationships** (migration 004):
```sql
-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members junction table
CREATE TABLE family_members (
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'kid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);
```

**Functions:**
- `validate_kid_pin(user_id, pin)` - Validates a kid's PIN (uses bcrypt comparison)
- `set_kid_pin(user_id, pin)` - Sets/updates a kid's PIN (must be 4 digits)
- `get_user_family_role(user_id, family_id)` - Gets user's role within a family

**Permissions** (migration 006):
- Service role: Full access to all tables, sequences, and functions
- Anon/Authenticated roles: SELECT on users, families, family_members
- Authenticated users can update their own profiles and manage family data

## Authentication Flows

### Parent Authentication

1. Parent navigates to `/login`
2. Selects "Parent Login" mode
3. Enters email and password
4. System validates credentials via Supabase Auth
5. On success, redirects to `/dashboard`

### Kid Authentication (Magic Link Approach)

1. Kid navigates to `/login`
2. Selects "Kid Login" mode
3. Enters their user ID (provided by parent)
4. Enters 4-digit PIN
5. Client sends request to `/api/auth/pin-login` endpoint
6. **Server-side validation and token generation**:
   - API route validates PIN using `validate_kid_pin()` database function
   - Uses admin client (service role) to bypass RLS
   - Verifies user has `role = 'kid'`
   - Generates magic link token via `auth.admin.generateLink()`
   - Extracts `hashed_token` from response
   - Returns token hash to client
7. **Client-side session creation**:
   - Client receives token hash
   - Calls `supabase.auth.verifyOtp()` with token hash
   - Supabase creates authenticated session
8. On success, redirects to `/dashboard`

**Why Magic Links?**: This approach uses Supabase's built-in magic link mechanism to create proper authenticated sessions. The PIN is validated server-side, and if valid, a magic link token is generated and immediately verified to create the session. This ensures:
- Proper session management (refresh tokens, expiry, etc.)
- Compliance with Supabase auth patterns
- Security through server-side validation with admin privileges

## Protected Routes

All routes except `/`, `/login`, and static assets require authentication. The middleware automatically:

- Checks for valid session
- Refreshes expired sessions
- Redirects to `/login?redirect=/original-path` if not authenticated
- Preserves the original destination for post-login redirect

## Usage

### In Components

```tsx
import { useAuth } from '@/lib/auth/context';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.name}! Role: {user.role}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <button onClick={() => signIn('email', 'password')}>Sign In</button>
      )}
    </div>
  );
}
```

### Setting Up a Kid's PIN (Parent Action)

Parents can set up PINs for their kids using the database function:

```sql
-- Via Supabase SQL Editor or API
SELECT set_kid_pin('kid-user-id-here', '1234');
```

In the future, this will be exposed through a parent-only UI.

## Security Considerations

1. **PIN Storage**: PINs are hashed using bcrypt before storage (via `crypt()` function)
2. **Role Verification**: PIN login only works for users with `role = 'kid'`
3. **RLS Policies**: Row Level Security ensures kids can only access their own data
4. **Session Management**: Sessions are automatically refreshed by middleware
5. **HTTPS Only**: Production should enforce HTTPS for all auth operations

## Migration Instructions

To apply the complete authentication schema from scratch:

### Fresh Database Setup

1. **Wipe database** (development/test only):
   - In Supabase dashboard, go to Database → Schema
   - Drop all tables in public schema
   - Truncate `auth.users` and `auth.identities` tables

2. **Apply migrations in order**:
   ```bash
   # In Supabase SQL Editor, run each migration file:

   # 001_initial_schema.sql - Base users table
   # 002_add_role_to_users.sql - Add role column
   # 003_add_kid_pin.sql - Add PIN authentication
   # 004_add_family_relationships.sql - Add families and family_members tables
   # 005_seed_test_data.sql - Create test users (dev/test environments only)
   # 006_grant_permissions.sql - Grant necessary permissions to roles
   ```

3. **For production environments**:
   - Skip migration 005 (seed data)
   - Set up parent accounts via Supabase Auth UI or API
   - Create user records in the `users` table with corresponding UUIDs
   - For kids, set their PINs using `set_kid_pin()`

### Verifying Setup

After applying migrations, verify:

```sql
-- Check users exist
SELECT id, email, name, role FROM users;

-- Check families exist
SELECT * FROM families;

-- Check family relationships
SELECT fm.family_id, fm.user_id, fm.role, u.name, f.name as family_name
FROM family_members fm
JOIN users u ON fm.user_id = u.id
JOIN families f ON fm.family_id = f.id;

-- Verify kids have PINs set
SELECT id, name, role, (pin_hash IS NOT NULL) as has_pin
FROM users
WHERE role = 'kid';
```

## Future Enhancements

- [ ] Parent UI for managing kid PINs
- [ ] Password reset flow for parents
- [ ] Email verification
- [ ] Multi-factor authentication for parents
- [ ] Kid profile selection UI (instead of entering user ID)
- [ ] Session timeout configuration
- [ ] Audit log for authentication events
