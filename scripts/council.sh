#!/bin/bash
set -euo pipefail

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1
export PI_CACHE_RETENTION=long

if [[ $# -eq 0 ]]; then
  echo "Error: no question provided." >&2
  echo "Usage: $0 \"your question or task\"" >&2
  exit 1
fi

QUESTION="$*"

# Substitute <QUESTION> placeholder in the prompt template
COUNCIL_PROMPT="$(sed "s|<QUESTION>|${QUESTION}|g" .pi/prompts/council.md)"

printf '%s' "$COUNCIL_PROMPT" | $PI --model "opencode-go/deepseek-v4-pro"
