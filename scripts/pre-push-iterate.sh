#!/usr/bin/env bash
set -euo pipefail

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

MAX_ITERATIONS=10

run_fix() {
	local review_output="$1"

	PROMPT_FILE=$(mktemp)
	trap 'rm -f "$PROMPT_FILE"' RETURN

	cat >"$PROMPT_FILE" <<'PROMPT_EOF'
Fix the CRITICAL and HIGH issues listed in the review output below. Read each finding carefully — fix only what is listed. After fixing:
  1. Run: cd web && pnpm typecheck
  2. Run: cd web && pnpm test
  3. If both pass: git add -A && git commit -m "fix: address pre-push review findings"
  4. If either fails: fix those errors too, then commit.
Do not push. Do not create a PR.
PROMPT_EOF

	echo "" >>"$PROMPT_FILE"
	echo "Review output:" >>"$PROMPT_FILE"
	echo "$review_output" >>"$PROMPT_FILE"

	# Try Docker claude first
	if bash scripts/claude.sh -p \
		--model sonnet \
		--allowedTools "Agent,Bash,Read,Edit,Write" \
		<"$PROMPT_FILE" 2>&1; then
		return 0
	fi

	if bash scripts/pi.sh --print \
		--provider opencode-go \
		--api-key "${OPENCODE_API_KEY:-}" \
		<"$PROMPT_FILE" 2>&1; then
		return 0
	fi

	echo "No AI available for fix pass."
	return 1
}

for i in $(seq 1 $MAX_ITERATIONS); do
	echo "→ Pre-push review (pass $i of $MAX_ITERATIONS)..."

	REVIEW_FILE=$(mktemp /tmp/pre-push-review-XXXXXX)
	bash scripts/pre-push-review-auto.sh 2>&1 | tee "$REVIEW_FILE" || {
		rm -f "$REVIEW_FILE"
		echo "✗ Review runner failed — no AI available. Blocking push."
		exit 1
	}
	REVIEW_OUTPUT=$(cat "$REVIEW_FILE")
	rm -f "$REVIEW_FILE"

	if echo "$REVIEW_OUTPUT" | grep -qE 'SAFE TO PUSH|PUSH WITH CAUTION'; then
		echo "✓ Review passed on pass $i."
		exit 0
	fi

	if [[ $i -lt $MAX_ITERATIONS ]]; then
		echo "→ Issues found — running fix pass $i..."
		run_fix "$REVIEW_OUTPUT" || echo "Fix pass $i had errors — retrying review..."
	fi
done

echo "✗ Review still failing after $MAX_ITERATIONS passes. Blocking push."
exit 1
