#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

# Override `git push` to also generate the PR after a successful push.
# `-c alias.push=` clears the alias for that one invocation so git runs the
# built-in push command instead of recursing back into this alias.
# Args are validated to reject shell metacharacters before being forwarded to git push.
git config --local alias.push '!f() { for arg in "$@"; do case "$arg" in *[\;\`\$\(\)\{\}\|\&\<\>\\\"\']*) echo "git push: rejected unsafe argument: $arg" >&2; exit 1;; esac; done; git -c alias.push= push "$@"; bash scripts/generate-pr.sh; }; f'
echo "✓ git push alias configured (push → pre-push hook → push → generate PR)"
