# AGENTS.md

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Create a branch**: Always create a new branch for your work
   - Format: `<type>/<issue-id>-<short-description>`
   - Examples: `feature/family-panel-5-chore-service`, `fix/family-panel-12-timer-bug`
   - Use git: `git checkout -b feature/family-panel-5-chore-service`
4. **Work on it**: Implement, test, document
5. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
6. **Sync before finalizing**: Before committing your final changes, pull latest from main and rebase
   - `git fetch origin`
   - `git rebase origin/main`
   - If conflicts occur, resolve them intelligently:
     - For code conflicts: analyze both changes and merge logically
     - For `.beads/issues.jsonl`: the beads merge driver should handle automatically, but if manual resolution needed, preserve both issue updates
     - After resolving: `git add .` and `git rebase --continue`
   - This ensures your changes apply cleanly on top of latest main
7. **Run quality checks**: **REQUIRED** before closing any issue
   - `npm run lint` - Must pass with no errors
   - `npm run type-check` - Must pass with no errors
   - Fix any issues before proceeding
   - This ensures code quality and prevents broken builds
8. **Mark as blocked pending review**: Update issue status to indicate work is complete but awaiting human review
   - `bd update <id> --status blocked --notes "Waiting for PR review. Work complete: <brief summary of changes>"`
   - This signals the issue is done but needs human approval before closing
9. **Commit with Conventional Commits**: Use clear, conventional commit messages
   - Format: `<type>(<scope>): <subject> [<issue-id>]`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Examples:
     - `feat(chores): add chore assignment service [family-panel-5]`
     - `fix(timer): correct remaining time calculation [family-panel-13]`
     - `docs(readme): update installation instructions [family-panel-1]`
   - Always include the issue ID in brackets at the end
10. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state
11. **Create pull request**: Use GitHub CLI to create PR for review
   - Use with appropriate title and description (e.g., `gh pr create --title "feat: add feature [family-panel-5]" --body <PR DESCRIPTION>`)
   - **IMPORTANT**: Include issue ID in PR title in brackets (e.g., `feat: add feature [family-panel-5]`)
   - The bracketed issue ID enables automatic closure when PR is merged
   - Describe changes, testing done, and any review notes in PR body
12. **Automatic closure**: When human merges the PR, a GitHub Action will automatically:
   - Extract the issue ID from PR title
   - Close the beads issue with reason "PR #<number> merged"
   - Commit the updated `.beads/issues.jsonl` back to main
   - No manual `bd close` needed!

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### MCP Server (Recommended)

The Beads MCP server is available. Wherever available, prefer its `mcp__beads__*` functions instead of `bd` CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**
- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**
```
# AI planning documents (ephemeral)
history/
```

**Benefits:**
- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ✅ Create a new branch for each issue
- ✅ Use Conventional Commits format with issue IDs
- ✅ **Run `npm run lint` and `npm run type-check` before closing any issue**
- ✅ Push branches for human review before merging
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents
- ❌ Do NOT merge to main without human review
- ❌ Do NOT commit directly to main branch

## Parallel Agent Workflows

This project supports running multiple AI agents in parallel on different issues. Each agent works in a separate repository clone with complete isolation.

**Key points:**
- Multiple agents can work simultaneously on different issues
- Each agent has its own clone of the repository
- Full beads daemon support (auto-sync, MCP server) in each clone
- Configuration syncs automatically via git
- **Do NOT use git worktrees** - they break beads daemon mode

**For detailed setup and workflow instructions, see:**
- [PARALLEL_AGENTS.md](./PARALLEL_AGENTS.md) - Complete guide for running multiple agents

**Quick reference:**
```bash
# Before claiming work, always sync
git pull origin main

# Claim your assigned issue
bd update bd-a1b2 --status in_progress

# Work normally - daemon handles auto-sync
# Commit code + .beads/issues.jsonl together
# Push your branch when done
```