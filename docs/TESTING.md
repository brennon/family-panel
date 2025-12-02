# Testing Guide

This document describes the testing infrastructure and practices for Family Panel.

## Overview

The project uses a comprehensive testing strategy with three levels of testing:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test API routes and service interactions
3. **End-to-End (E2E) Tests** - Test complete user workflows using Playwright

## Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **Playwright** - E2E browser testing
- **@edge-runtime/jest-environment** - Edge Runtime environment for API route tests
- **MSW (Mock Service Worker)** - API mocking for integration tests

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npx playwright test --ui

# Run specific E2E test file
npx playwright test e2e/auth.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test --headed
```

## Project Structure

```
/app/api/auth/pin-login/__tests__/       # API route tests (auth)
/app/api/chore-assignments/__tests__/    # API route tests (chore assignments)
/app/api/chores/__tests__/               # API route tests (chores)
/app/login/__tests__/                    # Component tests
/lib/services/__tests__/                 # Service layer tests
/lib/repositories/__tests__/             # Repository layer tests
/e2e/                                    # E2E tests
/lib/test-utils/                         # Shared test utilities
jest.config.ts                            # Jest configuration
jest.setup.ts                             # Global test setup
playwright.config.ts                      # Playwright configuration
```

## Unit and Integration Testing

### Jest Configuration

Our Jest setup (in `jest.config.ts`) uses:
- `next/jest` for Next.js-specific transformations
- Custom test environment based on file location:
  - API routes: `@edge-runtime/jest-environment` (Edge Runtime)
  - React components: `jest-environment-jsdom` (DOM environment)
- Global setup in `jest.setup.ts` for Supabase client mocks

### Writing API Route Tests

API routes run in the Edge Runtime environment and require special mocking.

**Example**: `app/api/auth/pin-login/__tests__/route.test.ts`

```typescript
import { POST } from '../route';
import { createAdminClient } from '@/lib/supabase/server';

// Mock the Supabase client factory
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn(),
}));

describe('POST /api/auth/pin-login', () => {
  let mockAdminClient: any;

  beforeEach(() => {
    // Set up mock admin client with expected behavior
    mockAdminClient = {
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-id', email: 'kid@example.com', name: 'Kid', role: 'kid' },
          error: null,
        }),
      })),
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

    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully authenticate with valid PIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'kid-id', pin: '1234' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe('mock-token-hash');
    expect(mockAdminClient.rpc).toHaveBeenCalledWith('validate_kid_pin', {
      p_user_id: 'kid-id',
      p_pin: '1234',
    });
  });

  it('should reject invalid PIN format', async () => {
    const request = new Request('http://localhost:3000/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'kid-id', pin: 'abc' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('PIN must be 4 digits');
  });
});
```

**Key patterns for API route tests**:
- Mock `createClient` or `createAdminClient` from `@/lib/supabase/server`
- Create `Request` objects with appropriate method and body
- Call the route handler directly (e.g., `POST(request)`)
- Assert on response status and JSON body
- Verify mock calls to ensure correct database interactions
- Test authentication and authorization (401, 403 responses)
- Test input validation (400 responses)

**Additional examples**:
- `app/api/chore-assignments/__tests__/route.test.ts` - GET/POST with query params and authorization
- `app/api/chore-assignments/[id]/complete/__tests__/route.test.ts` - PATCH with dynamic routes
- `app/api/chores/__tests__/route.test.ts` - Full CRUD operations with role-based access

### Writing Component Tests

Component tests use React Testing Library and run in a jsdom environment.

**Example**: `app/login/__tests__/page.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { useAuth } from '@/lib/auth/context';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/auth/context');
jest.mock('next/navigation');

describe('LoginPage', () => {
  const mockSignIn = jest.fn();
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });

    mockGet.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render parent login form by default', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should switch to kid login mode', () => {
    render(<LoginPage />);

    const kidLoginButton = screen.getByRole('button', { name: /kid login/i });
    fireEvent.click(kidLoginButton);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument();
  });

  it('should call signIn with PIN when kid form is submitted', async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<LoginPage />);

    // Switch to kid mode
    fireEvent.click(screen.getByRole('button', { name: /kid login/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'user-id-123' },
    });
    fireEvent.change(screen.getByLabelText(/pin code/i), {
      target: { value: '1234' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user-id-123', '1234', 'pin');
    });
  });
});
```

**Key patterns for component tests**:
- Mock external dependencies (auth context, router, etc.)
- Use `screen.getByRole()` for accessible queries
- Use `fireEvent` to simulate user interactions
- Use `waitFor()` for asynchronous assertions
- Reset mocks between tests with `jest.clearAllMocks()`

### Writing Service Layer Tests

Service layer tests verify business logic without database dependencies.

**Example**: `lib/services/__tests__/chore-assignment-service.test.ts`

```typescript
import { ChoreAssignmentService } from '../chore-assignment-service';
import { ChoreAssignmentRepository } from '@/lib/repositories';

// Mock the repository
jest.mock('@/lib/repositories', () => ({
  ChoreAssignmentRepository: jest.fn(),
}));

describe('ChoreAssignmentService', () => {
  let service: ChoreAssignmentService;
  let mockRepository: jest.Mocked<ChoreAssignmentRepository>;

  beforeEach(() => {
    // Create mock repository with Jest mock functions
    mockRepository = {
      create: jest.fn(),
      findByDate: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new ChoreAssignmentService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignChore', () => {
    it('should create a chore assignment', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockAssignment);

      const result = await service.assignChore(
        'chore-1',
        'kid-1',
        new Date('2024-01-15')
      );

      expect(result).toEqual(mockAssignment);
      expect(mockRepository.create).toHaveBeenCalledWith({
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15'),
      });
    });

    it('should throw error when repository fails', async () => {
      mockRepository.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.assignChore('chore-1', 'kid-1', new Date('2024-01-15'))
      ).rejects.toThrow('Failed to assign chore');
    });
  });
});
```

**Key patterns for service tests**:
- Mock repository layer completely
- Test business logic and error handling
- Verify correct repository methods are called with correct arguments
- Test both success and failure scenarios
- Keep tests focused on single service method

### Writing Repository Layer Tests

Repository layer tests verify database interaction and data transformation.

**Example**: `lib/repositories/__tests__/chore-assignment-repository.test.ts`

```typescript
import { ChoreAssignmentRepository } from '../chore-assignment-repository';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('ChoreAssignmentRepository', () => {
  let repository: ChoreAssignmentRepository;
  let mockSupabase: any;
  let mockFrom: any;

  beforeEach(() => {
    // Setup mock query builder
    mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(() => mockFrom),
    } as unknown as SupabaseClient;

    repository = new ChoreAssignmentRepository(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByDate', () => {
    it('should return assignments for a specific date', async () => {
      const mockDbData = [
        {
          id: '1',
          chore_id: 'chore-1',
          user_id: 'kid-1',
          assigned_date: '2024-01-15',
          completed: false,
          completed_at: null,
          created_at: '2024-01-14T00:00:00Z',
          updated_at: '2024-01-14T00:00:00Z',
        },
      ];

      mockFrom.eq.mockResolvedValue({
        data: mockDbData,
        error: null,
      });

      const result = await repository.findByDate(new Date('2024-01-15'));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        choreId: 'chore-1',
        userId: 'kid-1',
        assignedDate: new Date('2024-01-15T00:00:00.000Z'),
        completed: false,
        completedAt: null,
        createdAt: new Date('2024-01-14T00:00:00Z'),
        updatedAt: new Date('2024-01-14T00:00:00Z'),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chore_assignments');
      expect(mockFrom.select).toHaveBeenCalledWith('*');
      expect(mockFrom.eq).toHaveBeenCalledWith('assigned_date', '2024-01-15');
    });
  });
});
```

**Key patterns for repository tests**:
- Mock Supabase client and query builder
- Test database transformation (snake_case to camelCase, strings to Dates)
- Verify correct database queries are built
- Test error handling (database errors, not found)
- Test filtering and query options

### Test Utilities

Shared test utilities live in `lib/test-utils/`:

**`lib/test-utils/supabase-mock.ts`** - Reusable Supabase client mocks:

```typescript
export const createMockSupabaseClient = (overrides = {}) => {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      ...overrides.auth,
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    ...overrides,
  };
};
```

## End-to-End Testing

### Playwright Configuration

E2E tests use Playwright to test the application in real browsers. Configuration in `playwright.config.ts` includes:
- Base URL: `http://localhost:3001` (agent-1) or appropriate port
- Browsers: Chromium, Firefox, WebKit
- Screenshot on failure
- Video recording for failures
- Retries: 2 (CI), 0 (local)

### Prerequisites for E2E Tests

Before running E2E tests, ensure:

1. **Database is set up with test data**:
   ```bash
   # Wipe database (if needed)
   # Apply migrations 001-006 in order
   # Migration 005 creates test users with deterministic UUIDs
   ```

2. **Environment variables are set**:
   ```bash
   # .env.local must include:
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Dev server is running**:
   ```bash
   npm run dev
   ```

### Writing E2E Tests

E2E tests simulate real user interactions in a browser.

**Example**: `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * Authentication E2E tests
 *
 * PREREQUISITES:
 * 1. Wipe database completely
 * 2. Run all migrations in order (001-006)
 * 3. Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY set
 *
 * Test users created by seed data:
 * - parent@example.com (password: parentpassword123)
 * - kid1@example.com (Alice Kid, PIN: 1234)
 * - kid2@example.com (Bob Kid, PIN: 5678)
 */

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

    // Should redirect to dashboard (can take 10-30s in dev mode)
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 });

    // Should show parent's name
    await expect(page.getByText(/john parent/i).first()).toBeVisible();
  });

  test('kid can log in with PIN', async ({ page }) => {
    // Switch to kid login
    await page.getByRole('button', { name: /kid login/i }).click();

    // Wait for kid form to be visible
    await expect(page.getByLabel(/your name/i)).toBeVisible();

    // Fill in kid login form
    await page.getByLabel(/your name/i).fill('00000000-0000-0000-0000-000000000002');
    await page.getByLabel(/pin code/i).fill('1234');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 });

    // Should show kid's name (use first() to handle multiple matches)
    await expect(page.getByText(/alice kid/i).first()).toBeVisible();
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
    await expect(page.getByText(/invalid pin or user id/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

**Key patterns for E2E tests**:
- Use `page.goto()` to navigate
- Use `page.getByRole()`, `page.getByLabel()`, `page.getByText()` for accessible queries
- Use `expect(page).toHaveURL()` for navigation assertions
- Use `.first()` when multiple elements match to avoid ambiguity
- Increase timeouts for slow operations (dashboard loads can take 10-30s in dev)
- Document prerequisites clearly at the top of test files

### Debugging E2E Tests

```bash
# Run with UI mode for interactive debugging
npx playwright test --ui

# Run in headed mode to see browser
npx playwright test --headed

# Run in debug mode with step-through
npx playwright test --debug

# View test report after run
npx playwright show-report

# Generate and view trace
npx playwright test --trace on
```

## CI/CD Integration

Tests are automatically run in CI via GitHub Actions (see `.github/workflows/test.yml`).

**CI Pipeline**:
1. Checkout code
2. Install dependencies
3. Run type checking (`npm run type-check`)
4. Run linting (`npm run lint`)
5. Run unit/integration tests (`npm test`)
6. Start dev server in background
7. Run E2E tests (`npm run test:e2e`)
8. Upload test artifacts (screenshots, videos, coverage)

**Branch Protection**:
- All tests must pass before merging to main
- Coverage thresholds enforced (if configured)

## Test Coverage

Generate coverage reports:

```bash
# Run tests with coverage
npm test -- --coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

**Coverage targets** (not yet enforced):
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## Best Practices

### General
1. **Test behavior, not implementation** - Test what users see and do, not internal implementation details
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests isolated** - Each test should be independent and not rely on others
4. **Mock external dependencies** - Database, APIs, third-party services
5. **Use descriptive test names** - Test names should clearly describe what is being tested

### Unit/Integration Tests
1. **Reset mocks between tests** - Always use `jest.clearAllMocks()` in `afterEach`
2. **Test edge cases** - Not just happy path, but errors, empty states, loading states
3. **Mock at module boundary** - Mock imports, not internal functions
4. **Use factories for test data** - Create reusable test data builders

### E2E Tests
1. **Document prerequisites** - Clearly state database state, environment variables needed
2. **Use deterministic test data** - Seed data with known IDs for reproducibility
3. **Handle async properly** - Use `waitFor` and appropriate timeouts
4. **Clean up after tests** - Reset state if tests modify data
5. **Group related tests** - Use `describe` blocks to organize test suites

## Troubleshooting

### Common Issues

**Jest tests failing with "Cannot find module 'next/jest'"**:
- Ensure `next` is installed: `npm install next`
- Check `jest.config.ts` uses correct path

**API route tests failing with "Headers is not defined"**:
- Ensure using `@edge-runtime/jest-environment` for API route tests
- Check `jest.config.ts` testEnvironment configuration

**E2E tests timing out on dashboard load**:
- Increase timeout: `await expect(page).toHaveURL('/dashboard', { timeout: 30000 })`
- Ensure dev server is running and accessible
- Check for slow build times in dev mode (Turbopack compiles on demand)

**E2E tests failing to find elements**:
- Use `.first()` if multiple elements match
- Check element is visible: `await expect(element).toBeVisible()`
- Increase wait times for dynamic content

**Database state issues in E2E tests**:
- Wipe and re-seed database before test runs
- Ensure migrations 001-006 applied in order
- Verify test user credentials match seed data

## Future Enhancements

- [ ] Visual regression testing with Percy or Chromatic
- [ ] API contract testing with Pact
- [ ] Performance testing with Lighthouse CI
- [ ] Load testing for API endpoints
- [ ] Mutation testing with Stryker
- [ ] Test data factories and fixtures library
- [ ] Parallel test execution optimization
- [ ] Custom Jest matchers for common assertions
