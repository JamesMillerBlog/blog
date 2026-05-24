#!/usr/bin/env bash
set -euo pipefail

if command -v claude >/dev/null 2>&1; then
  echo "→ Running pre-push review via claude..."
  claude -p \
    --model sonnet \
    --allowedTools "Agent,Bash(git add*),Bash(git diff*),Bash(git rev-parse*),Bash(bash scripts/pre-push*),Read" \
    < .claude/prompts/pre-push-review.md \
    && exit 0
  echo "✗ Claude review failed — trying pi..."
fi

if command -v pi >/dev/null 2>&1 && [[ -n "${OPENCODE_API_KEY:-}" ]]; then
  echo "→ Running pre-push review via pi..."
  pi --print \
    --provider opencode-go \
    --api-key "$OPENCODE_API_KEY" \
    --agent-team-subagent-skills disabled \
    < .pi/prompts/pre-push-review.md \
    && exit 0
  echo "✗ pi review failed."
  exit 1
fi

echo "✗ No AI available for pre-push review (claude not found, pi not found or OPENCODE_API_KEY not set)."
exit 1
