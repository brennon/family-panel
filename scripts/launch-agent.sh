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

MAIN_WORKSPACE=$HOME/Projects/family-panel
WORKERS_DIR=$HOME/Projects/family-panel-workers

if [ -z "$ISSUE_ID" ] || [ -z "$DESCRIPTION" ] || [ -z "$SLOT" ]; then
    echo "Usage: $0 <issue-id> <description> <slot-number>"
    echo ""
    echo "Examples:"
    echo "  $0 bd-a1b2 'add user auth' 1        # Use persistent slot 1"
    exit 1
fi

# Determine clone path
CLONE_PATH="$WORKERS_DIR/agent-$SLOT"

BRANCH_NAME="feature/$ISSUE_ID-$(echo "$DESCRIPTION" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"

echo "🚀 Launching agent for $ISSUE_ID"
echo "   Clone: $CLONE_PATH"
echo "   Branch: $BRANCH_NAME"
echo ""

# Check if slot exists
if [ ! -d "$CLONE_PATH" ]; then
    echo "❌ Slot $SLOT does not exist. Creating it..."
    git clone "$MAIN_WORKSPACE" "$CLONE_PATH"
    cd "$CLONE_PATH"
    bd init

    # Copy .env.local from main workspace and update PORT for this slot
    if [ -f "$MAIN_WORKSPACE/.env.local" ]; then
        cp "$MAIN_WORKSPACE/.env.local" .env.local
        PORT_NUMBER=$((3000 + SLOT))
        sed -i.bak "s/^PORT=.*/PORT=$PORT_NUMBER/" .env.local
        rm .env.local.bak
        echo "✅ Copied .env.local and set PORT=$PORT_NUMBER"
    else
        echo "⚠️  Warning: $MAIN_WORKSPACE/.env.local not found, creating minimal .env.local"
        PORT_NUMBER=$((3000 + SLOT))
        echo "PORT=$PORT_NUMBER" > .env.local
    fi
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

# Report port configuration
if [ -f .env.local ]; then
    PORT_NUMBER=$(grep "^PORT=" .env.local | cut -d= -f2)
    echo "   Port: $PORT_NUMBER"
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
echo "  claude"
echo ""
echo "Or open in VS Code:"
echo "  code $CLONE_PATH"
