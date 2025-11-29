# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Family Panel project.

## Workflows

### test.yml

**Purpose**: Run quality checks and tests on every pull request and push to main.

**Jobs**:
1. **quality-checks** - Runs ESLint and TypeScript type checking
2. **unit-tests** - Runs Jest unit and integration tests with coverage reporting
3. **build** - Verifies the application builds successfully

**Artifacts**:
- Coverage reports (retained for 30 days)
- Test results (retained for 30 days)
- Build output (retained for 7 days)

**Triggers**:
- Pull requests to `main` branch
- Direct pushes to `main` branch

### close-beads-issue.yml

**Purpose**: Automatically close beads issues when their PRs are merged.

**Jobs**:
1. **close-issue** - Extracts issue ID from PR title, closes the issue, and commits the updated beads database

**Triggers**:
- Pull request closed (only runs if actually merged, not just closed)

## E2E Tests in CI

E2E tests are currently **disabled** in the test workflow because they require Supabase credentials and a test database.

### Enabling E2E Tests

To enable E2E tests in CI:

1. **Set up a test Supabase project** (recommended: separate from production):
   - Create a new Supabase project for CI testing
   - Run all migrations (001-006) to set up the schema
   - Run migration 005 to create test users with deterministic UUIDs

2. **Configure GitHub secrets**:
   Go to repository Settings → Secrets and variables → Actions, and add:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep this secret!)

3. **Uncomment E2E job in test.yml**:
   ```yaml
   # Remove the comment markers from the e2e-tests job
   # in .github/workflows/test.yml (lines ~78-135)
   ```

4. **Commit and push** the changes

### E2E Test Considerations

**Database State Management**:
- E2E tests expect deterministic test data (created by migration 005)
- Tests may modify data, so consider:
  - Using database transactions that roll back after tests
  - Re-seeding data between test runs
  - Using a fresh database for each CI run (slow but clean)

**Parallel Testing**:
- Currently configured to run E2E tests sequentially
- For parallel execution, consider:
  - Multiple test databases
  - Database isolation strategies
  - Playwright sharding configuration

**Performance**:
- E2E tests can take 5-10 minutes to run
- Consider running only on specific branches or with manual triggers
- Use Playwright UI mode locally for faster debugging

## Local Testing

Run the same checks that CI runs:

```bash
# Quality checks
npm run lint
npm run type-check

# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# Build verification
npm run build

# E2E tests (requires local Supabase setup)
npm run dev &  # Start dev server in background
npm run test:e2e
```

## Troubleshooting

### Tests fail in CI but pass locally

1. **Check Node.js version**: CI uses Node 20, ensure local matches
2. **Clean install**: CI uses `npm ci`, try running that locally
3. **Check environment variables**: Ensure all required env vars are set in CI
4. **Review logs**: Check the Actions tab for detailed error messages

### Flaky E2E tests

1. **Increase timeouts**: E2E tests can be slow in CI environments
2. **Add explicit waits**: Use `waitFor` or `expect(element).toBeVisible()` with timeouts
3. **Check database state**: Ensure seed data is consistent
4. **Network delays**: Mock external APIs or increase retry counts

### Coverage drops unexpectedly

1. **Check if new code is tested**: Review coverage report artifacts
2. **Ensure all branches are covered**: Add tests for error paths and edge cases
3. **Review excluded files**: Check jest.config.ts for coverage exclusions

## Future Enhancements

- [ ] Add coverage thresholds that fail the build if coverage drops
- [ ] Implement visual regression testing with Percy or Chromatic
- [ ] Add performance budgets with Lighthouse CI
- [ ] Set up automatic dependency updates with Dependabot
- [ ] Add security scanning with CodeQL or Snyk
- [ ] Implement automatic PR labeling based on changed files
- [ ] Add PR size checks and warnings for large PRs
