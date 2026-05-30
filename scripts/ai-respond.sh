#!/bin/bash
set -euo pipefail

PR_NUMBER="$1"
BRANCH="$2"
INSTRUCTION="${3:-}"
PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

if [[ -z "$INSTRUCTION" ]]; then
  echo "Error: no instruction provided" >&2
  exit 1
fi

echo "=== Responding to PR comment on #${PR_NUMBER} ===" >&2

PR_CONTEXT=$(gh pr view "$PR_NUMBER" --json title,body | jq -r '"Title: \(.title)\n\nBody: \(.body)"')
PR_DIFF=$(gh pr diff "$PR_NUMBER" 2>/dev/null | head -500 || echo "(diff unavailable)")

RESPOND_PROMPT="$(cat .pi/prompts/ai-pr-respond.md)

---

## PR Context

${PR_CONTEXT}

## Current Diff (first 500 lines)

\`\`\`diff
${PR_DIFF}
\`\`\`

## Instruction from Repo Owner

${INSTRUCTION}"

printf '%s' "$RESPOND_PROMPT" \
  | $PI --model "opencode-go/deepseek-v4-pro" \
  2>&1 | tee /tmp/respond-output.txt

if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "fix: action PR comment feedback" || true
fi

cat > /tmp/ai-respond-result.md << EOFRESULT
## 🤖 OpenCode Response

**Instruction actioned:** ${INSTRUCTION}

<details>
<summary>Full session log</summary>

\`\`\`
$(cat /tmp/respond-output.txt)
\`\`\`

</details>
EOFRESULT
