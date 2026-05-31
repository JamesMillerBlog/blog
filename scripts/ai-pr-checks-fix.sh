#!/bin/bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER not set}"
BRANCH="${BRANCH:?BRANCH not set}"
FIX_ITER="${FIX_ITER:-1}"
FAILURES="${FAILURES:?FAILURES not set}"

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

# Parse failures as JSON (fall back to plain text if not valid JSON)
FAILURES_JSON=$(printf '%s' "$FAILURES" | jq -c '.' 2>/dev/null || echo '')

if [[ -n "$FAILURES_JSON" ]]; then
  FAILURES_TEXT=$(printf '%s' "$FAILURES_JSON" | \
    jq -r '.[] | "- \(.type): \(.message)"' 2>/dev/null || printf '%s' "$FAILURES")
  CHECK_TYPES=$(printf '%s' "$FAILURES_JSON" | \
    jq -r '[.[].type] | join(", ")' 2>/dev/null || true)
  VERIFY_SECTION=$(printf '%s' "$FAILURES_JSON" | \
    jq -r '.[] | "- \(.type): run `\(.verification_steps[0] // "n/a")`"' 2>/dev/null || true)
else
  FAILURES_TEXT="$FAILURES"
  CHECK_TYPES=""
  VERIFY_SECTION=""
fi

COMMIT_MSG="fix(ci): resolve failing checks (iteration ${FIX_ITER})"
if [[ -n "$CHECK_TYPES" ]]; then
  COMMIT_MSG="${COMMIT_MSG}

Checks fixed: ${CHECK_TYPES}"
fi

FIX_PROMPT="The following automated CI checks are failing on PR #${PR_NUMBER}. Fix all issues so the checks pass.

Read the relevant files to understand context before making changes.

Each check includes \`verification_steps\` — shell commands that exit 0 when the issue is resolved. After making your changes, run each verification step. If any fail, adjust your fix and try again. Maximum 3 attempts per check — if verification still fails after 3 attempts, commit what you have and note the failure in the commit message.

Do NOT modify scripts/ai-pr-checks-fix.sh — this script is currently executing and modifying it causes a bash read error.

After fixing all issues and verifying, commit with:
git add -A && git commit -m \"${COMMIT_MSG}\"

Do NOT push — the CI pipeline handles that.

## Failing Checks

${FAILURES_TEXT}

## Verification Steps

${VERIFY_SECTION}

## Check Definitions

- BUILD_FAILED: \`cd web && pnpm build\` exited non-zero. Fix compilation/build errors.
- TYPECHECK_FAILED: \`tsc --noEmit --skipLibCheck\` reported errors. Fix TypeScript type errors.
- CONSOLE_LOG: \`console.log\` found in changed non-test source files. Remove or replace with proper logging.
- SECRET_PATTERN: A secret pattern (GitHub token, AWS key, private key) was detected in new diff lines. Remove the secret immediately."

printf '%s' "$FIX_PROMPT" | \
  PI_CACHE_RETENTION=long timeout 30m $PI --model "opencode-go/deepseek-v4-pro" 2>&1 | \
  strip_ansi | tee "/tmp/pr-checks-fix-${FIX_ITER}.txt"

# Post-commit verification: re-run check commands to confirm fix worked.
# verification_steps come from our own ai-criteria-check.sh (not LLM content) so no allowlist needed.
if [[ -n "$FAILURES_JSON" ]]; then
  echo "=== Running post-commit verification ===" >&2
  VERIFY_FAILED=false
  while IFS= read -r STEP; do
    [[ -z "$STEP" ]] && continue
    echo ">> $STEP" >&2
    if ! bash -c "$STEP" 2>&1; then
      echo "VERIFICATION FAILED: $STEP" >&2
      VERIFY_FAILED=true
    fi
  done < <(printf '%s' "$FAILURES_JSON" | \
    jq -r '[.[].verification_steps[]?] | .[]' \
    2>/dev/null || true)

  if [[ "$VERIFY_FAILED" == 'true' ]]; then
    echo "=== Post-commit verification failed — fix is incomplete ===" >&2
    exit 1
  fi
  echo "=== All verification steps passed ===" >&2
fi

echo "Checks fix attempt ${FIX_ITER} complete" >&2
