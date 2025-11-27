# Parallel Agent Workflow Guide

This guide explains how to run multiple AI agents in parallel on different beads issues using separate repository clones.

## Overview

Run multiple agents simultaneously on different issues with complete isolation:
- Each agent works in its own full repository clone
- Full beads daemon support (auto-sync, MCP server, background watching)
- Configuration automatically synced via git
- Scales to any number of concurrent agents

## Why Separate Clones (Not Worktrees)?

**Git worktrees don't work with beads daemon mode** because they share the same `.beads/beads.db` database. With worktrees you lose:
- ❌ Auto-sync (no automatic commit/push)
- ❌ MCP server support
- ❌ Background watching for remote changes

**Separate clones preserve all beads features:**
- ✅ Full daemon mode with auto-sync
- ✅ Complete isolation between agents
- ✅ Simple configuration management via git
- ✅ Better dev container support

**Minor trade-offs:**
- Additional disk space (~100-500MB per clone)
- Initial clone time (~10-60 seconds per clone)

See [beads Git Integration Guide](https://github.com/steveyegge/beads/blob/main/docs/GIT_INTEGRATION.md#git-worktrees) for details.

## Architecture

```
~/Projects/family-panel/              # Main workspace (human interaction)
├── .git/                             # Full repository
├── .beads/                           # Issue database
├── .claude/settings.json             # Tracked in git (project-wide)
└── ...                               # Your code

~/Projects/family-panel-workers/      # Agent clones
├── agent-1/                          # Persistent agent slot 1
│   ├── .git/                         # Independent git repository
│   ├── .beads/                       # Independent database + daemon
│   ├── .claude/settings.json         # Synced via git pull
│   └── ...                           # Code on feature branch
│
└── agent-2/                          # Persistent agent slot 2
    ├── .git/                         # Independent git repository
    ├── .beads/                       # Independent database + daemon
    ├── .claude/settings.json         # Synced via git pull
    └── ...                           # Code on feature branch
```

## Workflow Pattern

Create 2-3 permanent clones that you reuse for multiple issues over time.

**Pros:**
- No repeated cloning overhead
- Stable daemon instances
- Faster agent startup

**Cons:**
- Need to track which slot is available
- Must clean up branches between uses

**Best for:** Regular parallel agent work

### Initial Setup

```bash
mkdir ~/Projects/family-panel-workers
cd ~/Projects/family-panel-workers

# Clone for agent slot 1
git clone ~/Projects/family-panel agent-1
cd agent-1
bd init
cd ..

# Clone for agent slot 2
git clone ~/Projects/family-panel agent-2
cd agent-2
bd init
cd ..

# Clone for agent slot 3 (optional)
git clone ~/Projects/family-panel agent-3
cd agent-3
bd init
```

## Daily Workflow

### 1. Check Available Work

```bash
cd ~/Projects/family-panel
bd ready --json | jq '.[] | {id: .id, title: .title, priority: .priority}'
```

### 2. Launch Agent

```bash
# Use agent-1 for issue bd-a1b2
cd ~/Projects/family-panel-workers/agent-1

# Sync with main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/bd-a1b2-short-description

# Claim the issue (daemon auto-syncs!)
bd update bd-a1b2 --status in_progress

# Launch Claude Code
claude

# Or open in VS Code (with dev container support)
code .
```

**Agent instructions to include in initial message:**

```
You are working on issue bd-a1b2 in a dedicated clone.

Before starting work:
1. Verify you're on the feature/bd-a1b2-short-description branch
2. Run: bd show bd-a1b2
3. Work on the issue, committing code + .beads/issues.jsonl together

When complete:
1. Mark issue as blocked: bd update bd-a1b2 --status blocked --notes "Waiting for PR review. Work complete: <summary>"
2. Create PR with mcp__github__create_pull_request
   - IMPORTANT: Include [bd-a1b2] in PR title for automatic issue closure
3. PR will be reviewed and merged by human
4. GitHub Action will automatically close the beads issue when PR is merged

If you discover new work during implementation:
bd create "Issue found" -p 1 --deps discovered-from:bd-a1b2 --json

The daemon is running, so changes will auto-sync.
```

### 3. Launch Additional Agents (Parallel Work)

```bash
# In another terminal, use agent-2 for issue bd-f14c
cd ~/Projects/family-panel-workers/agent-2
git checkout main
git pull origin main
git checkout -b feature/bd-f14c-other-description
bd update bd-f14c --status in_progress
claude-code
```

### 4. Agent Completes Work

The agent will:
1. Commit changes with conventional commits format
2. Mark issue as blocked pending review:
   ```bash
   bd update bd-a1b2 --status blocked --notes "Waiting for PR review. Work complete: <summary>"
   ```
3. Create pull request using GitHub MCP:
   ```bash
   # Use mcp__github__create_pull_request
   # IMPORTANT: Include issue ID in PR title [bd-a1b2]
   # This enables automatic closure when PR is merged
   ```

### 5. After PR Merged

When you merge the PR on GitHub:
- **GitHub Action automatically closes the beads issue**
- No manual `bd close` needed
- The updated `.beads/issues.jsonl` is committed to main automatically

Then clean up the agent clone:
```bash
# In agent-1 clone
cd ~/Projects/family-panel-workers/agent-1
git checkout main
git pull origin main  # Gets the auto-closed issue update
git branch -d feature/bd-a1b2-short-description

# Ready for next issue!
```

## Helper Scripts

### scripts/launch-agent.sh

```bash
#!/bin/bash
# Launch an agent in a persistent slot or ephemeral clone
# Usage: ./scripts/launch-agent.sh <issue-id> <description> [slot-number]
#
# Examples:
#   ./scripts/launch-agent.sh bd-a1b2 "add user auth" 1
#   ./scripts/launch-agent.sh bd-f14c "fix timer bug"

set -e

ISSUE_ID=$1
DESCRIPTION=$2
SLOT=$3

MAIN_WORKSPACE=~/Projects/family-panel
WORKERS_DIR=~/Projects/family-panel-workers

if [ -z "$ISSUE_ID" ] || [ -z "$DESCRIPTION" ]; then
    echo "Usage: $0 <issue-id> <description> [slot-number]"
    echo ""
    echo "Examples:"
    echo "  $0 bd-a1b2 'add user auth' 1        # Use persistent slot 1"
    echo "  $0 bd-f14c 'fix timer bug'          # Create ephemeral clone"
    exit 1
fi

# Determine clone path
if [ -n "$SLOT" ]; then
    # Persistent slot pattern
    CLONE_PATH="$WORKERS_DIR/agent-$SLOT"
    PATTERN="persistent"
else
    # Ephemeral clone pattern
    CLONE_PATH="$WORKERS_DIR/agent-$ISSUE_ID"
    PATTERN="ephemeral"
fi

BRANCH_NAME="feature/$ISSUE_ID-$(echo "$DESCRIPTION" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"

echo "🚀 Launching agent for $ISSUE_ID"
echo "   Pattern: $PATTERN"
echo "   Clone: $CLONE_PATH"
echo "   Branch: $BRANCH_NAME"
echo ""

if [ "$PATTERN" = "persistent" ]; then
    # Check if slot exists
    if [ ! -d "$CLONE_PATH" ]; then
        echo "❌ Slot $SLOT does not exist. Creating it..."
        git clone "$MAIN_WORKSPACE" "$CLONE_PATH"
        cd "$CLONE_PATH"
        bd init
    fi

    cd "$CLONE_PATH"

    # Check if slot is clean
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: Slot $SLOT has uncommitted changes"
        git status
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Sync with main
    git checkout main
    git pull origin main

else
    # Ephemeral clone
    if [ -d "$CLONE_PATH" ]; then
        echo "❌ Clone already exists at $CLONE_PATH"
        echo "   Delete it first: rm -rf $CLONE_PATH"
        exit 1
    fi

    git clone "$MAIN_WORKSPACE" "$CLONE_PATH"
    cd "$CLONE_PATH"
    bd init
fi

# Create feature branch
git checkout -b "$BRANCH_NAME"

# Claim the issue
echo ""
echo "📋 Claiming issue $ISSUE_ID..."
bd update "$ISSUE_ID" --status in_progress

echo ""
echo "✅ Agent environment ready!"
echo ""
echo "Next steps:"
echo "  cd $CLONE_PATH"
echo "  claude-code"
echo ""
echo "Or open in VS Code:"
echo "  code $CLONE_PATH"
```

### scripts/cleanup-agent.sh

```bash
#!/bin/bash
# Clean up agent clone after work is complete
# Usage: ./scripts/cleanup-agent.sh <issue-id-or-slot>
#
# Examples:
#   ./scripts/cleanup-agent.sh 1              # Clean persistent slot 1
#   ./scripts/cleanup-agent.sh bd-a1b2        # Delete ephemeral clone

set -e

IDENTIFIER=$1
WORKERS_DIR=~/Projects/family-panel-workers

if [ -z "$IDENTIFIER" ]; then
    echo "Usage: $0 <issue-id-or-slot>"
    echo ""
    echo "Examples:"
    echo "  $0 1              # Reset persistent slot 1 to main"
    echo "  $0 bd-a1b2        # Delete ephemeral clone for bd-a1b2"
    exit 1
fi

# Determine if it's a slot number or issue ID
if [[ "$IDENTIFIER" =~ ^[0-9]+$ ]]; then
    # Persistent slot
    CLONE_PATH="$WORKERS_DIR/agent-$IDENTIFIER"
    PATTERN="persistent"
else
    # Ephemeral clone (issue ID)
    CLONE_PATH="$WORKERS_DIR/agent-$IDENTIFIER"
    PATTERN="ephemeral"
fi

if [ ! -d "$CLONE_PATH" ]; then
    echo "❌ Clone not found: $CLONE_PATH"
    exit 1
fi

echo "🧹 Cleaning up: $CLONE_PATH"
echo "   Pattern: $PATTERN"
echo ""

cd "$CLONE_PATH"

if [ "$PATTERN" = "persistent" ]; then
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: Uncommitted changes detected"
        git status
        read -p "Discard changes and reset? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting cleanup."
            exit 1
        fi
        git reset --hard
    fi

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)

    # Switch to main and pull
    git checkout main
    git pull origin main

    # Delete feature branch if it exists
    if [ "$CURRENT_BRANCH" != "main" ]; then
        git branch -D "$CURRENT_BRANCH" 2>/dev/null || true

        # Optionally delete remote branch
        REMOTE_BRANCH="origin/$CURRENT_BRANCH"
        if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
            read -p "Delete remote branch $CURRENT_BRANCH? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push origin --delete "$CURRENT_BRANCH"
                echo "✅ Deleted remote branch"
            fi
        fi
    fi

    echo ""
    echo "✅ Slot $IDENTIFIER reset to main and ready for next issue"

else
    # Ephemeral clone - just delete it
    cd ..

    read -p "Delete entire clone at $CLONE_PATH? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CLONE_PATH"
        echo "✅ Deleted ephemeral clone for $IDENTIFIER"
    else
        echo "Aborting cleanup."
        exit 1
    fi
fi
```

### Make scripts executable

```bash
chmod +x scripts/launch-agent.sh
chmod +x scripts/cleanup-agent.sh
```

## Configuration Management

### .claude/settings.json (Project-Wide)

Track project-wide Claude Code settings in git:

```json
{
  "approvals": {
    "bash": {
      "alwaysAllow": ["bd", "git status", "git diff", "git log"]
    }
  }
}
```

Changes sync automatically via git:
1. Agent updates settings in their clone
2. Commits with code changes
3. Push to remote
4. Other clones: `git pull` gets updated settings

## Dev Container Support

Each clone can run in its own isolated dev container.

### Setup

`.devcontainer/devcontainer.json` is tracked in git and automatically available in each clone:

```json
{
  "name": "Family Panel Dev",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
  "postCreateCommand": "npm install && bd init --quiet",
  "customizations": {
    "vscode": {
      "settings": {
        "claude-code.dangerouslySkipPermissions": true
      }
    }
  },
  "mounts": [
    "source=${localEnv:HOME}/.config/claude,target=/home/vscode/.config/claude,type=bind,consistency=cached"
  ]
}
```

### Usage

```bash
# Open clone in VS Code
code ~/Projects/family-panel-workers/agent-1

# In VS Code: CMD+Shift+P → "Reopen in Container"
# Each container instance is completely isolated
```

**Benefits:**
- Complete sandboxing (safe for `--dangerously-skip-permissions`)
- Each agent in separate container instance
- No shared state between containers
- Consistent environment across agents

## Coordination Between Agents

### Issue Claims

Before starting work, agents should sync with main:

```bash
git pull origin main  # Get latest issue state
bd ready              # See current available work
```

### Race Condition Handling

Small window for race conditions when claiming issues. Mitigation:

1. **Manual assignment** - Tell each agent which issue to work on
2. **Agent Mail** (optional) - Provides <100ms coordination between agents
3. **Handle gracefully** - If two agents claim same issue, one picks different work

### Agent Mail (Optional)

For <100ms real-time coordination (recommended for 3+ concurrent agents):

```bash
# In each clone
bd daemon start --agent-mail
```

Provides instant updates when issues are claimed/updated without git sync latency.

## Best Practices

1. **Always sync before claiming work** - `git pull origin main` first
2. **Use descriptive branch names** - Include issue ID and short description
3. **Commit .beads/issues.jsonl with code** - Keeps issue state in sync
4. **Push frequently** - Makes work visible to other agents
5. **Use persistent slots for regular work** - Avoids clone overhead
6. **Use ephemeral clones for maximum isolation** - No state carryover
7. **Track slot availability** - Use a simple file or comment to note which slots are busy

### Tracking Slot Usage

Create `~/Projects/family-panel-workers/SLOTS.md`:

```markdown
# Agent Slot Status

- **agent-1**: Working on bd-a1b2 (user auth) - started 2025-11-27
- **agent-2**: Available
- **agent-3**: Working on bd-f14c (timer fix) - started 2025-11-27
```

## Troubleshooting

### Issue: Clone already exists when launching agent

**Solution:**
```bash
# Check if it's already in use
cd ~/Projects/family-panel-workers/agent-bd-a1b2
git status

# If abandoned, delete it
cd ..
rm -rf agent-bd-a1b2
```

### Issue: Daemon not running in clone

**Solution:**
```bash
cd ~/Projects/family-panel-workers/agent-1
bd daemon status
bd daemon start  # If not running
```

### Issue: Agent can't see recently created issues

**Solution:**
```bash
# Sync with main first
git pull origin main
bd ready  # Now shows latest issues
```

### Issue: Uncommitted changes in persistent slot

**Solution:**
```bash
cd ~/Projects/family-panel-workers/agent-1
git status
git stash  # Save changes temporarily
# Or
git reset --hard  # Discard changes (careful!)
```

### Issue: Disk space running low

**Solutions:**
1. Use shallow clones: `git clone --depth 1`
2. Clean up old ephemeral clones: `rm -rf agent-*`
3. Use fewer persistent slots
4. Prune git objects: `git gc --aggressive`

## Comparison: Persistent vs Ephemeral

| Factor | Persistent Slots | Ephemeral Clones |
|--------|------------------|------------------|
| Setup time | Once (~30s) | Per issue (~30s) |
| Disk space | 2-3x repo size | Grows with parallel work |
| Isolation | Good | Perfect |
| Cleanup | Reset to main | Delete directory |
| State carryover | Possible | None |
| Best for | Regular parallel work | Maximum isolation |

## Advanced: Multiple Machines

The same workflow works across machines:

```bash
# Machine A: Desktop
cd ~/Projects/family-panel-workers/agent-1
git checkout -b feature/bd-a1b2-auth
bd update bd-a1b2 --status in_progress
# Work, commit, push

# Machine B: Laptop
git pull origin main  # Gets bd-a1b2 status update
bd ready              # Shows bd-a1b2 is in_progress
# Pick different issue
```

Beads syncs issue state via git across machines automatically.

## See Also

- [AGENTS.md](./AGENTS.md) - Main agent workflow guide
- [CLAUDE.md](./CLAUDE.md) - Claude Code project instructions
- [beads Git Integration](https://github.com/steveyegge/beads/blob/main/docs/GIT_INTEGRATION.md) - Official beads git documentation