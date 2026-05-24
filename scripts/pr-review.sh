#!/usr/bin/env bash
set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"
: "${OPENCODE_API_KEY:?OPENCODE_API_KEY is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"

PROMPT=$(cat .pi/prompts/pr-review.md)

REVIEW_OUTPUT=$(pi --print \
  --provider opencode-go \
  --api-key "$OPENCODE_API_KEY" \
  --agent-team-subagent-skills disabled \
  "$PROMPT" 2>&1) || true

if [[ -z "$REVIEW_OUTPUT" ]]; then
  echo "pi produced no output — skipping PR comment."
  exit 0
fi

gh pr review "$PR_NUMBER" --comment --body "$REVIEW_OUTPUT"
