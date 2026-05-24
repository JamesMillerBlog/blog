#!/usr/bin/env bash
set -euo pipefail

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

FINDINGS_FILE=".pre-push-review/findings.md"
VERDICT_FILE=".pre-push-review/verdict"
mkdir -p .pre-push-review
rm -f "$FINDINGS_FILE" "$VERDICT_FILE"

cleanup() {
	echo ""
	echo "→ Review interrupted. Stopping containers..."
	docker compose down --remove-orphans 2>/dev/null || true
	exit 130
}
trap cleanup INT TERM

REVIEW_OK=false

# Try Docker claude first — --verbose streams tool calls so you see live progress.
echo "→ Running pre-push review via claude (Docker)..."
if bash scripts/claude.sh -p \
	--model sonnet \
	--allowedTools "Agent,Bash(git add*),Bash(git diff*),Bash(git rev-parse*),Bash(bash scripts/pre-push*),Read" \
	<.claude/prompts/pre-push-review.md; then
	REVIEW_OK=true
else
	echo "✗ Docker claude review failed — trying pi..."
fi

# Fallback: Docker pi
if [ "$REVIEW_OK" != true ]; then
	echo "→ Running pre-push review via pi (Docker)..."
	if bash scripts/pi.sh --print \
		--provider opencode-go \
		--api-key "${OPENCODE_API_KEY:-}" \
		--agent-team-subagent-skills disabled \
		<.pi/prompts/pre-push-review.md; then
		REVIEW_OK=true
	else
		echo "✗ No AI available for pre-push review. Blocking push."
		exit 1
	fi
fi

# Write verdict based on findings file (AI writes this per the prompt)
if [ -f "$FINDINGS_FILE" ] && grep -qE 'SAFE TO PUSH|PUSH WITH CAUTION' "$FINDINGS_FILE"; then
	echo "SAFE" >"$VERDICT_FILE"
else
	echo "ISSUES" >"$VERDICT_FILE"
fi
exit 0
