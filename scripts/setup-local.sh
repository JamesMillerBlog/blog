#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

# Override `git push` to also generate the PR after a successful push.
# scripts/push.sh runs the real push (with alias cleared to prevent recursion)
# then calls generate-pr.sh. Using an explicit bash script avoids /bin/sh quirks
# on macOS where inline alias commands after `git push` silently don't execute.
git config --local alias.push '!bash scripts/push.sh'
echo "✓ git push alias configured (push → pre-push hook → push → generate PR)"
