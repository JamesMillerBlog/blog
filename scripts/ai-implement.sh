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

issue_comment() {
  gh issue comment "$ISSUE_NUMBER" --body "$1" || true
}

pr_comment() {
  gh pr comment "$1" --body "$2" || true
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

issue_comment "## 🤖 Phase 1 — Implementation Complete

**Model:** deepseek-v4-pro
**Branch:** \`${BRANCH}\`

<details>
<summary>Implementation session log</summary>

\`\`\`
$(cat /tmp/impl-output.txt)
\`\`\`

</details>

Starting pre-push review loop..."

# --- Phase 2: Pre-push review loop (all local — before any push) ---
FINAL_VERDICT="UNKNOWN"
ITER=0
REVIEW_SUMMARY=""

for ITER in $(seq 1 $MAX_ITERATIONS); do
  echo "=== Pre-push review iteration ${ITER}/${MAX_ITERATIONS} ===" >&2

  REVIEW_PROMPT="$(cat .pi/prompts/pre-push-review.md)"
  pi_run "opencode-go/deepseek-v4-pro" "$REVIEW_PROMPT" "/tmp/review-${ITER}.txt"

  VERDICT=$(grep -oE 'SAFE TO PUSH|DO NOT PUSH|PUSH WITH CAUTION' "/tmp/review-${ITER}.txt" | tail -1 || echo "UNKNOWN")
  FINAL_VERDICT="$VERDICT"

  issue_comment "## 🔍 Pre-Push Review — Iteration ${ITER}/${MAX_ITERATIONS}

$(cat "/tmp/review-${ITER}.txt")

---
**Verdict:** \`${VERDICT}\`"

  REVIEW_SUMMARY="${REVIEW_SUMMARY}
<details>
<summary>Iteration ${ITER} — ${VERDICT}</summary>

$(cat "/tmp/review-${ITER}.txt")

</details>"

  if [[ "$VERDICT" == "SAFE TO PUSH" ]]; then
    echo "Review passed on iteration ${ITER}" >&2
    break
  fi

  if [[ $ITER -eq $MAX_ITERATIONS ]]; then
    issue_comment "⚠️ **Max review iterations (${MAX_ITERATIONS}) reached.** Proceeding with current state. Manual review required."
    break
  fi

  echo "=== Fixing review findings (iteration ${ITER}) ===" >&2

  FIX_PROMPT="The pre-push review found issues that must be fixed before pushing.

Read the review findings below carefully, fix all CRITICAL and HIGH severity issues, then commit with:
git add -A && git commit -m 'fix: address pre-push review findings (iteration ${ITER})'

If pre-commit hooks fail when committing, fix those errors too before finishing.

## Review Findings

$(cat "/tmp/review-${ITER}.txt")"

  pi_run "opencode-go/deepseek-v4-pro" "$FIX_PROMPT" "/tmp/fix-${ITER}.txt"

  issue_comment "## 🔧 Fixes Applied — Iteration ${ITER}

<details>
<summary>Fix session log</summary>

\`\`\`
$(cat "/tmp/fix-${ITER}.txt")
\`\`\`

</details>"

done

# --- Phase 3: Write review stamp then push (pre-push hook validates stamp) ---
echo "=== Writing review stamp ===" >&2
git rev-parse HEAD > .review-stamp

echo "=== Pushing branch ===" >&2
git push origin "${BRANCH}"

# --- Phase 4: Create draft PR ---
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

# Ensure PR body references the issue for GitHub cross-linking and auto-close on merge
CURRENT_BODY=$(gh pr view "$PR_NUMBER" --json body --jq '.body' 2>/dev/null || echo "")
if ! echo "$CURRENT_BODY" | grep -qiE "closes #${ISSUE_NUMBER}|fixes #${ISSUE_NUMBER}|resolves #${ISSUE_NUMBER}"; then
  gh pr edit "$PR_NUMBER" --body "${CURRENT_BODY}

---
Closes #${ISSUE_NUMBER}" 2>/dev/null || true
fi

# --- Phase 5: Post comprehensive summary to PR ---
pr_comment "$PR_NUMBER" "## 🤖 Implementation + Review Summary

### Phase 1 — Implementation

**Model:** deepseek-v4-pro | **Branch:** \`${BRANCH}\`

<details>
<summary>Implementation session log</summary>

\`\`\`
$(cat /tmp/impl-output.txt)
\`\`\`

</details>

---

### Phase 2 — Pre-Push Review (${ITER} iteration(s)) — Final verdict: \`${FINAL_VERDICT}\`

${REVIEW_SUMMARY}"

# --- Phase 6: Generate final PR body ---
echo "=== Generating PR body ===" >&2
CI=true pnpm pr:generate 2>/dev/null || true

pr_comment "$PR_NUMBER" "## ✅ Implementation Complete

**Review verdict:** \`${FINAL_VERDICT}\`
**Iterations:** ${ITER}/${MAX_ITERATIONS}

Kimi independent review running next..."
