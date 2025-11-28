# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See [AGENTS.md](./AGENTS.md) for workflow details.

## Project Overview

Family Panel is a new project currently in the early setup phase. The codebase uses **Beads (bd)** for issue tracking instead of traditional markdown-based task management.

**Parallel Agent Support**: This project supports running multiple AI agents in parallel on different issues using separate repository clones. See [PARALLEL_AGENTS.md](./PARALLEL_AGENTS.md) for details.

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
```

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```
