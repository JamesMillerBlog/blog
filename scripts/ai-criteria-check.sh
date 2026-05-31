#!/bin/bash
set -euo pipefail

FAILURES=()

# 1. Build check
echo "=== Build check ===" >&2
if ! (cd web && pnpm build 2>&1); then
  FAILURES+=("BUILD_FAILED: pnpm build exited non-zero")
fi

# 2. TypeScript check
echo "=== TypeScript check ===" >&2
if ! (cd web && pnpm exec tsc --noEmit --skipLibCheck 2>&1); then
  FAILURES+=("TYPECHECK_FAILED: tsc --noEmit reported errors")
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
    FAILURES+=("CONSOLE_LOG: $(echo "$CONSOLE_HITS" | head -5)")
  fi
fi

# 4. Secret pattern scan — new diff lines only
echo "=== Secret pattern scan ===" >&2
NEW_LINES=$(git diff HEAD~1 2>/dev/null | grep '^+' | grep -v '^+++' || true)
if echo "$NEW_LINES" | grep -qE 'ghp_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|-----BEGIN (RSA |EC )?PRIVATE KEY'; then
  MATCH_COUNT=$(echo "$NEW_LINES" | grep -cE 'ghp_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|-----BEGIN (RSA |EC )?PRIVATE KEY' || true)
  FAILURES+=("SECRET_PATTERN: ${MATCH_COUNT} match(es) detected in new diff lines — run 'git diff HEAD~1' locally to inspect, then remove secrets before pushing")
fi

# Report
if [[ ${#FAILURES[@]} -eq 0 ]]; then
  echo "All criteria passed."
  exit 0
else
  echo "Criteria check FAILED:"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
