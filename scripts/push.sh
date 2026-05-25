#!/usr/bin/env bash
set -eo pipefail

git -c alias.push= push "$@"
bash scripts/generate-pr.sh
