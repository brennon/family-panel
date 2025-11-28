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

4. **Dashboard** (`app/dashboard/page.tsx`)
   - Protected route requiring authentication
   - Shows user information and role-specific actions
   - Sign out functionality

### Database Schema

The authentication system extends the `users` table with:

```sql
-- Added in migration 003_add_kid_pin.sql
ALTER TABLE users ADD COLUMN pin_hash TEXT;
```

**Functions:**
- `validate_kid_pin(user_id, pin)` - Validates a kid's PIN
- `set_kid_pin(user_id, pin)` - Sets/updates a kid's PIN (must be 4 digits)

## Authentication Flows

### Parent Authentication

1. Parent navigates to `/login`
2. Selects "Parent Login" mode
3. Enters email and password
4. System validates credentials via Supabase Auth
5. On success, redirects to `/dashboard`

### Kid Authentication

1. Kid navigates to `/login`
2. Selects "Kid Login" mode
3. Enters their user ID (provided by parent)
4. Enters 4-digit PIN
5. System validates via `/api/auth/pin-login` endpoint
6. API route calls `validate_kid_pin()` database function
7. On success, creates session and redirects to `/dashboard`

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

To apply the authentication schema:

1. Ensure migrations 001 and 002 (from fp-6) are applied
2. Apply migration 003:
   ```bash
   # In Supabase SQL Editor
   # Run supabase/migrations/003_add_kid_pin.sql
   ```

3. Set up parent accounts via Supabase Auth UI or API
4. Create user records in the `users` table with `role = 'parent'` or `role = 'kid'`
5. For kids, set their PINs using `set_kid_pin()`

## Future Enhancements

- [ ] Parent UI for managing kid PINs
- [ ] Password reset flow for parents
- [ ] Email verification
- [ ] Multi-factor authentication for parents
- [ ] Kid profile selection UI (instead of entering user ID)
- [ ] Session timeout configuration
- [ ] Audit log for authentication events
