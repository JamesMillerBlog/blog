#!/bin/bash
set -euo pipefail

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1
export PI_CACHE_RETENTION=long

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 \"your question or task\"" >&2
  echo "       echo \"your question\" | $0" >&2
  exit 1
fi

# Accept question from args or stdin
if [[ $# -gt 0 ]]; then
  QUESTION="$*"
else
  QUESTION="$(cat)"
fi

COUNCIL_PROMPT="$(cat .pi/prompts/council.md)

${QUESTION}"

printf '%s' "$COUNCIL_PROMPT" | $PI --model "opencode-go/deepseek-v4-pro"
