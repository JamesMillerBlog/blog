#!/bin/bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER not set}"
BRANCH="${BRANCH:?BRANCH not set}"
FIX_ITER="${FIX_ITER:-1}"

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

echo "=== Fetching latest review from PR #${PR_NUMBER} ===" >&2
REVIEW_BODY=$(gh pr view "$PR_NUMBER" --json comments \
  --jq '[.comments[] | select(.author.login == "github-actions[bot]") | select(.body | test("^[✅⚠️❌] \\*\\*AI Code Review"))] | last | .body' \
  2>/dev/null || true)

if [[ -z "$REVIEW_BODY" ]] && [[ -f /tmp/latest-review.txt ]]; then
  REVIEW_BODY=$(cat /tmp/latest-review.txt)
fi

if [[ -z "$REVIEW_BODY" ]]; then
  echo "No review found to fix" >&2
  exit 1
fi

FIX_PROMPT="The AI code review found CRITICAL and/or HIGH severity issues. Fix all CRITICAL and HIGH issues listed below. Ignore MEDIUM and LOW.

Read the changed files to understand context before making fixes.

After fixing all issues, commit with:
git add -A && git commit -m 'fix(ai-review): address review findings (iteration ${FIX_ITER})'

Do NOT push — the CI pipeline handles that.

## Review Findings

${REVIEW_BODY}"

printf '%s' "$FIX_PROMPT" | \
  PI_CACHE_RETENTION=long timeout 30m $PI --model "opencode-go/deepseek-v4-pro" 2>&1 | \
  strip_ansi | tee "/tmp/pr-review-fix-${FIX_ITER}.txt"

echo "Fix attempt ${FIX_ITER} complete" >&2
