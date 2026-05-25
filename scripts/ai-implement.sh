#!/bin/bash
set -euo pipefail

MAX_ITERATIONS=10
PI="pi --agent-team-subagent-skills disabled"

pi_run() {
  local model="$1"
  local prompt="$2"
  local outfile="$3"
  printf '%s' "$prompt" | $PI --model "$model" 2>&1 | tee "$outfile"
}

pr_comment() {
  local pr="$1"
  local body="$2"
  gh pr comment "$pr" --body "$body" || true
}

# --- Phase 1: Implement ---
echo "=== Implementing ===" >&2

IMPLEMENT_PROMPT="$(cat .pi/prompts/ai-issue-implement.md)

---

## Issue to Implement

**Number:** #${ISSUE_NUMBER}
**Title:** ${ISSUE_TITLE}
**Branch:** ${BRANCH}

**Description:**
${ISSUE_BODY}"

pi_run "opencode-go/deepseek-v4-pro" "$IMPLEMENT_PROMPT" /tmp/impl-output.txt

# --- Phase 2: Push branch and create draft PR ---
echo "=== Pushing branch ===" >&2
git push origin "${BRANCH}"

echo "=== Creating draft PR ===" >&2
CI=true pnpm pr:generate --draft 2>/dev/null || \
  gh pr create \
    --title "feat: ${ISSUE_TITLE}" \
    --body "Closes #${ISSUE_NUMBER}" \
    --draft \
    --head "${BRANCH}" || true

PR_NUMBER=$(gh pr view "${BRANCH}" --json number --jq '.number' 2>/dev/null || echo "")
if [[ -z "$PR_NUMBER" ]]; then
  echo "Failed to create PR" >&2
  exit 1
fi
echo "PR #${PR_NUMBER} created" >&2

# Post implementation log
pr_comment "$PR_NUMBER" "## 🤖 Phase 1 — Implementation Complete

**Model:** deepseek-v4-pro
**Branch:** \`${BRANCH}\`

<details>
<summary>Full implementation session log</summary>

\`\`\`
$(cat /tmp/impl-output.txt)
\`\`\`

</details>"

# --- Phase 3: Pre-push review loop ---
FINAL_VERDICT="UNKNOWN"
ITER=0

for ITER in $(seq 1 $MAX_ITERATIONS); do
  echo "=== Pre-push review iteration ${ITER}/${MAX_ITERATIONS} ===" >&2

  REVIEW_PROMPT="$(cat .pi/prompts/pre-push-review.md)"
  pi_run "opencode-go/deepseek-v4-pro" "$REVIEW_PROMPT" "/tmp/review-${ITER}.txt"

  VERDICT=$(grep -oE 'SAFE TO PUSH|DO NOT PUSH|PUSH WITH CAUTION' "/tmp/review-${ITER}.txt" | tail -1 || echo "UNKNOWN")
  FINAL_VERDICT="$VERDICT"

  pr_comment "$PR_NUMBER" "## 🔍 Pre-Push Review — Iteration ${ITER}/${MAX_ITERATIONS}

$(cat "/tmp/review-${ITER}.txt")

---
**Verdict:** \`${VERDICT}\`"

  if [[ "$VERDICT" == "SAFE TO PUSH" ]]; then
    echo "Review passed on iteration ${ITER}" >&2
    break
  fi

  if [[ $ITER -eq $MAX_ITERATIONS ]]; then
    pr_comment "$PR_NUMBER" "⚠️ **Max review iterations (${MAX_ITERATIONS}) reached.** Proceeding with current state. Manual review required."
    break
  fi

  # Fix issues
  echo "=== Fixing review findings (iteration ${ITER}) ===" >&2

  FIX_PROMPT="The pre-push review found issues that must be fixed before pushing.

Read the review findings below carefully, fix all CRITICAL and HIGH severity issues, then commit with:
git add -A && git commit -m 'fix: address pre-push review findings (iteration ${ITER})'

If pre-commit hooks fail when committing, fix those errors too before finishing.

## Review Findings

$(cat "/tmp/review-${ITER}.txt")"

  pi_run "opencode-go/deepseek-v4-pro" "$FIX_PROMPT" "/tmp/fix-${ITER}.txt"

  if ! git push origin "${BRANCH}"; then
    echo "Warning: push failed after iteration ${ITER} fixes" >&2
    pr_comment "$PR_NUMBER" "⚠️ Push failed after iteration ${ITER} fixes — branch may be out of sync."
  fi

  pr_comment "$PR_NUMBER" "## 🔧 Fixes Applied — Iteration ${ITER}

<details>
<summary>Fix session log</summary>

\`\`\`
$(cat "/tmp/fix-${ITER}.txt")
\`\`\`

</details>"

done

# --- Phase 4: Final PR body ---
echo "=== Generating PR body ===" >&2
CI=true pnpm pr:generate 2>/dev/null || true

pr_comment "$PR_NUMBER" "## ✅ Implementation Complete

**Review verdict:** \`${FINAL_VERDICT}\`
**Iterations:** completed ${ITER}/${MAX_ITERATIONS}

Kimi independent review running next..."
