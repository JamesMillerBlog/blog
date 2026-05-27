#!/bin/bash
set -e

DRAFT_FLAG=""
if [[ "${1:-}" == "--draft" ]]; then
  DRAFT_FLAG="--draft"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD | tr -cd '[:alnum:]/_.-' | cut -c1-80)

[[ -z "$BRANCH" ]] && { echo "fatal: could not determine branch name"; exit 1; }

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "On main/master, skipping PR generation."
  exit 0
fi

command -v gh >/dev/null 2>&1 || { echo "gh CLI not found. Please install it."; exit 1; }

if [[ "${CI:-false}" != "true" ]]; then
  gh auth status >/dev/null 2>&1 || { echo "gh not authenticated. Please run 'gh auth login'."; exit 1; }
  command -v claude >/dev/null 2>&1 || { echo "claude CLI not found. Please install it."; exit 1; }
fi

# Push the branch before creating/updating the PR so Claude doesn't need push permission.
if [[ "${CI:-false}" != "true" ]]; then
  git push origin "$BRANCH" 2>&1 || true
fi

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
  echo "-> Requesting AI to update PR #$PR_NUMBER..."
  PROMPT_ACTION="6. Run: gh pr edit \"${PR_NUMBER}\" --body '<filled template content>'"
  PROMPT_INTRO="Update PR #${PR_NUMBER} for branch: ${BRANCH}."
  FALLBACK="AI failed to update PR. Run manually: gh pr edit ${PR_NUMBER}"
else
  echo "-> Requesting AI to create PR for branch ${BRANCH}..."
  DRAFT_ARG=""
  [[ -n "$DRAFT_FLAG" ]] && DRAFT_ARG=" --draft"
  PROMPT_ACTION="6. Run: gh pr create${DRAFT_ARG} --title '<conventional commit title: must start with feat:|fix:|chore:|docs:|refactor:|perf:|test: followed by short description>' --body '<filled template content>'"
  PROMPT_INTRO="Create a PR for branch: ${BRANCH}."
  FALLBACK="AI failed to create PR. Run manually: gh pr create"
fi

if [[ "${CI:-false}" == "true" ]]; then
  printf '%s\n%s\n%s' "${PROMPT_INTRO}" "${PROMPT_STEPS}" "${PROMPT_ACTION}" \
    | pi --agent-team-subagent-skills disabled --model opencode-go/deepseek-v4-flash \
    2>&1 || echo "$FALLBACK"
else
  printf '%s\n%s\n%s' "${PROMPT_INTRO}" "${PROMPT_STEPS}" "${PROMPT_ACTION}" \
    | claude -p --model haiku --allowedTools "Bash(git log*),Bash(git diff*),Bash(gh pr*),Read" \
    2>&1 || echo "$FALLBACK"
fi
