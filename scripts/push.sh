#!/usr/bin/env bash
# Called by the git push alias. Runs the real push then generates/updates the PR.
set -eo pipefail

git -c alias.push= push "$@"
bash scripts/generate-pr.sh
