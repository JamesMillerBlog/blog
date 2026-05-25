#!/bin/bash
echo "DEBUG generate-pr.sh: invoked, branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" >&2
set -eo pipefail

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc || { echo "DEBUG generate-pr.sh: .envrc source failed (exit $?)" >&2; }
	set +a
fi
echo "DEBUG generate-pr.sh: past envrc" >&2

BRANCH=$(git rev-parse --abbrev-ref HEAD | tr -cd '[:alnum:]/_.-' | cut -c1-80)

[[ -z "$BRANCH" ]] && {
	echo "fatal: could not determine branch name"
	exit 1
}

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
	echo "On main/master, skipping PR generation."
	exit 0
fi

command -v gh >/dev/null 2>&1 || {
	echo "gh CLI not found. Please install it."
	exit 1
}
gh auth status >/dev/null 2>&1 || {
	echo "gh not authenticated. Please run 'gh auth login'."
	exit 1
}

# PR_NUMBER sourced from GitHub API (integer field) — validated below as defense-in-depth
PR_NUMBER=$(gh pr view "$BRANCH" --json number --jq '.number' 2>/dev/null || true)

if [[ -n "$PR_NUMBER" ]] && ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
	echo "Unexpected PR number format, aborting."
	exit 1
fi

PROMPT_STEPS="Steps:
1. Read .github/pull_request_template.md
2. Run: git log main...HEAD --oneline
3. Run: git diff main...HEAD --stat
4. Generate: concise summary of changes, and a mermaid diagram of affected components/files
5. Fill the template sections (Summary, Changes, Architecture, Test Plan)
Note: PR title must follow conventional commits — start with feat:, fix:, chore:, docs:, refactor:, perf:, or test:"

if [[ -n "$PR_NUMBER" ]]; then
	echo "-> Generating PR update for #$PR_NUMBER..."
	PROMPT_ACTION="6. Run: gh pr edit \"${PR_NUMBER}\" --body '<filled template content>'"
	PROMPT_INTRO="Update PR #${PR_NUMBER} for branch: ${BRANCH}."
	FALLBACK="AI failed to update PR. Run manually: gh pr edit ${PR_NUMBER}"
else
	echo "-> Generating PR for branch ${BRANCH}..."
	PROMPT_ACTION="6. Run: gh pr create --title '<conventional commit title: must start with feat:|fix:|chore:|docs:|refactor:|perf:|test: followed by short description>' --body '<filled template content>'"
	PROMPT_INTRO="Create a PR for branch: ${BRANCH}."
	FALLBACK="AI failed to create PR. Run manually: gh pr create"
fi

PROMPT=$(printf '%s\n%s\n%s' "${PROMPT_INTRO}" "${PROMPT_STEPS}" "${PROMPT_ACTION}")

# Run AI with fallback chain: Docker claude → Docker pi
run_ai() {
	local prompt="$1"
	local prompt_file
	prompt_file=$(mktemp /tmp/pr-prompt-XXXXXX)
	echo "$prompt" >"$prompt_file"

	echo "→ Using claude (Docker) for PR generation..."
	if bash scripts/claude.sh -p --model haiku --allowedTools "Bash(git log*),Bash(git diff*),Bash(gh pr*),Read" <"$prompt_file"; then
		rm -f "$prompt_file"
		return 0
	fi
	echo "✗ Docker claude failed — trying pi..."

	echo "→ Using pi (Docker) for PR generation..."
	if bash scripts/pi.sh --print --no-extensions --provider opencode-go <"$prompt_file"; then
		rm -f "$prompt_file"
		return 0
	fi

	rm -f "$prompt_file"
	return 1
}

if run_ai "$PROMPT"; then
	:
else
	echo "$FALLBACK"
fi
