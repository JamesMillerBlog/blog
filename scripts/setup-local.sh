#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

# Override `git push` to also generate the PR after a successful push.
# `-c alias.push=` clears the alias for that one invocation so git runs the
# built-in push command instead of recursing back into this alias.
git config --local alias.push '!f() { git -c alias.push= push "$@"; __ec=$?; bash scripts/generate-pr.sh; exit $__ec; }; f'
echo "✓ git push alias configured (push → pre-push hook → push → generate PR)"
