#!/bin/bash
# Go to the project root directory
cd "$(dirname "$0")/.."

# Fetch latest changes from remote
git fetch origin main

# Get local and remote commit hashes
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

# If they don't match, pull and rebuild
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "=========================================="
    echo "New commit detected on main. Deploying..."
    echo "=========================================="
    git pull origin main
    docker compose up -d --build
    echo "Auto-deploy complete."
else
    echo "No new changes detected."
fi
