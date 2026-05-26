#!/bin/bash
set -euo pipefail

PR_NUMBER="$1"
PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1
export PI_CACHE_RETENTION=long

echo "=== Running Kimi PR review on PR #${PR_NUMBER} ===" >&2

REVIEW_PROMPT="$(cat .pi/prompts/ai-pr-review.md)

---

## PR to Review

PR Number: ${PR_NUMBER}"

printf '%s' "$REVIEW_PROMPT" \
  | $PI --model "opencode-go/kimi-k2.6" \
  2>&1 \
  | sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g' \
  | tee /tmp/kimi-review-output.txt

if [[ -f /tmp/kimi-review.md ]]; then
  gh pr comment "$PR_NUMBER" --body "$(cat /tmp/kimi-review.md)"
else
  gh pr comment "$PR_NUMBER" --body "## 🔍 Independent PR Review (Kimi K2.6)

$(cat /tmp/kimi-review-output.txt)"
fi
