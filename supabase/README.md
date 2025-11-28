# Supabase Database Setup

This directory contains database migrations and setup instructions for the Family Panel application.

## Prerequisites

- Supabase project created (already configured in `.env.local`)
- Supabase CLI installed (optional, for managing migrations)

## Database Schema

The database consists of 6 main tables:

1. **users** - Parent and kid user accounts with roles and screen time allocations
2. **chores** - Available chores with monetary values
3. **chore_assignments** - Tracks which chores are assigned to kids and completion status
4. **incentive_types** - Types of incentive activities (reading, exercise, etc.) with reward values
5. **incentive_logs** - Records of completed incentive activities
6. **screen_time_sessions** - Tracks when kids use their screen time

## Applying Migrations

### Option 1: Using Supabase SQL Editor (Recommended for initial setup)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/pzvlajwhzyyuageeefgg
2. Navigate to **SQL Editor** in the left sidebar
3. Run each migration file in order:
   - Copy the contents of `migrations/001_initial_schema.sql`
   - Paste into SQL Editor and click **Run**
   - Copy the contents of `migrations/002_row_level_security.sql`
   - Paste into SQL Editor and click **Run**
4. Optionally run `seed_data.sql` for test data

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref pzvlajwhzyyuageeefgg

# Run migrations
npx supabase db push
```

## Row Level Security (RLS)

The database implements comprehensive RLS policies to ensure:

- **Kids** can only:
  - View their own profile, chore assignments, incentive logs, and screen time sessions
  - Complete their own chores
  - Create their own incentive logs and screen time sessions

- **Parents** can:
  - View and manage all data across all tables
  - Create, update, and delete chores, chore assignments, incentive types
  - Create and manage user accounts

## Testing the Setup

After applying migrations, verify the schema:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Connection in Next.js

The app uses two types of clients:

1. **Browser Client** (`lib/supabase/client.ts`) - For client-side operations with RLS enforced
2. **Server Client** (`lib/supabase/server.ts`) - For server-side operations with cookie handling
3. **Admin Client** (`lib/supabase/server.ts`) - For admin operations that bypass RLS (use with caution)

### Usage Example

```typescript
// Client-side
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: users } = await supabase.from('users').select('*');

// Server-side (Server Component)
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: users } = await supabase.from('users').select('*');
```

## Environment Variables

Ensure these are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://pzvlajwhzyyuageeefgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## TypeScript Types

Database types are defined in `lib/supabase/types.ts` and provide full type safety for all database operations.

## Next Steps

After setting up the database:
1. Implement authentication (see fp-7)
2. Create API routes for data operations
3. Build UI components that interact with the database
