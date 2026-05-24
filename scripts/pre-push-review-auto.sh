#!/usr/bin/env bash
set -euo pipefail

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

LOG_FILE=".pre-push-review/last-run.log"
mkdir -p .pre-push-review

# Try Docker claude first
echo "→ Running pre-push review via claude (Docker)..."
if bash scripts/claude.sh -p \
	--model sonnet \
	--allowedTools "Agent,Bash(git add*),Bash(git diff*),Bash(git rev-parse*),Bash(bash scripts/pre-push*),Read" \
	<.claude/prompts/pre-push-review.md 2>&1 | tee "$LOG_FILE"; then
	exit 0
fi
echo "✗ Docker claude review failed — trying pi..."

# Fallback: Docker pi
echo "→ Running pre-push review via pi (Docker)..."
if bash scripts/pi.sh --print \
	--provider opencode-go \
	--api-key "${OPENCODE_API_KEY:-}" \
	--agent-team-subagent-skills disabled \
	<.pi/prompts/pre-push-review.md 2>&1 | tee -a "$LOG_FILE"; then
	exit 0
fi

echo "✗ No AI available for pre-push review. Blocking push."
exit 1
