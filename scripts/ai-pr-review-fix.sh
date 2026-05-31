#!/bin/bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER not set}"
BRANCH="${BRANCH:?BRANCH not set}"
FIX_ITER="${FIX_ITER:-1}"
PRIOR_CONTEXT="${PRIOR_CONTEXT:-[]}"

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

# Seed unresolved findings from prior context if available (file won't exist on a fresh runner)
PRIOR_COUNT=$(printf '%s' "$PRIOR_CONTEXT" | jq 'length' 2>/dev/null || echo '0')
if [[ "$PRIOR_COUNT" -gt 0 ]] && [[ ! -f /tmp/unresolved-findings.json ]]; then
  LAST_UNRESOLVED=$(printf '%s' "$PRIOR_CONTEXT" | jq -c 'last | .findings // []' 2>/dev/null || echo '[]')
  LAST_COUNT=$(printf '%s' "$LAST_UNRESOLVED" | jq 'length' 2>/dev/null || echo '0')
  if [[ "$LAST_COUNT" -gt 0 ]]; then
    printf '%s' "$LAST_UNRESOLVED" > /tmp/unresolved-findings.json
    echo "=== Restored ${LAST_COUNT} unresolved finding(s) from prior context ===" >&2
  fi
fi

echo "=== Fetching latest review from PR #${PR_NUMBER} ===" >&2
REVIEW_BODY=$(gh pr view "$PR_NUMBER" --json comments \
  --jq '[.comments[] | select(.author.login == "github-actions") | select(.body | test("^[✅⚠️❌] \\*\\*AI Code Review"))] | last | .body' \
  2>/dev/null || true)

if [[ -z "$REVIEW_BODY" ]] && [[ -f /tmp/latest-review.txt ]]; then
  REVIEW_BODY=$(cat /tmp/latest-review.txt)
fi

if [[ -z "$REVIEW_BODY" ]]; then
  echo "No review found to fix" >&2
  exit 1
fi

# Extract verification steps from review JSON findings
REVIEW_JSON=$(printf '%s' "$REVIEW_BODY" | awk '/```json/{p=1;next} p && /```/{p=0} p' | head -200)

# If a prior delta review left unresolved findings, scope this iteration to those only
if [[ -f /tmp/unresolved-findings.json ]]; then
  UNRESOLVED=$(cat /tmp/unresolved-findings.json)
  UNRESOLVED_COUNT=$(printf '%s' "$UNRESOLVED" | jq 'length' 2>/dev/null || echo '0')
  if [[ "$UNRESOLVED_COUNT" -gt 0 ]]; then
    echo "=== Targeting ${UNRESOLVED_COUNT} unresolved finding(s) from prior delta review ===" >&2
    REVIEW_JSON=$(printf '%s' "$REVIEW_JSON" | \
      jq --argjson keep "$UNRESOLVED" '.findings = $keep' 2>/dev/null || true)
  fi
fi

FINDING_LOCATIONS=$(printf '%s' "$REVIEW_JSON" | \
  jq -r '[.findings[]? | select(.severity == "CRITICAL" or .severity == "HIGH") | .location] | join(", ")' \
  2>/dev/null || true)

COMMIT_MSG="fix(ai-review): address review findings (iteration ${FIX_ITER})"
if [[ -n "$FINDING_LOCATIONS" ]]; then
  COMMIT_MSG="${COMMIT_MSG}

Findings addressed: ${FINDING_LOCATIONS}"
fi

# Build prior-attempt context section if any prior iterations failed
PRIOR_CONTEXT_SECTION=""
PRIOR_COUNT=$(printf '%s' "$PRIOR_CONTEXT" | jq 'length' 2>/dev/null || echo '0')
if [[ "$PRIOR_COUNT" -gt 0 ]]; then
  PRIOR_CONTEXT_SECTION=$(printf '%s' "$PRIOR_CONTEXT" | jq -r \
    '.[] | "### Attempt \(.iter)\nDiff summary:\n```diff\n\(.fix_diff)\n```\nWhy it failed:\n\(.failed_reasons[] | "- \(.location): \(.reason)")"' \
    2>/dev/null || true)
fi

FIX_PROMPT="The AI code review found CRITICAL and/or HIGH severity issues. Fix all CRITICAL and HIGH issues listed below. Ignore MEDIUM and LOW.

Read the changed files to understand context before making fixes.

Each finding includes a \`verification_steps\` array — shell commands that must exit 0 to confirm the fix is correct. After making your changes, run each verification step. If any fail, adjust your fix and try again. Maximum 3 attempts per finding — if verification still fails after 3 attempts, commit what you have and note the failure in the commit message. Only commit once all verification steps pass or the attempt limit is reached.

Do NOT modify scripts/ai-pr-review-fix.sh — this script is currently executing and modifying it causes a bash read error.

After fixing all issues and verifying, commit with:
git add -A && git commit -m \"${COMMIT_MSG}\"

Do NOT push — the CI pipeline handles that."

if [[ -n "$PRIOR_CONTEXT_SECTION" ]]; then
  FIX_PROMPT="${FIX_PROMPT}

## Prior Fix Attempts (all failed — do not repeat these approaches)

${PRIOR_CONTEXT_SECTION}"
fi

FIX_PROMPT="${FIX_PROMPT}

## Review Findings

${REVIEW_BODY}"

printf '%s' "$FIX_PROMPT" | \
  PI_CACHE_RETENTION=long timeout 30m $PI --model "opencode-go/deepseek-v4-pro" 2>&1 | \
  strip_ansi | tee "/tmp/pr-review-fix-${FIX_ITER}.txt"

# Post-commit verification: run each verification_step as a safety net
# (agent should have already run these, but this catches cases where it skipped them)
if [[ -n "$REVIEW_JSON" ]]; then
  echo "=== Running post-commit verification ===" >&2
  VERIFY_FAILED=false
  while IFS= read -r STEP; do
    [[ -z "$STEP" ]] && continue
    # Allowlist: only safe read-only commands to prevent prompt-injection via review findings
    if ! [[ "$STEP" =~ ^(bash\ -n\ |actionlint\ |yamllint\ |grep\ |'! grep '|python3\ -m\ py_compile\ ) ]]; then
      echo "SKIPPED (not in allowlist): $STEP" >&2
      continue
    fi
    # Skip if the required tool is not installed on this runner
    TOOL=$(printf '%s' "$STEP" | awk '{print $1}')
    if [[ "$TOOL" != 'bash' && "$TOOL" != 'grep' && "$TOOL" != '!' ]] && \
       ! command -v "$TOOL" >/dev/null 2>&1; then
      echo "SKIPPED (tool not installed: ${TOOL}): $STEP" >&2
      continue
    fi
    echo ">> $STEP" >&2
    if ! bash -c "$STEP" 2>&1; then
      echo "VERIFICATION FAILED: $STEP" >&2
      VERIFY_FAILED=true
    fi
  done < <(printf '%s' "$REVIEW_JSON" | \
    jq -r '[.findings[]? | select(.severity == "CRITICAL" or .severity == "HIGH") | .verification_steps[]?] | .[]' \
    2>/dev/null || true)

  if [[ "$VERIFY_FAILED" == 'true' ]]; then
    echo "=== Post-commit verification failed — fix is incomplete ===" >&2
    exit 1
  fi
  echo "=== All verification steps passed ===" >&2
fi

echo "Fix attempt ${FIX_ITER} complete" >&2
