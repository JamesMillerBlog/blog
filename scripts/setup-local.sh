#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

git config --local alias.push '!f() { git push "$@" && bash scripts/generate-pr.sh; }; f'
echo "✓ git push alias configured (push → generate-pr)"
