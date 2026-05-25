#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

git config --local alias.push '!bash scripts/push.sh'
echo "✓ git push alias configured (push → pre-push hook → push → generate PR)"
