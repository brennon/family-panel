# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See [AGENTS.md](./AGENTS.md) for workflow details.

## Project Overview

Family Panel is a new project currently in the early setup phase. The codebase uses **Beads (bd)** for issue tracking instead of traditional markdown-based task management.

**Parallel Agent Support**: This project supports running multiple AI agents in parallel on different issues using separate repository clones. See [PARALLEL_AGENTS.md](./PARALLEL_AGENTS.md) for details.

## 🚨 MANDATORY WORKFLOW - READ THIS FIRST 🚨

**CRITICAL**: Never commit directly to main. Always follow this workflow:

1. **Create a branch** for EVERY issue:
   ```bash
   git checkout -b feature/fp-<issue-id>-<short-description>
   ```

2. **Do your work** on the feature branch

3. **Run quality checks** (REQUIRED before committing):
   ```bash
   npm run lint        # Must pass
   npm run type-check  # Must pass
   ```

4. **Mark issue as blocked** pending review:
   ```bash
   bd update fp-<id> --status blocked --notes "Work complete. Awaiting PR review."
   ```

5. **Commit your changes** (includes .beads/issues.jsonl with blocked status):
   ```bash
   git add .
   git commit -m "feat(scope): description [fp-<id>]"
   ```

6. **Push your branch**:
   ```bash
   git push -u origin feature/fp-<id>-description
   ```

7. **Create a PR** for human review:
   ```bash
   gh pr create --title "feat: description [fp-<id>]" --body "description"
   ```

8. **Never merge to main yourself** - wait for human approval

❌ **DO NOT**:
- Commit directly to main
- Push to main
- Skip lint/type-check
- Merge PRs yourself
- Close issues before PR is merged

See [AGENTS.md](./AGENTS.md) for complete workflow details.

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Date Utilities**: date-fns

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev              # Runs on http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run type-check

# Run linter
npm run lint
```

## Project Structure

```
/app               # Next.js App Router pages and layouts
/components        # React components (includes /ui for shadcn components)
/lib               # Utility functions and helpers
/services          # API clients and external service integrations
/types             # TypeScript type definitions
/supabase          # Database migrations and Supabase setup
  /migrations      # SQL migration files (numbered)
```

## Database Migrations

**IMPORTANT**: When creating database migrations:
- Store SQL files in `supabase/migrations/` with numbered prefixes (e.g., `001_initial_schema.sql`)
- Migrations are **NOT automatically applied** - they must be run manually in Supabase
- Include migration instructions in PR description
- See `docs/DEPLOYMENT.md` for complete migration workflow

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```
