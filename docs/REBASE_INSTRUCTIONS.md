# Repository History Rewrite - Update Instructions

## What Happened

All commit history in this repository has been rewritten to:
- Use correct author: `Brennon Bortz <brennon@brennonbortz.com>`
- Use correct GPG signing key: `8B7119D7B2262D32`

## If You Have Other Clones of This Repository

**IMPORTANT**: You must update all other clones/checkouts to avoid conflicts.

### Option 1: Fresh Clone (Recommended)

The safest approach is to delete your clone and re-clone:

```bash
# Backup any uncommitted work first!
cd /path/to/old/clone
git stash  # if you have uncommitted changes

# Delete the old clone and re-clone
cd ..
rm -rf old-clone-directory
git clone https://github.com/brennon/family-panel.git
cd family-panel

# Apply your stashed work if needed
git stash pop
```

### Option 2: Reset Existing Clone

If you want to keep your existing clone:

```bash
cd /path/to/clone

# Save any uncommitted work
git stash

# Fetch the rewritten history
git fetch origin

# Reset local branches to match remote (WARNING: This discards local commits!)
git checkout main
git reset --hard origin/main

# For feature branches
git checkout feature/fp-29-vercel-deployment
git reset --hard origin/feature/fp-29-vercel-deployment

# Apply your stashed work if needed
git stash pop
```

### Verify the Update

After updating, verify the commits are signed correctly:

```bash
git log --show-signature -1
```

You should see:
- Author: `Brennon Bortz <brennon@brennonbortz.com>`
- GPG signature from key: `5EC785905344E36F1B3F5C9D8B7119D7B2262D32`
- Good signature from "Brennon Bortz <brennon@brennonbortz.com>"

## Update Git Configuration

In each clone, ensure your git config is correct:

```bash
git config user.name "Brennon Bortz"
git config user.email "brennon@brennonbortz.com"
git config user.signingkey "8B7119D7B2262D32"
```

## Parallel Agent Clones

If you're running parallel agents with separate clones (see PARALLEL_AGENTS.md), update each one:

```bash
# For each agent clone directory
cd /path/to/agent-1
git fetch origin
git checkout main
git reset --hard origin/main

cd /path/to/agent-2
git fetch origin
git checkout main
git reset --hard origin/main

# etc...
```
