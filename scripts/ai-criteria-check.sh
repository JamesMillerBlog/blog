#!/bin/bash
set -euo pipefail

FAILURES_JSON='[]'

add_failure() {
  local type="$1" message="$2"
  shift 2
  local steps_json
  steps_json=$(printf '%s\n' "$@" | jq -Rsc 'split("\n") | map(select(. != ""))')
  FAILURES_JSON=$(printf '%s' "$FAILURES_JSON" | jq -c \
    --arg t "$type" --arg m "$message" --argjson v "$steps_json" \
    '. + [{"type": $t, "message": $m, "verification_steps": $v}]')
}

# 1. Build check
echo "=== Build check ===" >&2
if ! (cd web && pnpm build) > /tmp/build-output.txt 2>&1; then
  cat /tmp/build-output.txt
  add_failure 'BUILD_FAILED' 'pnpm build exited non-zero' \
    'cd web && pnpm build'
else
  cat /tmp/build-output.txt
fi

# 2. TypeScript check
echo "=== TypeScript check ===" >&2
if ! (cd web && pnpm exec tsc --noEmit --skipLibCheck) > /tmp/tsc-output.txt 2>&1; then
  cat /tmp/tsc-output.txt
  add_failure 'TYPECHECK_FAILED' 'tsc --noEmit reported errors' \
    'cd web && pnpm exec tsc --noEmit --skipLibCheck'
else
  cat /tmp/tsc-output.txt
fi

# 3. console.log check — changed non-test source files only
echo "=== console.log check ===" >&2
mapfile -t CHANGED_SRC < <(git diff --name-only HEAD~1 2>/dev/null |
  grep -E '\.(ts|tsx|js|jsx)$' |
  grep -v -E '\.(test|spec)\.|/__tests__/' || true)
if [[ ${#CHANGED_SRC[@]} -gt 0 ]]; then
  CONSOLE_HITS=$(printf '%s\0' "${CHANGED_SRC[@]}" |
    xargs -0 grep -n 'console\.log' 2>/dev/null || true)
  if [[ -n "$CONSOLE_HITS" ]]; then
    CONSOLE_SUMMARY=$(printf '%s' "$CONSOLE_HITS" | head -3 | tr '\n' '; ')
    add_failure 'CONSOLE_LOG' \
      "console.log found in changed source files: ${CONSOLE_SUMMARY}" \
      "! grep -rn 'console\\.log' web/src --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' | grep -v -E '\\.(test|spec)\\.|/__tests__/'"
  fi
fi

# 4. Secret pattern scan — new diff lines only
echo "=== Secret pattern scan ===" >&2
NEW_LINES=$(git diff HEAD~1 2>/dev/null | grep '^+' | grep -v '^+++' || true)
SECRET_RE='ghp_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|-----BEGIN (RSA |EC )?PRIVATE KEY'
if printf '%s' "$NEW_LINES" | grep -qE "$SECRET_RE"; then
  MATCH_COUNT=$(printf '%s' "$NEW_LINES" | grep -cE "$SECRET_RE" || true)
  add_failure 'SECRET_PATTERN' \
    "${MATCH_COUNT} secret pattern match(es) in new diff lines — remove secrets before pushing" \
    "! git diff HEAD~1 | grep '^+' | grep -v '^+++' | grep -qE 'ghp_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|-----BEGIN (RSA |EC )?PRIVATE KEY'"
fi

# Report
FAILURE_COUNT=$(printf '%s' "$FAILURES_JSON" | jq 'length')
if [[ "$FAILURE_COUNT" -eq 0 ]]; then
  echo "All criteria passed."
  exit 0
else
  echo "Criteria check FAILED (${FAILURE_COUNT} failure(s)):"
  printf '%s' "$FAILURES_JSON" | jq -r '.[] | "  - \(.type): \(.message)"'
  printf '%s' "$FAILURES_JSON" > /tmp/checks-failures.json
  exit 1
fi
