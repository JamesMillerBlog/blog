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

FIX_PROMPT="The following automated CI checks are failing on PR #${PR_NUMBER}. Fix all issues so the checks pass.

Read the relevant files to understand context before making changes.

After fixing all issues, commit with:
git add -A && git commit -m 'fix(ci): resolve failing checks (iteration ${FIX_ITER})'

Do NOT push — the CI pipeline handles that.

## Failing Checks

\`\`\`
${FAILURES}
\`\`\`

## Check Definitions

- BUILD_FAILED: \`cd web && pnpm build\` exited non-zero. Fix compilation/build errors.
- TYPECHECK_FAILED: \`tsc --noEmit --skipLibCheck\` reported errors. Fix TypeScript type errors.
- CONSOLE_LOG: \`console.log\` found in changed non-test source files. Remove or replace with proper logging.
- SECRET_PATTERN: A secret pattern (GitHub token, AWS key, private key) was detected in new diff lines. Remove the secret immediately."

printf '%s' "$FIX_PROMPT" | \
  PI_CACHE_RETENTION=long timeout 30m $PI --model "opencode-go/deepseek-v4-pro" 2>&1 | \
  strip_ansi | tee "/tmp/pr-checks-fix-${FIX_ITER}.txt"

echo "Checks fix attempt ${FIX_ITER} complete" >&2
