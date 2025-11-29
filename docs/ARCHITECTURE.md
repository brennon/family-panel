# Family Panel Architecture

**Version**: 1.1
**Last Updated**: 2025-11-29
**Status**: Active Development - Authentication Implemented

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Tech Stack](#tech-stack)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Updates](#real-time-updates)
- [Calendar Integration](#calendar-integration)
- [Multi-Device Support](#multi-device-support)
- [Future Refactoring Paths](#future-refactoring-paths)
- [Deployment](#deployment)

---

## Overview

Family Panel is a household coordination application designed to help families manage:
- **Chores**: Assignment, completion tracking, and payment calculation
- **Incentives**: Customizable rewards for activities (reading, exercise, etc.)
- **Screen Time**: Daily limits and countdown timers per child
- **Calendar**: Unified view of family, school, sports, and work events

The system is designed for **3 kids initially** but built to scale for families of varying sizes.

### Key Requirements

- Multi-device access (phones, tablets, TV display)
- Real-time updates across devices
- Role-based access (parents vs. kids)
- Calendar aggregation from multiple sources
- Progressive Web App (installable on devices)
- **Modular architecture** enabling future refactoring/migration

---

## Design Principles

### 1. Modularity First

The architecture prioritizes **clean separation of concerns** to enable future refactoring, including potential migration of services to Go or other languages.

**Why?** While starting with TypeScript/Next.js for rapid MVP development, we want the flexibility to:
- Extract performance-critical services to Go
- Scale specific components independently
- Swap infrastructure (database, hosting) without rewriting business logic

### 2. Service Layer Pattern

All business logic lives in **service classes**, not API routes or React components.

```
Frontend → API Client → API Route → Service → Repository → Database
```

**Benefits**:
- Business logic is testable independently of HTTP or UI concerns
- Services can be extracted to separate microservices without changing API contracts
- Clear boundaries between layers

### 3. Repository Pattern

Database access is abstracted through **repository classes**.

**Benefits**:
- Can swap Supabase for direct PostgreSQL or another database
- Easier to mock for testing
- Encapsulates query logic

### 4. Feature-Based Organization

Code is organized by **feature/domain**, not by technical layer.

```
/lib
  /services
    /chores
      ChoreService.ts
      ChoreAssignmentService.ts
    /screen-time
      ScreenTimeService.ts
    /calendar
      CalendarService.ts
  /repositories
    /chores
      ChoreRepository.ts
    /screen-time
      ScreenTimeRepository.ts
```

**Benefits**:
- Related code is colocated
- Easier to extract features into separate services
- Better developer experience

---

## Tech Stack

### Frontend

- **Next.js 14+** (App Router)
  - React-based full-stack framework
  - Server-side rendering for initial loads
  - API routes for backend logic
  - Built-in optimization and code splitting

- **TypeScript**
  - Type safety throughout the stack
  - Better IDE support and refactoring
  - Shared types between frontend and backend

- **Tailwind CSS**
  - Utility-first CSS framework
  - Rapid UI development
  - Responsive design utilities

- **shadcn/ui**
  - High-quality React components
  - Built on Radix UI primitives
  - Customizable and accessible

### Backend

- **Next.js API Routes**
  - Serverless functions on Vercel
  - Share codebase with frontend
  - TypeScript throughout

- **Service Layer** (custom)
  - Business logic encapsulation
  - Designed for future extraction

- **Repository Layer** (custom)
  - Data access abstraction

### Database & Authentication

- **Supabase**
  - PostgreSQL database
  - Built-in authentication (email/password, magic links)
  - Row-Level Security (RLS) for authorization
  - Real-time subscriptions (WebSocket-based)
  - RESTful API with auto-generated types

**Why Supabase?**
- Rapid development with auth + database + real-time in one platform
- Can self-host if privacy is a concern
- Strong PostgreSQL foundation (can migrate to direct PostgreSQL later)

### Additional Libraries

- **date-fns** - Date manipulation (lightweight alternative to moment.js)
- **ical.js** - Parsing iCal/CalDAV feeds for calendar subscriptions
- **Zustand** or **React Context** - Client-side state management
- **next-pwa** - Progressive Web App configuration

### Testing

- **Jest** - Test runner for unit and integration tests
- **React Testing Library** - Component testing with accessibility-first queries
- **Playwright** - Cross-browser E2E testing (Chromium, Firefox, WebKit)
- **MSW** (Mock Service Worker) - API mocking for integration tests
- **@edge-runtime/jest-environment** - Edge Runtime environment for API route tests
- **@testing-library/jest-dom** - Custom Jest matchers for DOM assertions
- **@testing-library/user-event** - Realistic user interaction simulation

**Coverage**: 50+ E2E tests covering authentication, navigation, and core workflows

### Deployment & CI/CD

- **Vercel** (primary)
  - Optimized for Next.js
  - Automatic deployments from Git
  - Preview deployments for PRs
  - Edge network for global performance

- **GitHub Actions** (CI/CD)
  - Automated quality checks (lint, type-check)
  - Unit and integration tests with coverage
  - E2E tests with Playwright
  - Build verification
  - Runs on every PR and push to main

- **Self-hosting option** (future)
  - Docker containers
  - Can host on home server or VPS

---

## Architecture Layers

### Layer 1: Frontend (React Components)

**Location**: `/app`, `/components`

**Responsibilities**:
- UI rendering and user interactions
- Client-side state management
- Routing (Next.js App Router)

**Key Patterns**:
- Components call API client functions (never fetch directly)
- Presentational vs. container components
- Server components for initial data loading, client components for interactivity

### Layer 2: API Client

**Location**: `/lib/api`

**Responsibilities**:
- Typed wrapper around fetch/HTTP calls
- Request/response transformation
- Error handling
- Token management

**Example**:
```typescript
// lib/api/chores.ts
export const choresApi = {
  getAll: () => apiClient.get<Chore[]>('/api/chores'),
  create: (data: CreateChoreInput) => apiClient.post<Chore>('/api/chores', data),
  // ...
}
```

**Benefits**:
- Frontend never directly calls API routes
- Type-safe API calls
- Easy to swap backend (e.g., replace with Go API)

### Layer 3: API Routes (Next.js)

**Location**: `/app/api`

**Responsibilities**:
- HTTP request handling
- Authentication/authorization checks
- Input validation
- Calling service layer
- Response formatting

**Pattern**: Thin controllers that delegate to services

**Example**:
```typescript
// app/api/chores/route.ts
export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  const chores = await ChoreService.getAll(user.id)
  return Response.json(chores)
}
```

### Layer 4: Service Layer

**Location**: `/lib/services`

**Responsibilities**:
- Business logic
- Orchestration of multiple repositories
- Complex calculations
- Transaction management

**Example**:
```typescript
// lib/services/chores/ChoreAssignmentService.ts
export class ChoreAssignmentService {
  static async assignChore(choreId: string, kidId: string, date: Date) {
    // Business logic here
    const chore = await ChoreRepository.findById(choreId)
    const kid = await UserRepository.findById(kidId)

    // Validate assignment rules
    if (!this.canAssignChore(chore, kid, date)) {
      throw new Error('Cannot assign chore')
    }

    // Create assignment
    return ChoreAssignmentRepository.create({
      choreId,
      userId: kidId,
      assignedDate: date,
      completed: false
    })
  }

  private static canAssignChore(...): boolean {
    // Validation logic
  }
}
```

**Benefits**:
- Testable without HTTP layer
- Reusable across API routes
- Can be extracted to separate service (Go, Python, etc.)

### Layer 5: Repository Layer

**Location**: `/lib/repositories`

**Responsibilities**:
- Direct database access
- Query construction
- Data mapping (DB model ↔ domain model)

**Example**:
```typescript
// lib/repositories/chores/ChoreRepository.ts
export class ChoreRepository {
  static async findById(id: string): Promise<Chore | null> {
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new RepositoryError(error.message)
    return data ? this.toDomain(data) : null
  }

  private static toDomain(dbRow: any): Chore {
    // Map database row to domain model
    return {
      id: dbRow.id,
      name: dbRow.name,
      monetaryValue: dbRow.monetary_value_cents / 100, // Convert cents to dollars
      // ...
    }
  }
}
```

**Benefits**:
- Abstracts Supabase-specific code
- Easy to swap database or ORM
- Handles data transformations in one place

### Layer 6: Database (Supabase/PostgreSQL)

**Location**: Hosted on Supabase cloud (or self-hosted)

**Responsibilities**:
- Data persistence
- Transactions
- Row-Level Security
- Real-time change events

---

## Data Flow

### Request Flow (Read Operation)

```
1. User clicks "View Today's Chores" in React component
   ↓
2. Component calls choresApi.getAssignmentsForToday(kidId)
   ↓
3. API client sends GET /api/chore-assignments?date=2025-11-27&kidId=123
   ↓
4. API route validates authentication, calls ChoreAssignmentService.getForDate()
   ↓
5. Service calls ChoreAssignmentRepository.findByDate()
   ↓
6. Repository queries Supabase
   ↓
7. Data flows back up: DB → Repository → Service → API Route → API Client → Component
```

### Write Operation (with Real-time Update)

```
1. Kid marks chore complete in UI
   ↓
2. Component calls choresApi.completeAssignment(assignmentId)
   ↓
3. API client sends PATCH /api/chore-assignments/123/complete
   ↓
4. API route validates (is this kid assigned this chore?), calls Service
   ↓
5. Service updates repository
   ↓
6. Repository updates Supabase database
   ↓
7. Supabase broadcasts change via WebSocket
   ↓
8. All connected clients receive real-time update and refresh UI
```

---

## Database Schema

### Core Tables

#### users
```sql
id              uuid PRIMARY KEY
email           text UNIQUE (nullable for kids)
name            text NOT NULL
role            text NOT NULL CHECK (role IN ('parent', 'kid'))
pin             text (for kid logins, hashed)
screen_time_daily_minutes integer DEFAULT 120
created_at      timestamp DEFAULT now()
```

#### chores
```sql
id                  uuid PRIMARY KEY
name                text NOT NULL
description         text
monetary_value_cents integer NOT NULL DEFAULT 0
created_at          timestamp DEFAULT now()
```

#### chore_assignments
```sql
id              uuid PRIMARY KEY
chore_id        uuid REFERENCES chores(id)
user_id         uuid REFERENCES users(id)
assigned_date   date NOT NULL
completed       boolean DEFAULT false
completed_at    timestamp
created_at      timestamp DEFAULT now()

INDEX (user_id, assigned_date)
INDEX (assigned_date)
```

#### chore_recurrence_rules
```sql
id              uuid PRIMARY KEY
chore_id        uuid REFERENCES chores(id)
user_id         uuid REFERENCES users(id)
frequency       text CHECK (frequency IN ('daily', 'weekly', 'custom'))
days_of_week    integer[] (0=Sunday, 6=Saturday)
start_date      date NOT NULL
end_date        date
created_at      timestamp DEFAULT now()
```

#### incentive_types
```sql
id                      uuid PRIMARY KEY
name                    text NOT NULL
unit_name               text NOT NULL (e.g., 'pages', 'minutes')
default_reward_cents    integer DEFAULT 0
default_reward_minutes  integer DEFAULT 0
created_at              timestamp DEFAULT now()
```

#### kid_incentive_config
```sql
id                      uuid PRIMARY KEY
user_id                 uuid REFERENCES users(id)
incentive_type_id       uuid REFERENCES incentive_types(id)
reward_cents_per_unit   integer DEFAULT 0
reward_minutes_per_unit integer DEFAULT 0
target_units_per_day    integer
created_at              timestamp DEFAULT now()

UNIQUE (user_id, incentive_type_id)
```

#### incentive_logs
```sql
id                  uuid PRIMARY KEY
user_id             uuid REFERENCES users(id)
incentive_type_id   uuid REFERENCES incentive_types(id)
date                date NOT NULL
units_completed     integer NOT NULL
reward_type         text CHECK (reward_type IN ('cash', 'screen_time'))
created_at          timestamp DEFAULT now()

INDEX (user_id, date)
```

#### screen_time_sessions
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
date            date NOT NULL
start_time      timestamp NOT NULL
end_time        timestamp
duration_seconds integer COMPUTED (end_time - start_time)
created_at      timestamp DEFAULT now()

INDEX (user_id, date)
```

#### screen_time_bonus
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
date            date NOT NULL
bonus_minutes   integer NOT NULL
source          text (e.g., 'incentive', 'parent_override')
created_at      timestamp DEFAULT now()

INDEX (user_id, date)
```

#### calendar_events
```sql
id              uuid PRIMARY KEY
title           text NOT NULL
description     text
start_time      timestamp NOT NULL
end_time        timestamp NOT NULL
location        text
all_day         boolean DEFAULT false
source_type     text CHECK (source_type IN ('native', 'subscribed', 'work'))
source_id       text (external calendar ID)
visibility      text CHECK (visibility IN ('all', 'parents-only', 'private'))
color           text
created_by      uuid REFERENCES users(id)
created_at      timestamp DEFAULT now()

INDEX (start_time, end_time)
INDEX (source_type, source_id)
```

#### calendar_subscriptions
```sql
id                      uuid PRIMARY KEY
name                    text NOT NULL
ical_url                text NOT NULL
color                   text
enabled                 boolean DEFAULT true
last_sync               timestamp
sync_frequency_minutes  integer DEFAULT 30
created_at              timestamp DEFAULT now()
```

#### payments
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
amount_cents    integer NOT NULL
start_date      date NOT NULL
end_date        date NOT NULL
paid_at         timestamp DEFAULT now()
notes           text
```

### Row-Level Security (RLS)

Supabase RLS policies enforce authorization at the database level:

**Example policies**:

```sql
-- Kids can only view their own chore assignments
CREATE POLICY "kids_view_own_assignments" ON chore_assignments
  FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'parent');

-- Only parents can create/edit chores
CREATE POLICY "parents_manage_chores" ON chores
  FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'parent');

-- Kids can mark their own chores complete
CREATE POLICY "kids_complete_own_chores" ON chore_assignments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (completed = true AND completed_at IS NOT NULL);
```

---

## Authentication & Authorization

### Implementation Status

**Completed** (as of v1.1):
- Parent email/password authentication
- Kid PIN-based authentication (4-digit)
- Auth context provider (`lib/auth/context.tsx`)
- Protected route middleware (`middleware.ts`)
- Login UI with dual-mode (parent/kid)
- Dashboard page
- Database migrations for users, families, and permissions
- Comprehensive test coverage (50+ E2E tests)

See [docs/AUTH.md](./AUTH.md) for complete authentication documentation.

### Authentication Methods

**Parents**:
- Email + password (✅ Implemented)
- Magic link (passwordless email) - Future
- 2FA/TOTP - Future

**Kids**:
- Simplified PIN login (4-digit) (✅ Implemented)
- PIN stored as bcrypt hash in `users.pin_hash` field
- No email required
- Uses magic link tokens internally for session creation

**Implementation Details**:
- Auth context: `lib/auth/context.tsx` - Provides `useAuth()` hook
- Middleware: `middleware.ts` - Protects all routes except `/`, `/login`
- Login page: `app/login/page.tsx` - Dual-mode UI
- PIN API: `app/api/auth/pin-login/route.ts` - Server-side PIN validation

### Session Management

- Supabase Auth handles session tokens (JWT)
- Refresh tokens for long-lived sessions
- Tokens stored in httpOnly cookies (secure)
- Middleware automatically refreshes expired sessions
- Redirect preservation for post-login navigation

### Authorization

**Role-based access control (RBAC)**:

- **Parent role**:
  - Full CRUD on chores, incentives, calendar events
  - View all data
  - Configure system settings
  - Manage kid accounts

- **Kid role**:
  - View own chore assignments
  - Mark own chores complete
  - Log own incentives
  - View family calendar (respecting visibility)
  - Start/stop own screen time timer
  - Read-only on most data

**Implementation**:
- Role stored in `users.role` column (enforced by DB CHECK constraint)
- Middleware checks authentication on every request
- RLS policies enforce authorization at database level (defense in depth)
- Database functions: `validate_kid_pin()`, `set_kid_pin()`, `get_user_family_role()`

---

## Real-time Updates

### Supabase Realtime

Supabase provides WebSocket-based real-time subscriptions to database changes.

**Use cases**:
- Kid marks chore complete → Parent sees update immediately
- Kid starts screen time → Display on TV updates
- Parent assigns new chore → Kid's dashboard refreshes

**Implementation**:

```typescript
// In React component
useEffect(() => {
  const channel = supabase
    .channel('chore_assignments_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chore_assignments' },
      (payload) => {
        console.log('Chore assignment changed:', payload)
        refetchChores()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

**Benefits**:
- No polling required
- Low latency (<100ms typically)
- Scales with Supabase infrastructure

---

## Testing Architecture

Family Panel uses a comprehensive testing strategy with three levels of testing. See [docs/TESTING.md](./TESTING.md) for complete testing documentation.

### Test Levels

**1. Unit Tests**
- Test individual functions and components in isolation
- Run with Jest + React Testing Library
- Mock external dependencies (Supabase, Next.js router, etc.)
- Focus on business logic and component behavior

**2. Integration Tests**
- Test API routes and service interactions
- Use `@edge-runtime/jest-environment` for Edge Runtime compatibility
- Mock database calls with test utilities
- Verify request/response handling and error cases

**3. End-to-End (E2E) Tests**
- Test complete user workflows in real browsers
- Use Playwright for cross-browser testing (Chromium, Firefox, WebKit)
- Test against live Supabase database with seed data
- Cover critical paths: authentication, navigation, core features

**Current Coverage**: 50+ E2E tests covering authentication flows, protected routes, and session management.

### Testing Tools

- **Jest** - Test runner and assertion framework
- **React Testing Library** - Component testing with accessibility-first queries
- **Playwright** - Cross-browser E2E automation
- **MSW** - API mocking for integration tests
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### Running Tests

```bash
# Unit and integration tests
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage report

# E2E tests
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Step-through debugging
```

### CI/CD Integration

GitHub Actions workflow (`.github/workflows/test.yml`) runs on every PR and push to main:
1. Type checking (`npm run type-check`)
2. Linting (`npm run lint`)
3. Unit/integration tests (`npm test`)
4. E2E tests (`npm run test:e2e`)
5. Build verification (`npm run build`)

All tests must pass before merging to main.

---

## Calendar Integration

Calendar aggregation is a core feature with three integration tiers:

### 1. App-Native Calendar (MVP)

**Description**: Calendars created and managed directly within Family Panel.

**Features**:
- Parents create/edit/delete events
- Visibility controls (all/parents-only/private)
- Stored in `calendar_events` table with `source_type='native'`

**Use case**: Family events, kids' activities parents manually add

### 2. External Calendar Subscriptions (MVP+)

**Description**: Subscribe to public iCal/CalDAV feeds (read-only in app).

**Examples**:
- School calendar (district publishes iCal URL)
- Sports team schedule
- Shared Google Calendar (via iCal export URL)

**Implementation**:
- Parents add subscription URL via UI
- Background job (`CalendarSyncService.syncAllSubscriptions()`) runs every 30 minutes
- Uses `ical.js` to parse iCal format
- Stores events in `calendar_events` with `source_type='subscribed'` and `source_id` linking to subscription
- Updates/deletes when events change in source calendar

**Tech notes**:
- iCal URLs must be public (no auth)
- Google Calendar: "Secret address in iCal format" setting
- Handle timezones correctly using ical.js utilities

### 3. Work Calendar Sync Agent (Post-MVP)

**Description**: Separate desktop application that runs on work laptops and syncs Outlook/Google Calendar to Family Panel.

**Why separate?**: Work calendars often have security restrictions preventing external subscriptions.

**Architecture**:
```
Work Laptop (Windows/Mac)
  ↓
Work Calendar Agent (Go binary)
  ├─ Reads Outlook COM API (Windows) or Calendar.app (Mac)
  ├─ Filters events based on user config
  ├─ Anonymizes titles if configured
  ↓
Family Panel API (POST /api/calendar/work-sync)
  ↓
Stored in calendar_events (source_type='work')
```

**Agent features**:
- Runs in system tray (minimal UI)
- Authenticates to Family Panel API with parent token
- Configurable filters:
  - Calendar categories
  - Keyword include/exclude
  - Busy/free only vs. full details
  - Title anonymization ("Work Meeting" instead of actual title)
- Sync frequency: 15-30 minutes
- Encrypted local config file

**Technology choice: Go**
- Single binary distribution (easy for non-technical users)
- Good cross-platform support
- Strong standard library for system integration
- Fast and resource-efficient

**Implementation plan**:
- Separate repository: `family-panel-work-agent`
- Platform-specific code:
  - Windows: Outlook COM API or EWS (Exchange Web Services)
  - Mac: EventKit framework or Calendar.app's SQLite database
- Simple installer (MSI for Windows, DMG for Mac)

---

## Multi-Device Support

### Progressive Web App (PWA)

Family Panel is a PWA, meaning it can be installed on devices like a native app.

**Setup**:
- `manifest.json` with app metadata
- Service worker for caching and offline support
- App icons for various platforms (iOS, Android, desktop)
- Splash screens

**Benefits**:
- Install on home screen (iOS, Android)
- Feels like a native app
- Offline viewing of cached data
- Push notifications (future)

**Implementation**: `next-pwa` package

### Device Types & Views

#### 1. Mobile/Tablet (Kid & Parent)

- Touch-optimized UI
- Bottom navigation or hamburger menu
- Large tap targets
- Pull-to-refresh

#### 2. Desktop (Primarily Parent)

- Keyboard navigation
- Side navigation
- Multi-column layouts
- Hover states

#### 3. TV Display Mode (Read-Only)

- Route: `/display`
- Full-screen, no chrome
- Auto-rotating views (15-second intervals):
  1. Date/time/weather
  2. Today's chores by kid
  3. Calendar (today + next 3-7 days)
  4. Screen time remaining per kid
- Large fonts (readable from 10+ feet)
- High contrast
- Stays awake (prevent sleep)
- No interaction required (but touch-enabled for manual navigation)
- Ideal device: Raspberry Pi, cheap Android tablet, or Chromecast-like device

**Implementation**:
- Separate route with simplified layout
- CSS media queries for TV dimensions
- JavaScript-based view rotation
- Wake Lock API to prevent sleep
- WebSocket updates for real-time data

### Responsive Design Strategy

Use Tailwind's responsive utilities:

```tsx
<div className="
  p-4                    // Mobile default
  md:p-6                 // Tablet
  lg:p-8                 // Desktop
  xl:grid xl:grid-cols-2 // Large desktop
">
```

Test on:
- iPhone (iOS Safari)
- Android phone (Chrome)
- iPad (Safari)
- Desktop browsers (Chrome, Firefox, Safari)
- TV display (larger screen in kiosk mode)

---

## Future Refactoring Paths

### Why Design for Future Refactoring?

Starting with a TypeScript monolith for rapid MVP development, but building in **escape hatches** for future needs:
- Performance bottlenecks (calendar sync, complex calculations)
- Scaling to many families (multi-tenancy)
- Specialized requirements (work calendar agent already planned in Go)

### Extracting Services to Go (or Other Languages)

The service layer pattern makes this straightforward:

**Current (TypeScript monolith)**:
```
API Route → ChoreService (TS) → ChoreRepository (TS) → Supabase
```

**After extraction (Go microservice)**:
```
API Route → HTTP call to Go service → ChoreService (Go) → PostgreSQL
```

**Frontend doesn't change** because it calls the API client, which can be updated to call a different endpoint.

**Steps to extract a service**:

1. **Create Go service** with same interface (REST API)
2. **Update API client** to point to new endpoint
3. **Migrate data access** from Supabase client to direct PostgreSQL
4. **Add authentication** (validate JWT tokens from Supabase)
5. **Deploy separately** (Docker, Kubernetes, etc.)
6. **Monitor and iterate**

**Example services that might benefit from extraction**:
- `CalendarSyncService` - Lots of I/O, benefits from Go's concurrency
- `ScreenTimeService` - Performance-critical, real-time calculations
- `PaymentService` - Complex calculations, might want separate security boundary

### Microservices Architecture (Future)

If Family Panel scales to serve many families:

```
┌─────────────────────────────────────┐
│   Next.js Frontend + API Gateway    │
└──────────┬──────────────────────────┘
           │
           ├─→ Chore Service (Go)
           ├─→ Calendar Service (Go)
           ├─→ Screen Time Service (Go)
           ├─→ User/Auth Service (TypeScript or Go)
           └─→ Notification Service (future)
```

Each service:
- Owns its database schema
- Exposes REST or gRPC API
- Independently deployable
- Scales independently

**Note**: This is **overkill for MVP** and even for a single-family deployment. Only consider if:
- Serving many families (multi-tenancy)
- Specific performance bottlenecks identified
- Team size justifies the operational complexity

### Database Migration Paths

**Current**: Supabase (managed PostgreSQL + auth + real-time)

**Future options**:

1. **Self-hosted Supabase**: Same API, but on your infrastructure
2. **Direct PostgreSQL**: Swap `SupabaseClient` for `pg` or `Prisma`
3. **Different database**: Repository pattern makes this easier, but still significant work

### Deployment Alternatives

**Current**: Vercel (serverless, edge network)

**Future options**:

1. **Self-hosted Next.js**: Docker container on VPS or home server
2. **Separate frontend/backend**: Frontend on Vercel/Netlify, backend on AWS/GCP
3. **Kubernetes**: If scaling to many families and want orchestration

---

## Deployment

### Development Environment

**Prerequisites**:
- Node.js 18+
- npm or yarn
- Supabase account (or local Supabase via Docker)

**Setup**:
```bash
npm install
cp .env.example .env.local
# Configure Supabase URL and keys in .env.local
npm run dev
```

**Local development server**: `http://localhost:3000`

### Staging/Production (Vercel)

**Deployment flow**:
1. Push code to GitHub
2. Vercel auto-deploys to preview URL (per branch/PR)
3. Merge to `main` → auto-deploys to production

**Environment variables** (configured in Vercel dashboard):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

**Build command**: `npm run build`
**Output directory**: `.next`

**Edge functions**: Next.js API routes run as Vercel serverless functions

### Self-Hosting (Future)

**Docker**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose** (with local Supabase):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=http://supabase:8000
  supabase:
    image: supabase/supabase:latest
    # ... Supabase configuration
```

---

## Security Considerations

### Data Privacy

- Family data is sensitive (kids' names, schedules, etc.)
- Supabase hosted on AWS with encryption at rest and in transit
- Option to self-host for full control

### Authentication

- Passwords hashed with bcrypt (Supabase default)
- Kid PINs also hashed (not stored plaintext)
- Session tokens are JWT with short expiration (1 hour) and refresh tokens

### Authorization

- Row-Level Security (RLS) in PostgreSQL as **defense in depth**
- Even if API routes have bugs, database enforces access control
- Kids cannot escalate privileges (role is immutable by users)

### Work Calendar Agent

- Runs on user's device (work laptop)
- Calendar data never leaves their device until filtered/anonymized
- API token stored encrypted locally
- User controls what gets synced

### Input Validation

- All API routes validate inputs with Zod or similar
- Prevent SQL injection (Supabase uses parameterized queries)
- Prevent XSS (React escapes by default)

---

## Appendix: Technology Alternatives Considered

### Why Not Native Mobile Apps?

**Decision**: PWA instead of React Native or Swift/Kotlin

**Rationale**:
- Single codebase for all platforms
- Web skills (React/TypeScript) reusable
- Instant updates (no app store delays)
- Good enough UX for this use case

**Trade-offs**:
- PWAs have some limitations (push notifications on iOS, etc.)
- Less native feel than true native apps

### Why Not Python/Django or Ruby/Rails?

**Decision**: TypeScript/Next.js instead of traditional server-side frameworks

**Rationale**:
- Single language (TypeScript) for frontend and backend
- Better real-time support (WebSockets) than traditional request/response
- Serverless deployment model (Vercel) is simpler than managing servers
- Modern tooling and ecosystem

**Trade-offs**:
- Node.js can be slower than Go or Rust for CPU-intensive tasks (mitigated by service extraction plan)

### Why Not Firebase?

**Decision**: Supabase instead of Firebase

**Rationale**:
- Open source (Supabase) vs. proprietary (Firebase)
- PostgreSQL (relational, powerful) vs. Firestore (NoSQL, limitations)
- Can self-host Supabase
- More control over database schema and queries

**Trade-offs**:
- Firebase has more mature client SDKs and offline support
- Firebase has better mobile push notification support

---

## Conclusion

Family Panel's architecture balances **rapid MVP development** with **future flexibility**. By using established patterns (service layer, repository pattern) and clear boundaries, we can:

1. **Ship quickly** with a TypeScript monolith
2. **Refactor later** when needs arise (Go services, microservices, different database)
3. **Scale progressively** without rewrites

The key is **modularity**: every layer is replaceable without affecting the others.

---

**Questions or suggestions?** Update this document as the architecture evolves.
